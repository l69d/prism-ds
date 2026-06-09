"use client";

import { useState, useMemo } from "react";
import { linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 640, H = 340, PAD = 44;
const CX = W / 2, CY = H / 2;
const SCALE = 100; // pixels per unit

// Compute 2x2 SVD: M = U * diag(s1,s2) * Vt
// Returns singular values s1>=s2>=0, and angle of right/left singular vectors
function svd2x2(a: number, b: number, c: number, d: number) {
  // Compute M^T M, find eigenvalues via quadratic
  const e = a * a + c * c;
  const f = a * b + c * d;
  const g = b * b + d * d;
  const tr = e + g;
  const det = e * g - f * f;
  const disc = Math.max(0, (tr / 2) ** 2 - det);
  const s1sq = tr / 2 + Math.sqrt(disc);
  const s2sq = Math.max(0, tr / 2 - Math.sqrt(disc));
  const s1 = Math.sqrt(s1sq);
  const s2 = Math.sqrt(s2sq);

  // Right singular vector v1 (eigenvector of M^T M for s1^2)
  let v1x: number, v1y: number;
  if (Math.abs(f) > 1e-9) {
    const vn = Math.sqrt(f * f + (s1sq - e) ** 2) || 1;
    v1x = f / vn;
    v1y = (s1sq - e) / vn;
  } else {
    v1x = e >= g ? 1 : 0;
    v1y = e >= g ? 0 : 1;
  }
  const v2x = -v1y, v2y = v1x;

  // Left singular vectors u1 = M v1 / s1
  const mv1x = a * v1x + b * v1y, mv1y = c * v1x + d * v1y;
  const u1x = s1 > 1e-9 ? mv1x / s1 : 1;
  const u1y = s1 > 1e-9 ? mv1y / s1 : 0;
  const u2x = -u1y, u2y = u1x;

  return { s1, s2, v1x, v1y, v2x, v2y, u1x, u1y, u2x, u2y };
}

function transformPt(a: number, b: number, c: number, d: number, x: number, y: number) {
  return { tx: a * x + b * y, ty: c * x + d * y };
}

export default function Viz() {
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(0.7);
  const [c, setC] = useState(0.3);
  const [d, setD] = useState(1.0);
  const [mode, setMode] = useState<"svd" | "eigen">("svd");

  const svd = useMemo(() => svd2x2(a, b, c, d), [a, b, c, d]);
  const det = a * d - b * c;

  // Circle points -> transformed ellipse
  const ellipsePts = useMemo(() => {
    return linspace(0, 2 * Math.PI, 120).map((t) => {
      const x = Math.cos(t), y = Math.sin(t);
      const { tx, ty } = transformPt(a, b, c, d, x, y);
      return { tx, ty };
    });
  }, [a, b, c, d]);

  const circlePts = useMemo(() => linspace(0, 2 * Math.PI, 80).map((t) => ({
    cx: Math.cos(t), cy: Math.sin(t)
  })), []);

  const sx = (v: number) => CX + v * SCALE;
  const sy = (v: number) => CY - v * SCALE;

  const ellipsePath = "M" + ellipsePts.map(({ tx, ty }) =>
    `${sx(tx).toFixed(1)},${sy(ty).toFixed(1)}`).join(" L") + " Z";

  const circlePath = "M" + circlePts.map(({ cx, cy }) =>
    `${sx(cx).toFixed(1)},${sy(cy).toFixed(1)}`).join(" L") + " Z";

  // Eigen vectors of M (only meaningful if symmetric-ish or for illustration)
  const trM = a + d, detM = a * d - b * c;
  const discM = Math.max(0, (trM / 2) ** 2 - detM);
  const lam1 = trM / 2 + Math.sqrt(discM);
  const lam2 = trM / 2 - Math.sqrt(discM);
  // eigenvector for lam1
  let ex1 = 1, ey1 = 0;
  if (Math.abs(b) > 1e-9) {
    const en = Math.sqrt(b * b + (lam1 - a) ** 2) || 1;
    ex1 = b / en; ey1 = (lam1 - a) / en;
  } else if (Math.abs(c) > 1e-9) {
    const en = Math.sqrt(c * c + (lam1 - d) ** 2) || 1;
    ex1 = (lam1 - d) / en; ey1 = c / en;
  }
  let ex2 = -ey1, ey2 = ex1;

  const { s1, s2, v1x, v1y, v2x, v2y, u1x, u1y, u2x, u2y } = svd;
  const energyPct = s1 > 1e-9 ? (s1 / (s1 + s2)) * 100 : 100;

  // Axis tick marks
  const ticks = range(5).map((i) => i - 2);

  function Arrow({ x1, y1, x2, y2, color, width = 2 }: {
    x1: number; y1: number; x2: number; y2: number; color: string; width?: number;
  }) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const hLen = 8;
    const ax1 = x2 - hLen * ux - hLen * 0.4 * uy;
    const ay1 = y2 - hLen * uy + hLen * 0.4 * ux;
    const ax2 = x2 - hLen * ux + hLen * 0.4 * uy;
    const ay2 = y2 - hLen * uy - hLen * 0.4 * ux;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} />
        <polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} />
      </g>
    );
  }

  return (
    <VizFrame
      title="Matrix Decompositions (SVD & Eigenvectors)"
      hint="adjust matrix entries — watch how the unit circle transforms"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="M[1,1] = a" value={a} min={-2} max={2.5} step={0.05}
              onChange={setA} format={(v) => v.toFixed(2)} />
            <Slider label="M[1,2] = b" value={b} min={-2} max={2.5} step={0.05}
              onChange={setB} format={(v) => v.toFixed(2)} />
            <Slider label="M[2,1] = c" value={c} min={-2} max={2.5} step={0.05}
              onChange={setC} format={(v) => v.toFixed(2)} />
            <Slider label="M[2,2] = d" value={d} min={-2} max={2.5} step={0.05}
              onChange={setD} format={(v) => v.toFixed(2)} />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              <SegButton active={mode === "svd"} onClick={() => setMode("svd")}>SVD Axes</SegButton>
              <SegButton active={mode === "eigen"} onClick={() => setMode("eigen")}>Eigenvectors</SegButton>
            </div>
            <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>σ₁ = <span className="font-mono text-foreground">{s1.toFixed(3)}</span></span>
              <span>σ₂ = <span className="font-mono text-foreground">{s2.toFixed(3)}</span></span>
              <span>det = <span className="font-mono text-foreground">{det.toFixed(2)}</span></span>
              <span>rank-1 energy = <span className="font-mono" style={{ color: "var(--brand-indigo)" }}>{energyPct.toFixed(1)}%</span></span>
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={sx(t)} y1={PAD} x2={sx(t)} y2={H - PAD}
              stroke="var(--border)" strokeWidth="1" opacity="0.5" strokeDasharray="3,3" />
            <line x1={PAD} y1={sy(t)} x2={W - PAD} y2={sy(t)}
              stroke="var(--border)" strokeWidth="1" opacity="0.5" strokeDasharray="3,3" />
            {t !== 0 && (
              <>
                <text x={sx(t)} y={CY + 14} textAnchor="middle" fontSize="9"
                  fill="var(--muted-foreground)">{t}</text>
                <text x={CX - 14} y={sy(t) + 3} textAnchor="end" fontSize="9"
                  fill="var(--muted-foreground)">{t}</text>
              </>
            )}
          </g>
        ))}
        {/* Axes */}
        <line x1={PAD} y1={CY} x2={W - PAD} y2={CY} stroke="var(--border)" strokeWidth="1.5" />
        <line x1={CX} y1={PAD} x2={CX} y2={H - PAD} stroke="var(--border)" strokeWidth="1.5" />

        {/* Unit circle */}
        <path d={circlePath} fill="var(--brand-indigo)" fillOpacity="0.07"
          stroke="var(--brand-indigo)" strokeWidth="1.5" strokeDasharray="5,4" />

        {/* Transformed ellipse */}
        <path d={ellipsePath} fill="var(--brand-violet)" fillOpacity="0.1"
          stroke="var(--brand-violet)" strokeWidth="2" />

        {/* SVD mode: right singular vectors on circle, left on ellipse */}
        {mode === "svd" && (
          <>
            <Arrow x1={CX} y1={CY} x2={sx(v1x)} y2={sy(v1y)}
              color="var(--brand-cyan)" width={2} />
            <Arrow x1={CX} y1={CY} x2={sx(v2x)} y2={sy(v2y)}
              color="var(--brand-cyan)" width={2} />
            <Arrow x1={CX} y1={CY} x2={sx(u1x * s1)} y2={sy(u1y * s1)}
              color="var(--brand-indigo)" width={2.5} />
            <Arrow x1={CX} y1={CY} x2={sx(u2x * s2)} y2={sy(u2y * s2)}
              color="var(--brand-pink)" width={2.5} />
            <text x={sx(v1x) + 6} y={sy(v1y) - 4} fontSize="10" fill="var(--brand-cyan)" fontWeight="600">v₁</text>
            <text x={sx(v2x) + 6} y={sy(v2y) - 4} fontSize="10" fill="var(--brand-cyan)" fontWeight="600">v₂</text>
            <text x={sx(u1x * s1) + 6} y={sy(u1y * s1) - 4} fontSize="10"
              fill="var(--brand-indigo)" fontWeight="600">σ₁u₁</text>
            <text x={sx(u2x * s2) + 6} y={sy(u2y * s2) - 4} fontSize="10"
              fill="var(--brand-pink)" fontWeight="600">σ₂u₂</text>
          </>
        )}

        {/* Eigenvector mode */}
        {mode === "eigen" && (
          <>
            <Arrow x1={CX} y1={CY} x2={sx(ex1 * lam1)} y2={sy(ey1 * lam1)}
              color="var(--brand-pink)" width={2.5} />
            <Arrow x1={CX} y1={CY} x2={sx(ex2 * lam2)} y2={sy(ey2 * lam2)}
              color="var(--warning)" width={2.5} />
            <text x={sx(ex1 * lam1) + 6} y={sy(ey1 * lam1) - 4} fontSize="10"
              fill="var(--brand-pink)" fontWeight="600">λ₁={lam1.toFixed(2)}</text>
            <text x={sx(ex2 * lam2) + 6} y={sy(ey2 * lam2) - 4} fontSize="10"
              fill="var(--warning)" fontWeight="600">λ₂={lam2.toFixed(2)}</text>
          </>
        )}

        {/* Legend */}
        <g>
          <line x1={W - PAD - 80} y1={16} x2={W - PAD - 65} y2={16}
            stroke="var(--brand-indigo)" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x={W - PAD - 62} y={19} fontSize="9" fill="var(--muted-foreground)">unit circle</text>
          <line x1={W - PAD - 80} y1={28} x2={W - PAD - 65} y2={28}
            stroke="var(--brand-violet)" strokeWidth="2" />
          <text x={W - PAD - 62} y={31} fontSize="9" fill="var(--muted-foreground)">M × circle</text>
        </g>
      </svg>
    </VizFrame>
  );
}
