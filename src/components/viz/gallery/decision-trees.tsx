"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 560, H = 340, PAD = 36;

type Point = { x: number; y: number; cls: 0 | 1 };

type SplitAxis = "x" | "y";

function gini(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  return 1 - counts.reduce((s, c) => s + (c / n) ** 2, 0);
}

function splitGini(pts: Point[], axis: SplitAxis, threshold: number): number {
  const left = pts.filter((p) => p[axis] < threshold);
  const right = pts.filter((p) => p[axis] >= threshold);
  const n = pts.length;
  if (n === 0) return 0;
  const gL = gini([left.filter((p) => p.cls === 0).length, left.filter((p) => p.cls === 1).length]);
  const gR = gini([right.filter((p) => p.cls === 0).length, right.filter((p) => p.cls === 1).length]);
  return (left.length / n) * gL + (right.length / n) * gR;
}

function bestSplit(pts: Point[], axis: SplitAxis): number {
  const vals = pts.map((p) => p[axis]).sort((a, b) => a - b);
  let bestG = Infinity, bestT = 0.5;
  for (let i = 0; i < vals.length - 1; i++) {
    const t = (vals[i] + vals[i + 1]) / 2;
    const g = splitGini(pts, axis, t);
    if (g < bestG) { bestG = g; bestT = t; }
  }
  return bestT;
}

function makeData(seed: number, n: number): Point[] {
  const r = rng(seed);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const cls = r() > 0.5 ? 1 : 0;
    const cx = cls === 0 ? 0.32 : 0.68;
    const cy = cls === 0 ? 0.35 : 0.65;
    pts.push({ x: clamp(cx + gaussian(r, 0, 0.14), 0.04, 0.96), y: clamp(cy + gaussian(r, 0, 0.14), 0.04, 0.96), cls });
  }
  return pts;
}

const sx = (v: number) => PAD + v * (W - 2 * PAD);
const sy = (v: number) => PAD + (1 - v) * (H - 2 * PAD);

