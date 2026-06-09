"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { clamp, mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 320, PAD = 40;
const SEED = 42;

// Simulate N predictions with training-serving skew.
// skew=0: features match perfectly; skew=1: features maximally diverge.
// featureStore=true forces skew to 0.
function simulatePredictions(skew: number, staleness: number, n: number) {
  const rand = rng(SEED);
  const errors: number[] = [];
  for (let i = 0; i < n; i++) {
    // True signal
    const signal = gaussian(rand, 0, 1);
    // Training feature: computed accurately
    const trainFeature = signal + gaussian(rand, 0, 0.2);
    // Serving feature: may differ due to skew (logic mismatch) and staleness
    const skewNoise = gaussian(rand, 0, skew * 1.5);
    const stalenessNoise = gaussian(rand, staleness * 0.8, staleness * 0.6);
    const serveFeature = trainFeature + skewNoise + stalenessNoise;
    // Model learned on trainFeature; at serving it sees serveFeature
    const pred = serveFeature * 0.85;
    const truth = signal * 0.85;
    errors.push((pred - truth) ** 2);
  }
  const mse = errors.reduce((a, b) => a + b, 0) / n;
  // Accuracy metric: fraction within ±0.5 of true label
  const rand2 = rng(SEED + 1);
  let correct = 0;
  for (let i = 0; i < n; i++) {
    const signal = gaussian(rand2, 0, 1);
    const trainFeature = signal + gaussian(rand2, 0, 0.2);
    const skewNoise = gaussian(rand2, 0, skew * 1.5);
    const stalenessNoise = gaussian(rand2, staleness * 0.8, staleness * 0.6);
    const serveFeature = trainFeature + skewNoise + stalenessNoise;
    const pred = serveFeature * 0.85;
    const truth = signal * 0.85;
    if (Math.abs(pred - truth) < 0.5) correct++;
  }
  return { mse, accuracy: correct / n };
}

// Generate scatter points for the "feature space" chart
// Returns pairs (trainFeature, serveFeature) — perfect store means they're equal.
function featureScatter(skew: number, staleness: number, n: number, seedVal: number) {
  const rand = rng(seedVal + 99);
  const pts: { tx: number; sv: number }[] = [];
  for (let i = 0; i < n; i++) {
    const base = gaussian(rand, 0, 1);
    const tx = base + gaussian(rand, 0, 0.25);
    const offset = gaussian(rand, staleness * 0.8, skew * 1.2 + staleness * 0.5 + 0.15);
    const sv = tx + offset;
    pts.push({ tx, sv });
  }
  return pts;
}

