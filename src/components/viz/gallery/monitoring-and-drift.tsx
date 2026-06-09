"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { rng, gaussian, linspace, mean, std } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 620, H = 300, PAD = 40;
const N_TRAIN = 80;
const N_WINDOW = 20;
const STEPS = 50;
const ALERT_THRESHOLD = 0.28;

type DriftMode = "data" | "concept";

function buildTrainStats(seed: number): { mu: number; sigma: number; slope: number; intercept: number } {
  const r = rng(seed);
  const xs = linspace(0, 1, N_TRAIN);
  const ys = xs.map((x) => 1.5 * x + 0.5 + gaussian(r, 0, 0.12));
  const mu = mean(ys);
  const sigma = std(ys);
  const slope = 1.5;
  const intercept = 0.5;
  return { mu, sigma, slope, intercept };
}

function windowError(
  step: number, totalSteps: number, driftStrength: number, mode: DriftMode,
  trainStats: { mu: number; sigma: number; slope: number; intercept: number },
  seed: number
): number {
  const r = rng(seed * 1000 + step);
  const t = step / totalSteps;
  const xs = linspace(0, 1, N_WINDOW);
  let errs: number[] = [];
  for (const x of xs) {
    const driftedMu = mode === "data"
      ? trainStats.mu + driftStrength * t * 1.5
      : trainStats.mu;
    const driftedSlope = mode === "concept"
      ? trainStats.slope + driftStrength * t * 2.5
      : trainStats.slope;
    const trueY = mode === "data"
      ? driftedMu + (x - 0.5) * 1.2 + gaussian(r, 0, 0.1)
      : driftedSlope * x + trainStats.intercept + gaussian(r, 0, 0.1);
    const predY = trainStats.slope * x + trainStats.intercept;
    errs.push(Math.abs(trueY - predY));
  }
  return mean(errs);
}

