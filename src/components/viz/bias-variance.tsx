"use client";

import { useMemo, useState } from "react";
import { rng, gaussian, linspace, mean as avg } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider } from "./controls";

const W = 640;
const H = 280;
const PAD = { l: 30, r: 14, t: 14, b: 26 };
const MAXDEG = 12;

// Solve (A)w = y for small systems via Gaussian elimination.
function solve(A: number[][], y: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c] || 1e-9;
    for (let j = c; j <= n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row[n]);
}

function polyfit(xs: number[], ys: number[], degree: number) {
  const cols = degree + 1;
  const X = xs.map((x) => Array.from({ length: cols }, (_, j) => x ** j));
  const XtX = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) => avg(X.map((row) => row[i] * row[j])) * xs.length),
  );
  // ridge for stability
  for (let i = 0; i < cols; i++) XtX[i][i] += 1e-6;
  const Xty = Array.from({ length: cols }, (_, i) => X.reduce((s, row, k) => s + row[i] * ys[k], 0));
  return solve(XtX, Xty);
}

const polyval = (c: number[], x: number) => c.reduce((s, ci, i) => s + ci * x ** i, 0);

const trueF = (x: number) => Math.sin(x * 3.1) * 0.8;

export function BiasVarianceExplorer() {
  const [degree, setDegree] = useState(1);

  const { train, test } = useMemo(() => {
    const r = rng(7);
    const train = linspace(-1, 1, 16).map((x) => ({ x, y: trueF(x) + gaussian(r, 0, 0.18) }));
    const r2 = rng(202);
    const test = linspace(-0.95, 0.95, 40).map((x) => ({ x, y: trueF(x) + gaussian(r2, 0, 0.18) }));
    return { train, test };
  }, []);

  const errorCurve = useMemo(() => {
    const out: { d: number; tr: number; te: number }[] = [];
    for (let d = 1; d <= MAXDEG; d++) {
      const c = polyfit(train.map((p) => p.x), train.map((p) => p.y), d);
      const tr = avg(train.map((p) => (polyval(c, p.x) - p.y) ** 2));
      const te = avg(test.map((p) => (polyval(c, p.x) - p.y) ** 2));
      out.push({ d, tr, te });
    }
    return out;
  }, [train, test]);

  const coeffs = useMemo(() => polyfit(train.map((p) => p.x), train.map((p) => p.y), degree), [train, degree]);
  const curve = useMemo(() => linspace(-1, 1, 120).map((x) => ({ x, y: polyval(coeffs, x) })), [coeffs]);
  const cur = errorCurve[degree - 1];

  const yMin = -1.4, yMax = 1.4;
  const sx = (x: number) => PAD.l + ((x + 1) / 2) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // error mini chart coords
  const ew = 220, eh = 120, ep = 24;
  const emax = Math.max(...errorCurve.flatMap((e) => [e.tr, Math.min(e.te, 0.5)])) * 1.1 || 1;
  const ex = (d: number) => ep + ((d - 1) / (MAXDEG - 1)) * (ew - ep - 8);
  const ey = (v: number) => eh - 16 - (Math.min(v, 0.5) / emax) * (eh - 16 - 8);

  const regime = degree <= 2 ? "Underfitting (high bias)" : degree >= 8 ? "Overfitting (high variance)" : "Good fit";
  const regimeColor = degree <= 2 ? "var(--warning)" : degree >= 8 ? "var(--danger)" : "var(--success)";

  return (
    <VizFrame
      title="Bias-Variance Tradeoff"
      hint="increase the degree"
      controls={
        <div className="space-y-3">
          <Slider label="Polynomial degree (model flexibility)" min={1} max={MAXDEG} step={1} value={degree} onChange={setDegree} />
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-semibold" style={{ color: regimeColor }}>{regime}</span>
            <span>train MSE <span className="font-mono text-foreground">{cur.tr.toFixed(3)}</span></span>
            <span>test MSE <span className="font-mono text-foreground">{cur.te.toFixed(3)}</span></span>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={PAD.l} y1={sy(0)} x2={W - PAD.r} y2={sy(0)} stroke="var(--border)" />
          {/* true function */}
          <path d={"M" + linspace(-1, 1, 80).map((x) => `${sx(x).toFixed(1)},${sy(trueF(x)).toFixed(1)}`).join(" L")} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
          {/* fit */}
          <path d={"M" + curve.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
          {/* train points */}
          {train.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1" />
          ))}
        </svg>

        <div className="rounded-xl border border-border bg-card-muted/30 p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Error vs complexity</div>
          <svg viewBox={`0 0 ${ew} ${eh}`} className="w-full">
            <line x1={ep} y1={eh - 16} x2={ew - 6} y2={eh - 16} stroke="var(--border)" />
            <line x1={ep} y1={8} x2={ep} y2={eh - 16} stroke="var(--border)" />
            <path d={"M" + errorCurve.map((e) => `${ex(e.d).toFixed(1)},${ey(e.tr).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" />
            <path d={"M" + errorCurve.map((e) => `${ex(e.d).toFixed(1)},${ey(e.te).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-pink)" strokeWidth="2" />
            <line x1={ex(degree)} y1={8} x2={ex(degree)} y2={eh - 16} stroke="var(--brand-violet)" strokeDasharray="3 3" />
            <circle cx={ex(degree)} cy={ey(cur.tr)} r={3} fill="var(--brand-cyan)" />
            <circle cx={ex(degree)} cy={ey(cur.te)} r={3} fill="var(--brand-pink)" />
          </svg>
          <div className="mt-1 flex flex-col gap-1 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-brand-cyan" /> train error</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded bg-brand-pink" /> test error</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-3 border-t border-dashed border-muted-foreground" /> true function</span>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
