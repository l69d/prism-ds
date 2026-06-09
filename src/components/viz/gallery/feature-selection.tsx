"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, pearson, mean, solveLinear } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { range, clamp } from "@/lib/utils";

const W = 620, H = 300, PAD = 40;
const N_TRAIN = 60, N_TEST = 40;

type Method = "filter" | "wrapper" | "embedded";

const FEAT_LABELS = ["F1", "F2", "F3", "F4", "F5"];
const FEAT_DESCS = [
  "strong signal",
  "moderate signal",
  "pure noise",
  "pure noise",
  "copy of F1",
];
const FEAT_COLORS = [
  "var(--brand-violet)",
  "var(--brand-cyan)",
  "var(--brand-pink)",
  "var(--warning)",
  "var(--brand-indigo)",
];

function genDataset(noiseLvl: number, seed: number) {
  const rand = rng(seed);
  const rows = N_TRAIN + N_TEST;
  const ys = range(rows).map(() => gaussian(rand));
  // F1: strong predictor + noise
  const f1 = ys.map(y => y * 0.85 + gaussian(rand, 0, 0.3 + noiseLvl * 0.4));
  // F2: moderate predictor + noise
  const f2 = ys.map(y => y * 0.45 + gaussian(rand, 0, 0.8 + noiseLvl * 0.6));
  // F3: pure noise
  const f3 = range(rows).map(() => gaussian(rand, 0, 1 + noiseLvl));
  // F4: pure noise
  const f4 = range(rows).map(() => gaussian(rand, 0, 1 + noiseLvl));
  // F5: redundant (copy of F1 + small noise)
  const f5 = f1.map(v => v + gaussian(rand, 0, 0.15 + noiseLvl * 0.2));
  const Xs = [f1, f2, f3, f4, f5];
  return { Xs, ys };
}

function fitLinear(Xs: number[][], ys: number[]): number[] {
  const n = ys.length, p = Xs.length;
  // design matrix with intercept
  const A: number[][] = range(n).map(i => [1, ...range(p).map(j => Xs[j][i])]);
  try {
    return solveLinear(A, ys);
  } catch {
    return new Array(p + 1).fill(0);
  }
}

function rSquared(ys: number[], preds: number[]): number {
  const ymean = mean(ys);
  const ssTot = ys.reduce((s, y) => s + (y - ymean) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  return ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, -1, 1);
}

function predict(coeffs: number[], Xs: number[][], start: number, end: number): number[] {
  return range(end - start).map(i => {
    let v = coeffs[0];
    for (let j = 0; j < Xs.length; j++) v += coeffs[j + 1] * Xs[j][start + i];
    return v;
  });
}

// Auto-select features by method threshold
function autoSelect(method: Method, cors: number[]): boolean[] {
  if (method === "filter") {
    const thresh = 0.25;
    return cors.map(c => Math.abs(c) >= thresh);
  }
  if (method === "wrapper") {
    // keep top 2 by |corr|
    const sorted = [...cors.map((c, i) => ({ i, c: Math.abs(c) }))].sort((a, b) => b.c - a.c);
    const top = new Set(sorted.slice(0, 2).map(x => x.i));
    return cors.map((_, i) => top.has(i));
  }
  // embedded: L1-like, threshold at 0.15
  return cors.map(c => Math.abs(c) >= 0.15);
}