export default function Viz() {
  const [driftStrength, setDriftStrength] = useState(1.0);
  const [mode, setMode] = useState<DriftMode>("data");
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [seed] = useState(42);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trainStats = useMemo(() => buildTrainStats(seed), [seed]);

  const errors = useMemo(() => {
    return linspace(0, STEPS, STEPS + 1).map((s) =>
      windowError(Math.round(s), STEPS, driftStrength, mode, trainStats, seed)
    );
  }, [driftStrength, mode, trainStats, seed]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= STEPS) { setPlaying(false); return s; }
          return s + 1;
        });
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const handleReset = () => { setPlaying(false); setStep(0); };

  const xMin = 0, xMax = STEPS, yMin = 0, yMax = 0.6;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - clamp((v - yMin) / (yMax - yMin), 0, 1) * (H - 2 * PAD);

  const errorPath = "M" + errors.slice(0, step + 1).map((e, i) =>
    `${sx(i).toFixed(1)},${sy(e).toFixed(1)}`
  ).join(" L");

  const alertY = sy(ALERT_THRESHOLD);
  const currentError = errors[step] ?? 0;
  const alertFired = currentError > ALERT_THRESHOLD;

  const trainMu = trainStats.mu;
  const trainSigma = trainStats.sigma;
  const t = step / STEPS;
  const liveMu = mode === "data" ? trainMu + driftStrength * t * 1.5 : trainMu;
  const liveSigma = mode === "data" ? trainSigma * (1 + driftStrength * t * 0.3) : trainSigma;

  const distXs = linspace(trainMu - 3 * trainSigma - 0.4, trainMu + 3 * trainSigma + 0.4, 80);
  const trainDist = distXs.map((x) => {
    const z = (x - trainMu) / trainSigma;
    return Math.exp(-0.5 * z * z) / (trainSigma * Math.sqrt(2 * Math.PI));
  });
  const liveDist = distXs.map((x) => {
    const z = (x - liveMu) / liveSigma;
    return Math.exp(-0.5 * z * z) / (liveSigma * Math.sqrt(2 * Math.PI));
  });

  const DW = 200, DH = 120, DPAD = 16;
  const dxMin = distXs[0], dxMax = distXs[distXs.length - 1];
  const dyMax = Math.max(...trainDist, ...liveDist) * 1.1;
  const dsx = (v: number) => DPAD + ((v - dxMin) / (dxMax - dxMin)) * (DW - 2 * DPAD);
  const dsy = (v: number) => DH - DPAD - clamp(v / dyMax, 0, 1) * (DH - 2 * DPAD);

  const trainPath = "M" + distXs.map((x, i) => `${dsx(x).toFixed(1)},${dsy(trainDist[i]).toFixed(1)}`).join(" L");
  const livePath = "M" + distXs.map((x, i) => `${dsx(x).toFixed(1)},${dsy(liveDist[i]).toFixed(1)}`).join(" L");

  const psiApprox = mode === "data" ? Math.abs(liveMu - trainMu) / (trainSigma + 0.001) : 0;

  return (
    <VizFrame
      title="Monitoring & Drift"
      hint="press Play and watch MAE climb"
      controls={
        <ControlGroup>
          <Slider
            label="Drift strength"
            min={0} max={2} step={0.1} value={driftStrength}
            onChange={(v) => { setDriftStrength(v); handleReset(); }}
            format={(v) => v.toFixed(1)}
          />
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Drift type</div>
            <div className="flex gap-1.5">
              <SegButton active={mode === "data"} onClick={() => { setMode("data"); handleReset(); }}>Data drift</SegButton>
              <SegButton active={mode === "concept"} onClick={() => { setMode("concept"); handleReset(); }}>Concept drift</SegButton>
            </div>
          </div>
        </ControlGroup>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <VizButton onClick={() => { if (step >= STEPS) handleReset(); setPlaying((p) => !p); }}>
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? "Pause" : step >= STEPS ? "Replay" : "Play"}
        </VizButton>
        <VizButton onClick={handleReset}><RotateCcw size={13} />Reset</VizButton>
        <span className="ml-auto text-xs text-muted-foreground">
          MAE&nbsp;
          <span className="font-mono" style={{ color: alertFired ? "var(--danger)" : "var(--foreground)" }}>
            {currentError.toFixed(3)}
          </span>
          {alertFired && (
            <span className="ml-2 rounded bg-danger/15 px-1.5 py-0.5 font-semibold text-danger" style={{ color: "var(--danger)" }}>
              ⚠ Retrain!
            </span>
          )}
        </span>
        {mode === "data" && (
          <span className="text-xs text-muted-foreground">
            PSI&nbsp;<span className="font-mono text-foreground">{psiApprox.toFixed(2)}</span>
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" />
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
            <g key={v}>
              <line x1={PAD - 4} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeDasharray="3 4" opacity="0.4" />
              <text x={PAD - 6} y={sy(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{v.toFixed(1)}</text>
            </g>
          ))}
          {[0, 10, 20, 30, 40, 50].map((v) => (
            <text key={v} x={sx(v)} y={H - PAD + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{v}</text>
          ))}
          <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Time step</text>
          <line x1={PAD} y1={alertY} x2={W - PAD} y2={alertY} stroke="var(--danger)" strokeDasharray="6 4" opacity="0.7" strokeWidth="1.5" />
          <text x={W - PAD + 4} y={alertY + 4} fontSize="10" fill="var(--danger)">alert</text>
          {step > 0 && <path d={errorPath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" strokeLinejoin="round" />}
          {step > 0 && (
            <circle cx={sx(step)} cy={sy(currentError)} r={5}
              fill={alertFired ? "var(--danger)" : "var(--brand-indigo)"}
              stroke="var(--background)" strokeWidth="2" />
          )}
          <rect x={PAD} y={PAD} width={sx(step) - PAD} height={H - 2 * PAD}
            fill="var(--brand-indigo)" opacity="0.04" />
        </svg>

        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            {mode === "data" ? "Feature distribution shift" : "Label relationship shift"}
          </div>
          <svg viewBox={`0 0 ${DW} ${DH}`} className="w-full">
            <path d={trainPath} fill="var(--brand-indigo)" fillOpacity="0.2" stroke="var(--brand-indigo)" strokeWidth="1.5" />
            {step > 0 && <path d={livePath} fill="var(--warning)" fillOpacity="0.15" stroke="var(--warning)" strokeWidth="1.5" />}
          </svg>
          <div className="mt-1 flex flex-col gap-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded" style={{ background: "var(--brand-indigo)", opacity: 0.7 }} />
              Train distribution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded" style={{ background: "var(--warning)", opacity: 0.7 }} />
              Live (t={step})
            </span>
            {mode === "concept" && step > 0 && (
              <span className="mt-1 text-[10px]" style={{ color: "var(--warning)" }}>
                P(Y|X) changed — same inputs, different outputs
              </span>
            )}
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