export default function Viz() {
  const [seed, setSeed] = useState(42);
  const [nPts, setNPts] = useState(60);
  const [axis, setAxis] = useState<SplitAxis>("x");
  const [splitPos, setSplitPos] = useState(0.5);
  const [depth2, setDepth2] = useState(false);

  const pts = useMemo(() => makeData(seed, nPts), [seed, nPts]);

  const rootGini = useMemo(
    () => gini([pts.filter((p) => p.cls === 0).length, pts.filter((p) => p.cls === 1).length]),
    [pts]
  );
  const weightedGini = useMemo(() => splitGini(pts, axis, splitPos), [pts, axis, splitPos]);
  const infoGain = rootGini - weightedGini;

  const leftPts = useMemo(() => pts.filter((p) => p[axis] < splitPos), [pts, axis, splitPos]);
  const rightPts = useMemo(() => pts.filter((p) => p[axis] >= splitPos), [pts, axis, splitPos]);

  const split2Left = useMemo(() => depth2 ? bestSplit(leftPts, axis === "x" ? "y" : "x") : null, [depth2, leftPts, axis]);
  const split2Right = useMemo(() => depth2 ? bestSplit(rightPts, axis === "x" ? "y" : "x") : null, [depth2, rightPts, axis]);

  const nodeColor = (p: Point) => {
    if (!depth2) return p[axis] < splitPos ? "var(--brand-violet)" : "var(--brand-cyan)";
    const secondAxis = axis === "x" ? "y" : "x";
    if (p[axis] < splitPos) return p[secondAxis] < (split2Left ?? 0.5) ? "var(--brand-violet)" : "var(--brand-pink)";
    return p[secondAxis] < (split2Right ?? 0.5) ? "var(--brand-cyan)" : "var(--brand-indigo)";
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const dataX = (relX * W - PAD) / (W - 2 * PAD);
    const dataY = 1 - (relY * H - PAD) / (H - 2 * PAD);
    setSplitPos(clamp(axis === "x" ? dataX : dataY, 0.05, 0.95));
  };

  return (
    <VizFrame
      title="Decision Trees"
      hint="Click the plot to move the split — watch Gini impurity drop"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <SegButton active={axis === "x"} onClick={() => setAxis("x")}>Split on X</SegButton>
            <SegButton active={axis === "y"} onClick={() => setAxis("y")}>Split on Y</SegButton>
            <SegButton active={depth2} onClick={() => setDepth2((d) => !d)}>Depth 2</SegButton>
          </div>
          <Slider label="Points" min={20} max={120} step={10} value={nPts} onChange={setNPts} format={(v) => String(v)} />
          <div className="flex items-center gap-3 flex-wrap">
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={13} /> New data</VizButton>
            <span className="text-xs text-muted-foreground">
              Root Gini <span className="font-mono text-foreground">{rootGini.toFixed(3)}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              After split <span className="font-mono text-foreground">{weightedGini.toFixed(3)}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Info gain <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{infoGain.toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair"
        onClick={handleSvgClick}
      >
        {/* background regions */}
        {axis === "x" ? (
          <>
            <rect x={PAD} y={PAD} width={(splitPos) * (W - 2 * PAD)} height={H - 2 * PAD} fill="var(--brand-violet)" opacity="0.06" />
            <rect x={PAD + splitPos * (W - 2 * PAD)} y={PAD} width={(1 - splitPos) * (W - 2 * PAD)} height={H - 2 * PAD} fill="var(--brand-cyan)" opacity="0.06" />
          </>
        ) : (
          <>
            <rect x={PAD} y={PAD + (1 - splitPos) * (H - 2 * PAD)} width={W - 2 * PAD} height={splitPos * (H - 2 * PAD)} fill="var(--brand-violet)" opacity="0.06" />
            <rect x={PAD} y={PAD} width={W - 2 * PAD} height={(1 - splitPos) * (H - 2 * PAD)} fill="var(--brand-cyan)" opacity="0.06" />
          </>
        )}

        {/* depth-2 secondary splits */}
        {depth2 && split2Left !== null && (
          axis === "x"
            ? <line x1={PAD} y1={sy(split2Left)} x2={PAD + splitPos * (W - 2 * PAD)} y2={sy(split2Left)} stroke="var(--brand-pink)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
            : <line x1={sx(split2Left)} y1={PAD} x2={sx(split2Left)} y2={sy(splitPos)} stroke="var(--brand-pink)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        )}
        {depth2 && split2Right !== null && (
          axis === "x"
            ? <line x1={PAD + splitPos * (W - 2 * PAD)} y1={sy(split2Right)} x2={W - PAD} y2={sy(split2Right)} stroke="var(--brand-indigo)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
            : <line x1={sx(split2Right)} y1={sy(splitPos)} x2={sx(split2Right)} y2={H - PAD} stroke="var(--brand-indigo)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        )}

        {/* primary split line */}
        {axis === "x" ? (
          <line x1={PAD + splitPos * (W - 2 * PAD)} y1={PAD} x2={PAD + splitPos * (W - 2 * PAD)} y2={H - PAD} stroke="var(--brand-violet)" strokeWidth="2" />
        ) : (
          <line x1={PAD} y1={PAD + (1 - splitPos) * (H - 2 * PAD)} x2={W - PAD} y2={PAD + (1 - splitPos) * (H - 2 * PAD)} stroke="var(--brand-violet)" strokeWidth="2" />
        )}

        {/* border */}
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={5}
            fill={nodeColor(p)}
            stroke={p.cls === 0 ? "var(--brand-violet)" : "var(--brand-cyan)"}
            strokeWidth="1.2"
            opacity="0.85"
          />
        ))}

        {/* Gini labels on each side */}
        {leftPts.length > 0 && (
          <text
            x={PAD + (axis === "x" ? (splitPos * (W - 2 * PAD)) / 2 : (W - 2 * PAD) / 2)}
            y={axis === "x" ? PAD + 16 : PAD + (1 - splitPos) * (H - 2 * PAD) / 2 + 5}
            textAnchor="middle"
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            G={gini([leftPts.filter((p) => p.cls === 0).length, leftPts.filter((p) => p.cls === 1).length]).toFixed(3)}
          </text>
        )}
        {rightPts.length > 0 && (
          <text
            x={axis === "x" ? PAD + splitPos * (W - 2 * PAD) + ((1 - splitPos) * (W - 2 * PAD)) / 2 : PAD + (W - 2 * PAD) / 2}
            y={axis === "x" ? PAD + 16 : H - PAD - (splitPos * (H - 2 * PAD)) / 2}
            textAnchor="middle"
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            G={gini([rightPts.filter((p) => p.cls === 0).length, rightPts.filter((p) => p.cls === 1).length]).toFixed(3)}
          </text>
        )}

        {/* split position label */}
        {axis === "x" ? (
          <text x={PAD + splitPos * (W - 2 * PAD)} y={H - PAD + 14} textAnchor="middle" fontSize="10" fill="var(--brand-violet)">
            x={splitPos.toFixed(2)}
          </text>
        ) : (
          <text x={PAD - 4} y={PAD + (1 - splitPos) * (H - 2 * PAD) + 4} textAnchor="end" fontSize="10" fill="var(--brand-violet)">
            y={splitPos.toFixed(2)}
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
