"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, std } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { clamp } from "@/lib/utils";

const W = 640, H = 320, PAD = 36;
type Method = "none" | "standard" | "minmax" | "robust";

function makeData(seed: number) {
  const r = rng(seed);
  const n = 28;
  const ages = Array.from({ length: n }, () => clamp(gaussian(r, 38, 10), 18, 65));
  const salaries = ages.map((a) => clamp(a * 1800 + gaussian(r, 0, 8000), 20000, 180000));
  return { ages, salaries };
}

function medianVal(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function iqrOf(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return s[Math.floor(n * 0.75)] - s[Math.floor(n * 0.25)];
}

function scaleFeature(xs: number[], method: Method): number[] {
  if (method === "none") return xs;
  if (method === "standard") {
    const m = mean(xs), s = std(xs) || 1;
    return xs.map((x) => (x - m) / s);
  }
  if (method === "minmax") {
    const lo = Math.min(...xs), hi = Math.max(...xs);
    const range = hi - lo || 1;
    return xs.map((x) => (x - lo) / range);
  }
  // robust
  const med = medianVal(xs);
  const scale = iqrOf(xs) || 1;
  return xs.map((x) => (x - med) / scale);
}

const METHODS: { id: Method; label: string }[] = [
  { id: "none", label: "Raw" },
  { id: "standard", label: "Standardize" },
  { id: "minmax", label: "Min-Max" },
  { id: "robust", label: "Robust" },
];

export default function Viz() {
  const [method, setMethod] = useState<Method>("none");
  const [seed, setSeed] = useState(42);
  const [outlier, setOutlier] = useState(false);

  const { ages, salaries } = useMemo(() => {
    const base = makeData(seed);
    if (!outlier) return base;
    return {
      ages: [...base.ages, 62],
      salaries: [...base.salaries, 170000],
    };
  }, [seed, outlier]);

  const scaledX = useMemo(() => scaleFeature(ages, method), [ages, method]);
  const scaledY = useMemo(() => scaleFeature(salaries, method), [salaries, method]);

  const xMin = Math.min(...scaledX), xMax = Math.max(...scaledX);
  const yMin = Math.min(...scaledY), yMax = Math.max(...scaledY);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const sx = (v: number) => PAD + ((v - xMin) / xRange) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / yRange) * (H - 2 * PAD);

  // Distance between two representative points (first two points)
  const rawDx = ages[0] - ages[1];
  const rawDy = salaries[0] - salaries[1];
  const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

  const scaledDx = scaledX[0] - scaledX[1];
  const scaledDy = scaledY[0] - scaledY[1];
  const scaledDist = Math.sqrt(scaledDx * scaledDx + scaledDy * scaledDy);

  const xLabel = method === "none" ? "Age (years)" : "Age (scaled)";
  const yLabel = method === "none" ? "Salary ($)" : "Salary (scaled)";

  const xStd = std(scaledX).toFixed(2);
  const yStd = std(scaledY).toFixed(2);
  const xMean = mean(scaledX).toFixed(1);
  const yMean = mean(scaledY).toFixed(1);

  const methodDesc: Record<Method, string> = {
    none: "Raw features — scale dominates distance",
    standard: "z = (x − μ) / σ  →  mean=0, std=1",
    minmax: "x′ = (x − min) / (max − min)  →  range [0, 1]",
    robust: "x′ = (x − median) / IQR  →  outlier-resilient",
  };

  return (
    <VizFrame
      title="Feature Scaling"
      hint="switch scaling method and watch distances change"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Scaling method</p>
              <div className="flex flex-wrap gap-1.5">
                {METHODS.map((m) => (
                  <SegButton key={m.id} active={method === m.id} onClick={() => setMethod(m.id)}>
                    {m.label}
                  </SegButton>
                ))}
              </div>
            </div>
            <Slider label="Dataset seed" min={1} max={99} step={1} value={seed} onChange={(v) => setSeed(Math.round(v))} format={(v) => `#${Math.round(v)}`} />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={outlier} onChange={(e) => setOutlier(e.target.checked)} className="accent-[var(--brand-cyan)]" />
              <span>Add outlier</span>
            </label>
            <span>Age — mean: <span className="font-mono text-foreground">{xMean}</span> std: <span className="font-mono text-foreground">{xStd}</span></span>
            <span>Salary — mean: <span className="font-mono text-foreground">{yMean}</span> std: <span className="font-mono text-foreground">{yStd}</span></span>
          </div>
        </div>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{methodDesc[method]}</p>
        <span className="shrink-0 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs">
          dist: <span style={{ color: "var(--brand-cyan)" }}>{scaledDist.toFixed(3)}</span>
          <span className="mx-1 text-muted-foreground">/</span>
          raw: <span className="text-muted-foreground">{rawDist.toFixed(0)}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="fs-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--brand-indigo)" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        {/* background */}
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="url(#fs-grad)" rx="4" />
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        {/* axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{xLabel}</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90, 10, ${H / 2})`}>{yLabel}</text>
        {/* zero crosshairs for scaled modes */}
        {method !== "none" && (
          <>
            <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
            <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          </>
        )}
        {/* distance line between first two points */}
        <line
          x1={sx(scaledX[0])} y1={sy(scaledY[0])}
          x2={sx(scaledX[1])} y2={sy(scaledY[1])}
          stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75"
        />
        {/* data points */}
        {scaledX.map((x, i) => {
          const isOutlierPt = outlier && i === scaledX.length - 1;
          const isHighlight = i === 0 || i === 1;
          return (
            <circle
              key={i}
              cx={sx(x)}
              cy={sy(scaledY[i])}
              r={isHighlight ? 5.5 : isOutlierPt ? 5 : 4}
              fill={isHighlight ? "var(--brand-cyan)" : isOutlierPt ? "var(--danger)" : "var(--brand-indigo)"}
              opacity={isHighlight ? 0.95 : isOutlierPt ? 0.9 : 0.65}
              stroke={isHighlight ? "var(--background)" : "none"}
              strokeWidth="1.5"
            />
          );
        })}
        {/* legend callout */}
        <circle cx={PAD + 10} cy={PAD + 12} r={4.5} fill="var(--brand-cyan)" opacity="0.95" stroke="var(--background)" strokeWidth="1.5" />
        <text x={PAD + 19} y={PAD + 16} fontSize="10" fill="var(--muted-foreground)">pair (distance shown)</text>
        {outlier && (
          <>
            <circle cx={PAD + 130} cy={PAD + 12} r={4} fill="var(--danger)" opacity="0.9" />
            <text x={PAD + 139} y={PAD + 16} fontSize="10" fill="var(--muted-foreground)">outlier</text>
          </>
        )}
      </svg>
    </VizFrame>
  );
}
