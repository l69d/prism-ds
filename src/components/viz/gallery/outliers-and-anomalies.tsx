"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, std, linspace, normalPdf } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 640, H = 320, PAD = { l: 44, r: 20, t: 20, b: 36 };
const BASE_N = 60;
const SEEDS = [42, 77, 13, 99, 55];

type Method = "zscore" | "iqr" | "both";
type OType = "error" | "rare" | "signal";

const OUTLIER_LABELS: Record<OType, { label: string; color: string; desc: string }> = {
  error: { label: "Measurement error", color: "var(--danger)", desc: "Impossible value — clamp or remove" },
  rare:  { label: "Rare event",        color: "var(--warning)", desc: "Legitimate but extreme — keep with care" },
  signal:{ label: "Signal / fraud",    color: "var(--brand-cyan)", desc: "Pattern-breaking — investigate first" },
};

function quartiles(xs: number[]): { q1: number; q3: number; iqr: number } {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length / 2;
  const lo = s.slice(0, Math.floor(mid));
  const hi = s.slice(Math.ceil(mid));
  const q1 = lo[Math.floor(lo.length / 2)] ?? s[0] ?? 0;
  const q3 = hi[Math.floor(hi.length / 2)] ?? s[s.length - 1] ?? 0;
  return { q1, q3, iqr: q3 - q1 };
}