export default function Viz() {
  const [noiseLvl, setNoiseLvl] = useState(0.5);
  const [method, setMethod] = useState<Method>("filter");
  const [manual, setManual] = useState<boolean[] | null>(null);
  const [seed] = useState(77);

  const { Xs, ys } = useMemo(() => genDataset(noiseLvl, seed), [noiseLvl, seed]);

  const trainYs = ys.slice(0, N_TRAIN);
  const testYs = ys.slice(N_TRAIN);

  const trainCors = useMemo(
    () => FEAT_LABELS.map((_, fi) => pearson(Xs[fi].slice(0, N_TRAIN), trainYs)),
    [Xs, trainYs]
  );

  const autoSel = useMemo(() => autoSelect(method, trainCors), [method, trainCors]);
  const selected = manual ?? autoSel;

  const activeIdxs = range(5).filter(i => selected[i]);

  const { trainR2, testR2 } = useMemo(() => {
    if (activeIdxs.length === 0) return { trainR2: 0, testR2: 0 };
    const activeXsTrain = activeIdxs.map(i => Xs[i].slice(0, N_TRAIN));
    const activeXsTest = activeIdxs.map(i => Xs[i].slice(N_TRAIN));
    const coeffs = fitLinear(activeXsTrain, trainYs);
    const trainPreds = predict(coeffs, activeXsTrain, 0, N_TRAIN);
    const testPreds = predict(coeffs, activeXsTest, 0, N_TEST);
    return { trainR2: rSquared(trainYs, trainPreds), testR2: rSquared(testYs, testPreds) };
  }, [activeIdxs, Xs, trainYs, testYs]);

  const barW = (W - 2 * PAD) / 5 - 8;
  const maxBar = H - 2 * PAD - 24;

  return (
    <VizFrame
      title="Feature Selection"
      hint="Toggle features on/off and watch test R² change"
      controls={
        <div className="space-y-4">
          <Slider label="Noise level" min={0} max={1.5} step={0.05} value={noiseLvl} onChange={v => { setNoiseLvl(v); setManual(null); }} format={v => v.toFixed(2)} />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Selection method</p>
            <div className="flex flex-wrap gap-1.5">
              {(["filter", "wrapper", "embedded"] as Method[]).map(m => (
                <SegButton key={m} active={method === m && manual === null} onClick={() => { setMethod(m); setManual(null); }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SegButton>
              ))}
            </div>
          </div>
          <ControlGroup>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground">Train R²</span>
              <div className="font-mono text-sm text-foreground">{trainR2.toFixed(3)}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground">Test R²</span>
              <div className="font-mono text-sm" style={{ color: testR2 > 0.35 ? "var(--success)" : testR2 > 0.1 ? "var(--warning)" : "var(--danger)" }}>
                {testR2.toFixed(3)}
              </div>
            </div>
          </ControlGroup>
          <VizButton onClick={() => setManual(null)}>Reset to method</VizButton>
          <p className="text-xs text-muted-foreground">
            {method === "filter" ? "Filter: rank by |corr| with target, keep above threshold." : method === "wrapper" ? "Wrapper: try subsets, pick best by CV score." : "Embedded: L1/Lasso drives weak weights to zero."}
          </p>
        </div>
      }
    >
      <p className="mb-1 text-xs text-muted-foreground text-center">Click bars to toggle features manually · bar height = |correlation with target|</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axis */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <text x={14} y={H / 2} fontSize="9" fill="var(--muted-foreground)" textAnchor="middle" transform={`rotate(-90,14,${H / 2})`}>|correlation|</text>

        {/* y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1.0].map(v => {
          const cy = H - PAD - v * maxBar;
          return (
            <g key={v}>
              <line x1={PAD - 3} y1={cy} x2={PAD} y2={cy} stroke="var(--border)" />
              <text x={PAD - 5} y={cy + 3} fontSize="8" fill="var(--muted-foreground)" textAnchor="end">{v.toFixed(2)}</text>
            </g>
          );
        })}

        {/* Filter threshold line */}
        {method === "filter" && (
          <line x1={PAD} y1={H - PAD - 0.25 * maxBar} x2={W - PAD} y2={H - PAD - 0.25 * maxBar}
            stroke="var(--brand-violet)" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
        )}

        {/* Feature bars */}
        {FEAT_LABELS.map((label, fi) => {
          const absCor = Math.abs(trainCors[fi]);
          const bh = clamp(absCor * maxBar, 2, maxBar);
          const bx = PAD + 20 + fi * ((W - 2 * PAD) / 5);
          const by = H - PAD - bh;
          const isOn = selected[fi];
          return (
            <g key={fi} style={{ cursor: "pointer" }} onClick={() => {
              const next = [...(manual ?? selected)];
              next[fi] = !next[fi];
              setManual(next);
            }}>
              {/* Shadow/bg rect */}
              <rect x={bx} y={PAD} width={barW} height={H - 2 * PAD} rx="3" fill={isOn ? FEAT_COLORS[fi] : "var(--border)"} opacity="0.08" />
              {/* Main bar */}
              <rect x={bx} y={by} width={barW} height={bh} rx="3"
                fill={isOn ? FEAT_COLORS[fi] : "var(--muted-foreground)"}
                opacity={isOn ? 0.85 : 0.3}
              />
              {/* Correlation value */}
              <text x={bx + barW / 2} y={by - 4} fontSize="9" textAnchor="middle"
                fill={isOn ? FEAT_COLORS[fi] : "var(--muted-foreground)"} opacity={isOn ? 1 : 0.5}>
                {absCor.toFixed(2)}
              </text>
              {/* Feature label */}
              <text x={bx + barW / 2} y={H - PAD + 13} fontSize="10" textAnchor="middle"
                fill={isOn ? "var(--foreground)" : "var(--muted-foreground)"} fontWeight={isOn ? "600" : "400"}>
                {label}
              </text>
              {/* Description */}
              <text x={bx + barW / 2} y={H - PAD + 24} fontSize="8" textAnchor="middle" fill="var(--muted-foreground)" opacity="0.7">
                {FEAT_DESCS[fi]}
              </text>
              {/* Selected badge */}
              {isOn && (
                <circle cx={bx + barW - 4} cy={by + 8} r="5" fill={FEAT_COLORS[fi]} opacity="0.9" />
              )}
            </g>
          );
        })}

        {/* Method label */}
        <text x={W - PAD} y={PAD - 8} fontSize="9" textAnchor="end" fill="var(--brand-violet)" opacity="0.8">
          {manual !== null ? "manual" : method} · {activeIdxs.length} feature{activeIdxs.length !== 1 ? "s" : ""} selected
        </text>
      </svg>
    </VizFrame>
  );
}
