"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, polyfit, polyval, rSquared, linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range } from "@/lib/utils";

const W = 620, H = 300, PAD = 36;

const TRUE_FN = (x: number) => 0.6 * Math.sin(x * 2.2) + 0.25 * x;

type Split = { trainEnd: number; valEnd: number };

function genPoints(n: number, seed: number) {
  const rand = rng(seed);
  return range(n).map((i) => {
    const x = -2.8 + (i / (n - 1)) * 5.6 + gaussian(rand, 0, 0.08);
    const y = TRUE_FN(x) + gaussian(rand, 0, 0.28);
    return { x, y };
  });
}

function fitAndScore(
  pts: { x: number; y: number }[],
  evalPts: { x: number; y: number }[],
  deg: number,
): number {
  if (pts.length <= deg) return 0;
  const coeffs = polyfit(pts.map((p) => p.x), pts.map((p) => p.y), deg);
  const preds = evalPts.map((p) => polyval(coeffs, p.x));
  return Math.max(0, rSquared(evalPts.map((p) => p.y), preds));
}

function fitCoeffs(pts: { x: number; y: number }[], deg: number): number[] {
  if (pts.length <= deg) return [];
  return polyfit(pts.map((p) => p.x), pts.map((p) => p.y), deg);
}

export default function Viz() {
  const [trainPct, setTrainPct] = useState(60);
  const [valPct, setValPct] = useState(20);
  const [degree, setDegree] = useState(3);
  const [leakage, setLeakage] = useState(false);
  const [seed, setSeed] = useState(42);

  const N = 60;
  const pts = useMemo(() => genPoints(N, seed), [seed]);

  const split = useMemo((): Split => {
    const trainEnd = Math.round((trainPct / 100) * N);
    const valEnd = trainEnd + Math.round((valPct / 100) * N);
    return { trainEnd, valEnd: Math.min(valEnd, N) };
  }, [trainPct, valPct]);

  const trainPts = useMemo(() => pts.slice(0, split.trainEnd), [pts, split]);
  const valPts = useMemo(() => pts.slice(split.trainEnd, split.valEnd), [pts, split]);
  const testPts = useMemo(() => pts.slice(split.valEnd), [pts, split]);

  const { coeffs, trainR2, valR2, testR2 } = useMemo(() => {
    const fitSet = leakage ? pts : trainPts;
    const c = fitCoeffs(fitSet, degree);
    if (c.length === 0) return { coeffs: [], trainR2: 0, valR2: 0, testR2: 0 };
    const tr = rSquared(trainPts.map((p) => p.y), trainPts.map((p) => polyval(c, p.x)));
    const vr = valPts.length > 1 ? rSquared(valPts.map((p) => p.y), valPts.map((p) => polyval(c, p.x))) : 0;
    const te = testPts.length > 1 ? rSquared(testPts.map((p) => p.y), testPts.map((p) => polyval(c, p.x))) : 0;
    return { coeffs: c, trainR2: Math.max(0, tr), valR2: Math.max(0, vr), testR2: Math.max(0, te) };
  }, [pts, trainPts, valPts, testPts, degree, leakage]);

  const xMin = -3.2, xMax = 3.2, yMin = -2.2, yMax = 2.2;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const curvePath = useMemo(() => {
    if (coeffs.length === 0) return "";
    return "M" + linspace(xMin, xMax, 160).map((v) => `${sx(v).toFixed(1)},${sy(polyval(coeffs, v)).toFixed(1)}`).join(" L");
  }, [coeffs]);

  const truePath = "M" + linspace(xMin, xMax, 160).map((v) => `${sx(v).toFixed(1)},${sy(TRUE_FN(v)).toFixed(1)}`).join(" L");

  const trainX1 = sx(pts[0]?.x ?? xMin);
  const trainX2 = split.trainEnd > 0 ? sx(pts[split.trainEnd - 1]?.x ?? xMin) : trainX1;
  const valX1 = split.trainEnd < N ? sx(pts[split.trainEnd]?.x ?? xMax) : sx(xMax);
  const valX2 = split.valEnd > split.trainEnd ? sx(pts[split.valEnd - 1]?.x ?? xMax) : valX1;
  const testX1 = split.valEnd < N ? sx(pts[split.valEnd]?.x ?? xMax) : sx(xMax);
  const testX2 = sx(pts[N - 1]?.x ?? xMax);

  const r2Color = (r: number) => r > 0.7 ? "var(--success)" : r > 0.4 ? "var(--warning)" : "var(--danger)";
  const leakDelta = leakage ? (testR2 - fitAndScore(trainPts, testPts, degree)) : 0;

  return (
    <VizFrame
      title="ML Workflow: Split → Train → Evaluate"
      hint="toggle Leakage to see inflated accuracy"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SegButton active={!leakage} onClick={() => setLeakage(false)}>Proper Split</SegButton>
            <SegButton active={leakage} onClick={() => setLeakage(true)}>Leakage (train on all)</SegButton>
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={12} /> New data</VizButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="Train %" min={20} max={70} step={5} value={trainPct} onChange={setTrainPct} format={(v) => `${v}%`} />
            <Slider label="Val %" min={5} max={30} step={5} value={valPct} onChange={setValPct} format={(v) => `${v}%`} />
          </div>
          <Slider label="Model complexity (polynomial degree)" min={1} max={9} step={1} value={degree} onChange={setDegree} />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Train R² <span className="font-mono font-semibold" style={{ color: r2Color(trainR2) }}>{trainR2.toFixed(3)}</span></span>
            {valPts.length > 1 && <span>Val R² <span className="font-mono font-semibold" style={{ color: r2Color(valR2) }}>{valR2.toFixed(3)}</span></span>}
            {testPts.length > 1 && <span>Test R² <span className="font-mono font-semibold" style={{ color: r2Color(testR2) }}>{testR2.toFixed(3)}</span></span>}
            {leakage && testPts.length > 1 && (
              <span className="font-semibold" style={{ color: "var(--danger)" }}>
                ⚠ leakage inflates test R² by +{Math.max(0, leakDelta).toFixed(3)}
              </span>
            )}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* region shading */}
        <rect x={trainX1} y={PAD} width={Math.max(0, trainX2 - trainX1)} height={H - 2 * PAD} fill="var(--brand-violet)" opacity="0.08" rx="3" />
        <rect x={valX1} y={PAD} width={Math.max(0, valX2 - valX1)} height={H - 2 * PAD} fill="var(--brand-cyan)" opacity="0.08" rx="3" />
        <rect x={testX1} y={PAD} width={Math.max(0, testX2 - testX1)} height={H - 2 * PAD} fill="var(--brand-pink)" opacity="0.08" rx="3" />

        {/* region labels */}
        {split.trainEnd > 3 && <text x={(trainX1 + trainX2) / 2} y={PAD - 6} textAnchor="middle" fontSize="10" fill="var(--brand-violet)" fontWeight="600">TRAIN</text>}
        {valPts.length > 2 && <text x={(valX1 + valX2) / 2} y={PAD - 6} textAnchor="middle" fontSize="10" fill="var(--brand-cyan)" fontWeight="600">VAL</text>}
        {testPts.length > 2 && <text x={(testX1 + testX2) / 2} y={PAD - 6} textAnchor="middle" fontSize="10" fill="var(--brand-pink)" fontWeight="600">TEST</text>}

        {/* axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />

        {/* true function */}
        <path d={truePath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />

        {/* fitted curve — red when leakage */}
        {curvePath && (
          <path d={curvePath} fill="none" stroke={leakage ? "var(--danger)" : "var(--brand-violet)"} strokeWidth="2.5" />
        )}

        {/* data points colored by split */}
        {trainPts.map((p, i) => (
          <circle key={`tr${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill="var(--brand-violet)" stroke="var(--background)" strokeWidth="1" opacity="0.85" />
        ))}
        {valPts.map((p, i) => (
          <circle key={`v${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1" opacity="0.85" />
        ))}
        {testPts.map((p, i) => (
          <circle key={`te${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="1" opacity="0.85" />
        ))}

        {/* leakage overlay: faint dashed border around all pts */}
        {leakage && (
          <rect x={trainX1 - 3} y={PAD - 2} width={testX2 - trainX1 + 6} height={H - 2 * PAD + 4}
            fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="5 3" rx="4" opacity="0.6" />
        )}

        {/* legend */}
        <circle cx={W - PAD - 110} cy={H - 8} r={3} fill="var(--muted-foreground)" opacity="0.5" />
        <text x={W - PAD - 103} y={H - 4} fontSize="9" fill="var(--muted-foreground)" opacity="0.7">true fn</text>
        <line x1={W - PAD - 60} y1={H - 8} x2={W - PAD - 48} y2={H - 8} stroke={leakage ? "var(--danger)" : "var(--brand-violet)"} strokeWidth="2" />
        <text x={W - PAD - 43} y={H - 4} fontSize="9" fill="var(--muted-foreground)" opacity="0.7">fitted</text>

        {/* test % label */}
        <text x={W - PAD} y={PAD - 6} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
          test {100 - trainPct - valPct}%
        </text>
      </svg>
    </VizFrame>
  );
}
