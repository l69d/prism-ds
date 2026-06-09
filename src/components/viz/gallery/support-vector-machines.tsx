"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 360, PAD = 36;

type Pt = { x: number; y: number; label: 1 | -1 };

function makeDataset(seed: number, noise: number): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < 18; i++) {
    pts.push({ x: gaussian(r, -1.8 + noise * 0.4, 0.55 + noise * 0.35), y: gaussian(r, 0.6, 0.55 + noise * 0.2), label: 1 });
  }
  for (let i = 0; i < 18; i++) {
    pts.push({ x: gaussian(r, 1.8 - noise * 0.4, 0.55 + noise * 0.35), y: gaussian(r, -0.6, 0.55 + noise * 0.2), label: -1 });
  }
  return pts;
}

// Simplified SVM solver via SMO-style coordinate ascent approximation
function solveSVM(pts: Pt[], C: number, kernelType: "linear" | "rbf", gamma: number) {
  const n = pts.length;
  const alpha = new Array(n).fill(0);
  const K: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const xi = pts[i], xj = pts[j];
      if (kernelType === "linear") return xi.x * xj.x + xi.y * xj.y;
      const d2 = (xi.x - xj.x) ** 2 + (xi.y - xj.y) ** 2;
      return Math.exp(-gamma * d2);
    })
  );

  // Simple gradient ascent on dual
  const lr = 0.01;
  for (let pass = 0; pass < 400; pass++) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += alpha[j] * pts[j].label * K[i][j];
      const grad = 1 - pts[i].label * sum;
      alpha[i] = Math.min(Math.max(alpha[i] + lr * grad, 0), C);
    }
  }

  // Bias: average over support vectors
  let b = 0, svCount = 0;
  for (let i = 0; i < n; i++) {
    if (alpha[i] > 0.01) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += alpha[j] * pts[j].label * K[i][j];
      b += pts[i].label - sum;
      svCount++;
    }
  }
  b = svCount > 0 ? b / svCount : 0;

  return { alpha, b };
}

function decisionFn(x: number, y: number, pts: Pt[], alpha: number[], b: number, kernelType: "linear" | "rbf", gamma: number) {
  let val = b;
  for (let i = 0; i < pts.length; i++) {
    if (alpha[i] < 0.001) continue;
    const xi = pts[i];
    let k = kernelType === "linear" ? xi.x * x + xi.y * y : Math.exp(-gamma * ((xi.x - x) ** 2 + (xi.y - y) ** 2));
    val += alpha[i] * xi.label * k;
  }
  return val;
}

