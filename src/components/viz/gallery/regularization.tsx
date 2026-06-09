"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean, polyval, solveLinear } from "@/lib/mathx";
import { clamp, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 620, H = 300, PAD = 36;
const DEGREE = 7;
const N_POINTS = 18;

const trueF = (x: number) => Math.sin(x * Math.PI * 0.9) * 0.85;

function ridgeFit(xs: number[], ys: number[], lambda: number): number[] {
  const cols = DEGREE + 1;
  const X = xs.map((x) => Array.from({ length: cols }, (_, j) => x ** j));
  const XtX = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)),
  );
  for (let i = 1; i < cols; i++) XtX[i][i] += lambda;
  const Xty = Array.from({ length: cols }, (_, i) => X.reduce((s, row, k) => s + row[i] * ys[k], 0));
  return solveLinear(XtX, Xty);
}

function lassoFit(xs: number[], ys: number[], lambda: number): number[] {
  const cols = DEGREE + 1;
  const X = xs.map((x) => Array.from({ length: cols }, (_, j) => x ** j));
  let w = new Array(cols).fill(0);
  const n = xs.length;
  for (let iter = 0; iter < 300; iter++) {
    for (let j = 0; j < cols; j++) {
      const rj = xs.map((_, i) => ys[i] - X[i].reduce((s, xij, k) => k === j ? s : s + xij * w[k], 0));
      const rho = X.reduce((s, row, i) => s + row[j] * rj[i], 0) / n;
      const xjSq = X.reduce((s, row) => s + row[j] * row[j], 0) / n;
      const lam = j === 0 ? 0 : lambda / 2;
      w[j] = xjSq < 1e-10 ? 0 : Math.sign(rho) * clamp(Math.abs(rho) - lam, 0, Infinity) / xjSq;
    }
  }
  return w;
}

export default function Viz() {
  const [logLambda, setLogLambda] = useState(0);
  const [mode, setMode] = useState<"L2" | "L1">("L2");

  const lambda = Math.pow(10, logLambda);

  const { xs, ys } = useMemo(() => {
    const r = rng(42);
    const xs = linspace(-1, 1, N_POINTS);
    const ys = xs.map((x) => trueF(x) + gaussian(r, 0, 0.15));
    return { xs, ys };
  }, []);

  const coeffs = useMemo(
    () => (mode === "L2" ? ridgeFit(xs, ys, lambda) : lassoFit(xs, ys, lambda)),
    [xs, ys, lambda, mode],
  );

  const curvePts = useMemo(
    () => linspace(-1, 1, 140).map((x) => ({ x, y: polyval(coeffs, x) })),
    [coeffs],
  );

  const trainMSE = useMemo(() => {
    const preds = xs.map((x) => polyval(coeffs, x));
    return mean(xs.map((_, i) => (preds[i] - ys[i]) ** 2));
  }, [xs, ys, coeffs]);

  const coefNorm = useMemo(() => {
    const c = coeffs.slice(1);
    return mode === "L2"
      ? Math.sqrt(c.reduce((s, v) => s + v * v, 0))
      : c.reduce((s, v) => s + Math.abs(v), 0);
  }, [coeffs, mode]);

  const xMin = -1, xMax = 1, yMin = -1.6, yMax = 1.6;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const curvePath = "M" + curvePts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" L");
  const truePath = "M" + linspace(-1, 1, 80).map((x) => `${sx(x).toFixed(1)},${sy(trueF(x)).toFixed(1)}`).join(" L");

  const BAR_W = 160, BAR_H = 120, BAR_PAD = 20;
  const displayCoeffs = coeffs.slice(1, 8);
  const maxAbs = Math.max(...displayCoeffs.map(Math.abs), 0.1);
  const barW = (BAR_W - BAR_PAD * 2) / displayCoeffs.length - 3;
  const bx = (i: number) => BAR_PAD + i * ((BAR_W - BAR_PAD * 2) / displayCoeffs.length) + barW / 2;
  const zeroY = BAR_PAD + (BAR_H - BAR_PAD * 2) / 2;
  const bh = (v: number) => ((Math.abs(v) / maxAbs) * ((BAR_H - BAR_PAD * 2) / 2)) * 0.9;
  const sparsity = displayCoeffs.filter((v) => Math.abs(v) < 0.01).length;

  const regime =
    logLambda < -2 ? "Overfitting — large coefficients" :
    logLambda > 1  ? "Underfitting — heavy penalty" :
                     "Balanced — good generalization";
  const regimeColor =
    logLambda < -2 ? "var(--danger)" :
    logLambda > 1  ? "var(--warning)" :
                     "var(--success)";

  return (
    <VizFrame
      title="Regularization (L1 / L2)"
      hint="drag λ and watch coefficients shrink"
      controls={
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <SegButton active={mode === "L2"} onClick={() => setMode("L2")}>Ridge (L2)</SegButton>
            <SegButton active={mode === "L1"} onClick={() => setMode("L1")}>Lasso (L1)</SegButton>
          </div>
          <ControlGroup>
            <Slider
              label="log₁₀(λ) — penalty strength"
              min={-3} max={2} step={0.1}
              value={logLambda}
              onChange={setLogLambda}
              format={(v) => `λ = ${Math.pow(10, v).toFixed(v < 0 ? 3 : 1)}`}
            />
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span>train MSE <span className="font-mono text-foreground">{trainMSE.toFixed(3)}</span></span>
              <span>{mode === "L2" ? "‖w‖₂" : "‖w‖₁"} <span className="font-mono text-foreground">{coefNorm.toFixed(2)}</span></span>
              {mode === "L1" && <span>zero coeffs <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{sparsity} / {displayCoeffs.length}</span></span>}
              <span className="font-semibold" style={{ color: regimeColor }}>{regime}</span>
            </div>
          </ControlGroup>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
          <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
          <path d={truePath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />
          <path d={curvePath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
          {range(N_POINTS).map((i) => (
            <circle key={i} cx={sx(xs[i])} cy={sy(ys[i])} r={4} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.2" />
          ))}
          <text x={W - PAD - 4} y={sy(0) - 6} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">x</text>
          <text x={sx(0) + 5} y={PAD + 10} fontSize="10" fill="var(--muted-foreground)">y</text>
        </svg>

        <div className="rounded-xl border border-border bg-card/40 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Coefficients w₁…w₇</div>
          <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full">
            <line x1={BAR_PAD} y1={zeroY} x2={BAR_W - BAR_PAD} y2={zeroY} stroke="var(--border)" />
            {displayCoeffs.map((v, i) => {
              const h = bh(v);
              const isZero = Math.abs(v) < 0.01;
              return (
                <rect
                  key={i}
                  x={bx(i) - barW / 2}
                  y={v >= 0 ? zeroY - h : zeroY}
                  width={barW}
                  height={Math.max(h, 1)}
                  fill={isZero ? "var(--muted-foreground)" : "var(--brand-violet)"}
                  opacity={isZero ? 0.3 : 0.85}
                  rx="1.5"
                />
              );
            })}
            {displayCoeffs.map((_, i) => (
              <text key={i} x={bx(i)} y={BAR_H - 4} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
                w{i + 1}
              </text>
            ))}
          </svg>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded" style={{ background: "var(--brand-violet)" }} /> active
            </span>
            {mode === "L1" && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-3 rounded opacity-30" style={{ background: "var(--muted-foreground)" }} /> zeroed (sparse)
              </span>
            )}
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