export default function Viz() {
  const [skew, setSkew] = useState(0);
  const [staleness, setStaleness] = useState(0);
  const [useStore, setUseStore] = useState(false);
  const [seed, setSeed] = useState(SEED);

  const effectiveSkew = useStore ? 0 : skew;
  const effectiveStaleness = useStore ? 0 : staleness;

  const { mse, accuracy } = useMemo(
    () => simulatePredictions(effectiveSkew, effectiveStaleness, 400),
    [effectiveSkew, effectiveStaleness],
  );

  const baseAccuracy = useMemo(() => simulatePredictions(0, 0, 400).accuracy, []);
  const accDrop = baseAccuracy - accuracy;

  const scatter = useMemo(
    () => featureScatter(effectiveSkew, effectiveStaleness, 60, seed),
    [effectiveSkew, effectiveStaleness, seed],
  );

  const xMin = -3.5, xMax = 3.5, yMin = -3.5, yMax = 3.5;
  const sx = (v: number) => PAD + mapRange(v, xMin, xMax, 0, W - 2 * PAD);
  const sy = (v: number) => H - PAD - mapRange(v, yMin, yMax, 0, H - 2 * PAD);

  // Identity line: y = x (perfect feature store)
  const identLine = linspace(xMin, xMax, 2).map((v, i) => `${i === 0 ? "M" : "L"}${sx(v).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");

  const skewColor = accDrop < 0.03 ? "var(--success)" : accDrop < 0.12 ? "var(--warning)" : "var(--danger)";
  const storeGlow = useStore ? "0 0 0 2px var(--brand-indigo)" : "none";

  return (
    <VizFrame
      title="Feature Store: Training-Serving Skew"
      hint="toggle Feature Store ON to see skew eliminated"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <SegButton active={!useStore} onClick={() => setUseStore(false)}>No Feature Store</SegButton>
            <SegButton active={useStore} onClick={() => setUseStore(true)}>
              <span style={{ color: useStore ? undefined : "var(--brand-indigo)" }}>✦ Feature Store ON</span>
            </SegButton>
            <VizButton onClick={() => setSeed((s) => s + 1)} className="ml-auto">
              <RotateCcw size={12} /> Resample
            </VizButton>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Slider
              label="Logic skew"
              min={0} max={1} step={0.05}
              value={skew}
              onChange={setSkew}
              format={(v) => v === 0 ? "none" : v < 0.4 ? "low" : v < 0.7 ? "medium" : "high"}
            />
            <Slider
              label="Feature staleness"
              min={0} max={1} step={0.05}
              value={staleness}
              onChange={setStaleness}
              format={(v) => v === 0 ? "fresh" : v < 0.4 ? "mild" : v < 0.7 ? "stale" : "very stale"}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 px-3 py-2 text-center text-xs">
            <div className="space-y-0.5">
              <div className="font-mono text-foreground" style={{ color: skewColor }}>{(accuracy * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground">Serving accuracy</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-mono" style={{ color: accDrop > 0.005 ? "var(--danger)" : "var(--success)" }}>
                {accDrop > 0 ? "-" : ""}{(accDrop * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground">Accuracy drop</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-mono text-foreground">{mse.toFixed(3)}</div>
              <div className="text-[10px] text-muted-foreground">Pred MSE</div>
            </div>
          </div>
        </div>
      }
    >
      {/* Legend */}
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--brand-indigo)" opacity="0.7" /></svg>
          Training feature (x-axis)
        </span>
        <span className="flex items-center gap-1">
          <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--brand-pink)" opacity="0.7" /></svg>
          Serving feature (y-axis)
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="var(--success)" strokeWidth="2" strokeDasharray="4 2" /></svg>
          Perfect match (y = x)
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {range(5).map((i) => {
          const frac = i / 4;
          const xg = PAD + frac * (W - 2 * PAD);
          const yg = PAD + frac * (H - 2 * PAD);
          return (
            <g key={i}>
              <line x1={xg} y1={PAD} x2={xg} y2={H - PAD} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
              <line x1={PAD} y1={yg} x2={W - PAD} y2={yg} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
            </g>
          );
        })}

        {/* Axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={W - PAD + 2} y={sy(0) + 4} className="fill-[var(--muted-foreground)]" fontSize="9" textAnchor="start">train</text>
        <text x={sx(0) - 2} y={PAD - 4} className="fill-[var(--muted-foreground)]" fontSize="9" textAnchor="middle">serve</text>

        {/* Identity line y=x */}
        <path d={identLine} fill="none" stroke="var(--success)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />

        {/* Feature Store bounding box highlight */}
        {useStore && (
          <rect
            x={PAD} y={PAD}
            width={W - 2 * PAD} height={H - 2 * PAD}
            fill="none"
            stroke="var(--brand-indigo)"
            strokeWidth="2"
            rx="4"
            opacity="0.5"
            style={{ filter: `drop-shadow(${storeGlow})` }}
          />
        )}

        {/* Scatter points */}
        {scatter.map((pt, i) => {
          const cx = clamp(sx(pt.tx), PAD, W - PAD);
          const cy = clamp(sy(pt.sv), PAD, H - PAD);
          const dist = Math.abs(pt.sv - pt.tx);
          const opacity = mapRange(dist, 0, 3, 0.8, 0.3);
          const fill = dist < 0.4 ? "var(--brand-indigo)" : dist < 1.2 ? "var(--warning)" : "var(--danger)";
          return (
            <circle
              key={i}
              cx={cx} cy={cy}
              r={3.5}
              fill={fill}
              opacity={opacity}
              stroke="var(--background)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Skew label */}
        <text x={W - PAD - 2} y={PAD + 14} textAnchor="end" className="fill-[var(--muted-foreground)]" fontSize="9">
          {useStore ? "Feature Store: features always consistent" : `skew=${skew.toFixed(2)} staleness=${staleness.toFixed(2)}`}
        </text>

        {/* Accuracy badge */}
        <rect x={PAD} y={PAD + 4} width={110} height={22} rx="4" fill={skewColor} opacity="0.15" />
        <text x={PAD + 6} y={PAD + 19} fontSize="11" fontWeight="600" fill={skewColor}>
          {useStore ? "✦ No skew" : `Δ accuracy −${(accDrop * 100).toFixed(1)}%`}
        </text>
      </svg>
    </VizFrame>
  );
}