export default function Viz() {
  const [seed, setSeed] = useState(42);
  const [C, setC] = useState(1.0);
  const [noise, setNoise] = useState(0.3);
  const [kernel, setKernel] = useState<"linear" | "rbf">("linear");
  const [gamma, setGamma] = useState(1.0);

  const xMin = -4, xMax = 4, yMin = -3.5, yMax = 3.5;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const pts = useMemo(() => makeDataset(seed, noise), [seed, noise]);
  const { alpha, b } = useMemo(() => solveSVM(pts, C, kernel, gamma), [pts, C, kernel, gamma]);

  const svCount = useMemo(() => alpha.filter((a) => a > 0.01).length, [alpha]);

  // Build decision boundary contour path via marching squares-lite: sample grid
  const gridRes = 48;
  const xs = Array.from({ length: gridRes }, (_, i) => xMin + (i / (gridRes - 1)) * (xMax - xMin));
  const ys = Array.from({ length: gridRes }, (_, j) => yMin + (j / (gridRes - 1)) * (yMax - yMin));

  const decisionBoundaryPath = useMemo(() => {
    // Collect iso-contour points at val=0 and val=±1 via linear interp along grid edges
    const contour = (level: number) => {
      const segs: [number, number, number, number][] = [];
      for (let i = 0; i < gridRes - 1; i++) {
        for (let j = 0; j < gridRes - 1; j++) {
          const corners = [
            [xs[i], ys[j]], [xs[i + 1], ys[j]], [xs[i + 1], ys[j + 1]], [xs[i], ys[j + 1]],
          ] as [number, number][];
          const vals = corners.map(([cx, cy]) => decisionFn(cx, cy, pts, alpha, b, kernel, gamma) - level);
          const edges = [[0, 1], [1, 2], [2, 3], [3, 0]] as [number, number][];
          const crossPts: [number, number][] = [];
          for (const [a2, b2] of edges) {
            const va = vals[a2], vb = vals[b2];
            if ((va < 0 && vb > 0) || (va > 0 && vb < 0)) {
              const t = va / (va - vb);
              crossPts.push([corners[a2][0] + t * (corners[b2][0] - corners[a2][0]), corners[a2][1] + t * (corners[b2][1] - corners[a2][1])]);
            }
          }
          if (crossPts.length === 2) {
            segs.push([crossPts[0][0], crossPts[0][1], crossPts[1][0], crossPts[1][1]]);
          }
        }
      }
      return segs;
    };
    return { boundary: contour(0), marginPos: contour(1), marginNeg: contour(-1) };
  }, [pts, alpha, b, kernel, gamma, xs, ys]);

  // Margin width estimate (linear kernel only)
  const marginWidth = useMemo(() => {
    if (kernel !== "linear") return null;
    let wNorm = 0;
    for (let i = 0; i < pts.length; i++) {
      if (alpha[i] < 0.001) continue;
      for (let j = 0; j < pts.length; j++) {
        if (alpha[j] < 0.001) continue;
        wNorm += alpha[i] * alpha[j] * pts[i].label * pts[j].label * (pts[i].x * pts[j].x + pts[i].y * pts[j].y);
      }
    }
    wNorm = Math.sqrt(Math.max(wNorm, 1e-9));
    return (2 / wNorm).toFixed(2);
  }, [pts, alpha, kernel]);

  const renderSegs = (segs: [number, number, number, number][], stroke: string, sw: number, dasharray?: string) =>
    segs.map((seg, i) => (
      <line key={i} x1={sx(seg[0])} y1={sy(seg[1])} x2={sx(seg[2])} y2={sy(seg[3])}
        stroke={stroke} strokeWidth={sw} strokeDasharray={dasharray} />
    ));

  return (
    <VizFrame
      title="Support Vector Machines"
      hint="adjust C and noise to see support vectors shift"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="C (soft-margin penalty)" min={0.05} max={5} step={0.05} value={C} onChange={setC} format={(v) => v.toFixed(2)} />
            <Slider label="Dataset noise" min={0} max={1} step={0.05} value={noise} onChange={setNoise} format={(v) => v.toFixed(2)} />
          </ControlGroup>
          {kernel === "rbf" && (
            <Slider label="RBF gamma" min={0.1} max={4} step={0.1} value={gamma} onChange={setGamma} format={(v) => v.toFixed(1)} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <SegButton active={kernel === "linear"} onClick={() => setKernel("linear")}>Linear kernel</SegButton>
            <SegButton active={kernel === "rbf"} onClick={() => setKernel("rbf")}>RBF kernel</SegButton>
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={13} /> New data</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              SVs: <span className="font-mono text-foreground">{svCount}</span>
              {marginWidth && <> · margin: <span className="font-mono text-foreground">{marginWidth}</span></>}
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* margin lines (dashed) */}
        {renderSegs(decisionBoundaryPath.marginPos, "var(--brand-violet)", 1.2, "5 4")}
        {renderSegs(decisionBoundaryPath.marginNeg, "var(--brand-violet)", 1.2, "5 4")}

        {/* decision boundary */}
        {renderSegs(decisionBoundaryPath.boundary, "var(--brand-violet)", 2.2)}

        {/* data points */}
        {pts.map((p, i) => {
          const isSV = alpha[i] > 0.01;
          const color = p.label === 1 ? "var(--brand-cyan)" : "var(--brand-pink)";
          return (
            <g key={i}>
              {isSV && <circle cx={sx(p.x)} cy={sy(p.y)} r={10} fill="none" stroke={color} strokeWidth="1.8" opacity="0.7" />}
              <circle cx={sx(p.x)} cy={sy(p.y)} r={isSV ? 5.5 : 4} fill={color} opacity={isSV ? 1 : 0.55}
                stroke="var(--background)" strokeWidth={isSV ? 1.5 : 0.8} />
            </g>
          );
        })}

        {/* legend */}
        <circle cx={PAD + 8} cy={PAD + 8} r={5} fill="var(--brand-cyan)" />
        <text x={PAD + 18} y={PAD + 12} fontSize="11" fill="var(--muted-foreground)">Class +1</text>
        <circle cx={PAD + 80} cy={PAD + 8} r={5} fill="var(--brand-pink)" />
        <text x={PAD + 90} y={PAD + 12} fontSize="11" fill="var(--muted-foreground)">Class −1</text>
        <circle cx={PAD + 166} cy={PAD + 8} r={5} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" />
        <circle cx={PAD + 166} cy={PAD + 8} r={3} fill="var(--muted-foreground)" />
        <text x={PAD + 178} y={PAD + 12} fontSize="11" fill="var(--muted-foreground)">Support vector</text>
      </svg>
    </VizFrame>
  );
}