export default function Viz() {
  const [seedIdx, setSeedIdx] = useState(0);
  const [contamination, setContamination] = useState(3);
  const [zThresh, setZThresh] = useState(2.5);
  const [method, setMethod] = useState<Method>("zscore");
  const [oType, setOType] = useState<OType>("error");

  const { pts, muClean, sigClean, flaggedZ, flaggedIQR, muAll, muRobust } = useMemo(() => {
    const rand = rng(SEEDS[seedIdx % SEEDS.length]);
    const clean = Array.from({ length: BASE_N }, () => gaussian(rand, 50, 8));
    const n_out = contamination;

    const outlierMap: Record<OType, () => number> = {
      error:  () => gaussian(rand, 50, 8) + (rand() > 0.5 ? 1 : -1) * (30 + rand() * 15),
      rare:   () => gaussian(rand, 50, 8) + (rand() > 0.5 ? 1 : -1) * (22 + rand() * 10),
      signal: () => 80 + rand() * 12,
    };

    const outliers = Array.from({ length: n_out }, outlierMap[oType]);
    const all = [...clean, ...outliers];
    const mu = mean(all);
    const sig = std(all);
    const muC = mean(clean);
    const sigC = std(clean);

    const pts = all.map((v, i) => ({ v, isOut: i >= BASE_N }));

    const flagZ = new Set(
      pts.map((p, i) => ({ i, z: Math.abs((p.v - mu) / (sig || 1)) }))
         .filter(({ z }) => z > zThresh)
         .map(({ i }) => i)
    );
    const { q1, q3, iqr } = quartiles(all);
    const fence = 1.5 * iqr;
    const flagIQR = new Set(
      pts.map((p, i) => ({ i, v: p.v }))
         .filter(({ v }) => v < q1 - fence || v > q3 + fence)
         .map(({ i }) => i)
    );

    const sorted = [...all].sort((a, b) => a - b);
    const muR = sorted[Math.floor(sorted.length / 2)] ?? mean(all);

    return {
      pts, muClean: muC, sigClean: sigC,
      flaggedZ: flagZ, flaggedIQR: flagIQR,
      muAll: mu, muRobust: muR,
    };
  }, [seedIdx, contamination, zThresh, oType]);

  const allVals = pts.map(p => p.v);
  const xMin = Math.min(...allVals) - 4, xMax = Math.max(...allVals) + 4;
  const sx = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);

  const curveYMax = normalPdf(0, 0, sigClean) * 1.25;
  const sy = (y: number) => H - PAD.b - clamp((y / curveYMax) * (H - PAD.t - PAD.b), 0, H - PAD.t - PAD.b);

  const curvePath = "M" + linspace(xMin, xMax, 200).map(v => {
    const y = normalPdf(v, muClean, sigClean);
    return `${sx(v).toFixed(1)},${sy(y).toFixed(1)}`;
  }).join(" L");

  const isFlagged = (i: number): boolean => {
    if (method === "zscore") return flaggedZ.has(i);
    if (method === "iqr")    return flaggedIQR.has(i);
    return flaggedZ.has(i) || flaggedIQR.has(i);
  };

  const flagCount = pts.filter((_, i) => isFlagged(i)).length;
  const trueOut = pts.filter((_, i) => isFlagged(i) && pts[i].isOut).length;
  const precision = flagCount > 0 ? (trueOut / flagCount * 100) : 0;

  const biasPct = Math.abs((muAll - muClean) / (muClean || 1) * 100);
  const robustBias = Math.abs((muRobust - muClean) / (muClean || 1) * 100);

  const dotColor = (i: number): string => {
    if (pts[i].isOut) return OUTLIER_LABELS[oType].color;
    if (isFlagged(i)) return "var(--brand-pink)";
    return "var(--brand-cyan)";
  };

  const dotOpacity = (i: number): number => isFlagged(i) || pts[i].isOut ? 1 : 0.55;

  return (
    <VizFrame
      title="Outliers & Anomalies"
      hint="adjust threshold — watch mean vs median drift"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider label="Outliers injected" min={0} max={8} step={1} value={contamination}
              onChange={setContamination} format={v => `${v}`} />
            <Slider label="Z-score threshold" min={1.5} max={4} step={0.1} value={zThresh}
              onChange={setZThresh} format={v => v.toFixed(1)} />
          </ControlGroup>
          <div className="flex flex-wrap gap-3 border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">Flagged: <span className="font-mono text-foreground">{flagCount}</span></span>
            <span className="text-muted-foreground">Precision: <span className="font-mono text-foreground">{precision.toFixed(0)}%</span></span>
            <span className="text-muted-foreground">Mean bias: <span className="font-mono" style={{ color: biasPct > 3 ? "var(--danger)" : "var(--success)" }}>{biasPct.toFixed(1)}%</span></span>
            <span className="text-muted-foreground">Median bias: <span className="font-mono" style={{ color: robustBias > 1 ? "var(--warning)" : "var(--success)" }}>{robustBias.toFixed(1)}%</span></span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <SegButton active={method === "zscore"} onClick={() => setMethod("zscore")}>Z-score</SegButton>
          <SegButton active={method === "iqr"}    onClick={() => setMethod("iqr")}>IQR fence</SegButton>
          <SegButton active={method === "both"}   onClick={() => setMethod("both")}>Both</SegButton>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["error", "rare", "signal"] as OType[]).map(t => (
            <SegButton key={t} active={oType === t} onClick={() => setOType(t)}>
              {OUTLIER_LABELS[t].label.split(" ")[0]}
            </SegButton>
          ))}
          <VizButton onClick={() => setSeedIdx(s => s + 1)}><RotateCcw size={12} /> Reseed</VizButton>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="oa-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />

        {/* normal curve over clean data */}
        <path d={`${curvePath} L${sx(xMax)},${sy(0)} L${sx(xMin)},${sy(0)} Z`} fill="url(#oa-fill)" />
        <path d={curvePath} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" opacity="0.8" />

        {/* mean line (affected by outliers) */}
        <line x1={sx(muAll)} y1={PAD.t} x2={sx(muAll)} y2={H - PAD.b}
          stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.9" />
        <text x={sx(muAll) + 3} y={PAD.t + 14} fontSize="9" fill="var(--danger)" opacity="0.9">mean</text>

        {/* median line (robust) */}
        <line x1={sx(muRobust)} y1={PAD.t} x2={sx(muRobust)} y2={H - PAD.b}
          stroke="var(--success)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.85" />
        <text x={sx(muRobust) + 3} y={PAD.t + 26} fontSize="9" fill="var(--success)" opacity="0.9">median</text>

        {/* Z-score threshold bands */}
        {(method === "zscore" || method === "both") && (() => {
          const lo = sx(muAll - zThresh * (std(allVals) || 1));
          const hi = sx(muAll + zThresh * (std(allVals) || 1));
          return (
            <>
              <rect x={PAD.l} y={PAD.t} width={Math.max(0, lo - PAD.l)} height={H - PAD.t - PAD.b}
                fill="var(--danger)" opacity="0.06" />
              <rect x={hi} y={PAD.t} width={Math.max(0, W - PAD.r - hi)} height={H - PAD.t - PAD.b}
                fill="var(--danger)" opacity="0.06" />
              <line x1={lo} y1={PAD.t} x2={lo} y2={H - PAD.b} stroke="var(--danger)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1={hi} y1={PAD.t} x2={hi} y2={H - PAD.b} stroke="var(--danger)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            </>
          );
        })()}

        {/* data dots — jittered vertically for stripe plot */}
        {pts.map((p, i) => {
          const jitter = ((i * 37 + 11) % 17) / 17 * 28 - 14;
          const cy = H - PAD.b - 20 + jitter;
          const isF = isFlagged(i);
          return (
            <g key={i}>
              {isF && (
                <circle cx={sx(p.v)} cy={cy} r={9} fill={dotColor(i)} opacity={0.18} />
              )}
              <circle
                cx={sx(p.v)} cy={cy} r={isF || p.isOut ? 5 : 3.5}
                fill={dotColor(i)}
                stroke={p.isOut ? "var(--foreground)" : "none"}
                strokeWidth={p.isOut ? 0.8 : 0}
                opacity={dotOpacity(i)}
              />
            </g>
          );
        })}

        {/* x axis ticks */}
        {linspace(Math.ceil(xMin / 10) * 10, Math.floor(xMax / 10) * 10, 6).map((v, i) => (
          <g key={i}>
            <line x1={sx(v)} y1={H - PAD.b} x2={sx(v)} y2={H - PAD.b + 4} stroke="var(--border)" />
            <text x={sx(v)} y={H - PAD.b + 16} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{v.toFixed(0)}</text>
          </g>
        ))}

        {/* legend */}
        <g transform={`translate(${PAD.l}, 8)`}>
          <circle cx={6} cy={6} r={4} fill="var(--brand-cyan)" opacity="0.7" />
          <text x={14} y={10} fontSize="9" fill="var(--muted-foreground)">normal</text>
          <circle cx={70} cy={6} r={5} fill={OUTLIER_LABELS[oType].color} stroke="var(--foreground)" strokeWidth="0.8" />
          <text x={79} y={10} fontSize="9" fill="var(--muted-foreground)">{oType}</text>
          <circle cx={148} cy={6} r={4} fill="var(--brand-pink)" opacity="0.85" />
          <text x={156} y={10} fontSize="9" fill="var(--muted-foreground)">false positive</text>
        </g>
      </svg>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {OUTLIER_LABELS[oType].desc}
      </p>
    </VizFrame>
  );
}
