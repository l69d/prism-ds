"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 560, H = 340, PAD = 28;
const COLORS = ["var(--brand-violet)", "var(--brand-cyan)"];
const GRID = 22; // cells per axis for decision heatmap

type Pt = { x: number; y: number; cls: 0 | 1 };

function makeData(seed: number): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  const centers: [number, number, 0 | 1][] = [
    [0.3, 0.35, 0], [0.28, 0.68, 0],
    [0.72, 0.3, 1], [0.7, 0.65, 1],
  ];
  for (const [cx, cy, cls] of centers) {
    for (let i = 0; i < 18; i++) {
      pts.push({
        x: clamp(cx + gaussian(r, 0, 0.09), 0.04, 0.96),
        y: clamp(cy + gaussian(r, 0, 0.09), 0.04, 0.96),
        cls,
      });
    }
  }
  return pts;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function predict(pts: Pt[], qx: number, qy: number, k: number): { cls: 0 | 1; neighborIdx: number[] } {
  const sorted = pts
    .map((p, i) => ({ i, d: dist(qx, qy, p.x, p.y) }))
    .sort((a, b) => a.d - b.d);
  const neighbors = sorted.slice(0, k);
  const neighborIdx = neighbors.map((n) => n.i);
  const votes = [0, 0];
  for (const n of neighbors) votes[pts[n.i].cls]++;
  const cls = (votes[1] >= votes[0] ? 1 : 0) as 0 | 1;
  return { cls, neighborIdx };
}

function buildHeatmap(pts: Pt[], k: number): (0 | 1)[][] {
  return Array.from({ length: GRID }, (_, row) =>
    Array.from({ length: GRID }, (_, col) => {
      const qx = (col + 0.5) / GRID;
      const qy = (row + 0.5) / GRID;
      return predict(pts, qx, qy, k).cls;
    }),
  );
}

export default function Viz() {
  const [seed, setSeed] = useState(42);
  const [k, setK] = useState(3);
  const [qx, setQx] = useState(0.5);
  const [qy, setQy] = useState(0.5);
  const [showBoundary, setShowBoundary] = useState(true);

  const pts = useMemo(() => makeData(seed), [seed]);
  const { cls: pred, neighborIdx } = useMemo(() => predict(pts, qx, qy, k), [pts, qx, qy, k]);
  const heatmap = useMemo(() => (showBoundary ? buildHeatmap(pts, k) : null), [pts, k, showBoundary]);

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const sy = (v: number) => PAD + v * (H - 2 * PAD);

  const cellW = (W - 2 * PAD) / GRID;
  const cellH = (H - 2 * PAD) / GRID;

  const neighborSet = new Set(neighborIdx);
  const kDists = neighborIdx.map((i) => dist(qx, qy, pts[i].x, pts[i].y));
  const maxDist = kDists.length ? Math.max(...kDists) : 0;
  const votes = [0, 0];
  for (const i of neighborIdx) votes[pts[i].cls]++;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;
    const nx = clamp((rawX * W - PAD) / (W - 2 * PAD), 0, 1);
    const ny = clamp((rawY * H - PAD) / (H - 2 * PAD), 0, 1);
    setQx(nx);
    setQy(ny);
  };

  return (
    <VizFrame
      title="k-Nearest Neighbors"
      hint="click the canvas to move the query point"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider
              label="k (neighbors to consult)"
              min={1}
              max={15}
              step={1}
              value={k}
              onChange={setK}
              format={(v) => String(v)}
            />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                <SegButton active={showBoundary} onClick={() => setShowBoundary(true)}>Decision regions</SegButton>
                <SegButton active={!showBoundary} onClick={() => setShowBoundary(false)}>Points only</SegButton>
              </div>
              <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={12} /> New data</VizButton>
            </div>
          </ControlGroup>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              Votes — <span style={{ color: COLORS[0] }}>Class A: <span className="font-mono font-semibold">{votes[0]}</span></span>
              {" / "}
              <span style={{ color: COLORS[1] }}>Class B: <span className="font-mono font-semibold">{votes[1]}</span></span>
            </span>
            <span>
              Prediction:{" "}
              <span className="font-mono font-semibold" style={{ color: COLORS[pred] }}>
                {pred === 0 ? "Class A" : "Class B"}
              </span>
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
        {/* Decision region heatmap */}
        {heatmap &&
          heatmap.map((row, ri) =>
            row.map((cell, ci) => (
              <rect
                key={`h${ri}-${ci}`}
                x={PAD + ci * cellW}
                y={PAD + ri * cellH}
                width={cellW + 0.5}
                height={cellH + 0.5}
                fill={cell === 0 ? "var(--brand-violet)" : "var(--brand-cyan)"}
                opacity={0.12}
              />
            )),
          )}

        {/* Border */}
        <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* Radius circle */}
        {maxDist > 0 && (
          <circle
            cx={sx(qx)}
            cy={sy(qy)}
            r={maxDist * (W - 2 * PAD)}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity={0.5}
          />
        )}

        {/* Lines to neighbors */}
        {neighborIdx.map((i) => (
          <line
            key={`nl${i}`}
            x1={sx(qx)}
            y1={sy(qy)}
            x2={sx(pts[i].x)}
            y2={sy(pts[i].y)}
            stroke={COLORS[pts[i].cls]}
            strokeWidth="1.2"
            opacity={0.45}
            strokeDasharray="3 2"
          />
        ))}

        {/* Training points */}
        {pts.map((p, i) => {
          const isNeighbor = neighborSet.has(i);
          return (
            <circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={isNeighbor ? 6 : 4.5}
              fill={COLORS[p.cls]}
              stroke={isNeighbor ? "var(--background)" : "none"}
              strokeWidth={isNeighbor ? 1.5 : 0}
              opacity={isNeighbor ? 1 : 0.55}
            />
          );
        })}

        {/* Query point */}
        <circle cx={sx(qx)} cy={sy(qy)} r={10} fill={COLORS[pred]} opacity={0.18} />
        <circle
          cx={sx(qx)}
          cy={sy(qy)}
          r={7}
          fill={COLORS[pred]}
          stroke="var(--background)"
          strokeWidth={2}
        />
        <text
          x={sx(qx)}
          y={sy(qy) + 4}
          textAnchor="middle"
          fontSize={8}
          fontWeight="bold"
          fill="var(--background)"
        >
          ?
        </text>

        {/* Legend */}
        <circle cx={PAD + 8} cy={H - 10} r={4} fill={COLORS[0]} />
        <text x={PAD + 15} y={H - 7} fontSize={9} fill="var(--muted-foreground)">Class A</text>
        <circle cx={PAD + 62} cy={H - 10} r={4} fill={COLORS[1]} />
        <text x={PAD + 69} y={H - 7} fontSize={9} fill="var(--muted-foreground)">Class B</text>
      </svg>
    </VizFrame>
  );
}
