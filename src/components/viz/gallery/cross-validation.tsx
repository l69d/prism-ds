"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean, polyfit, polyval } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 640, H = 220, PAD = 30;
const N = 40;
const TRUE_F = (x: number) => Math.sin(x * 2.4) * 0.9 + 0.3 * x;

function mse(ys: number[], preds: number[]): number {
  return mean(ys.map((y, i) => (y - preds[i]) ** 2));
}

export default function Viz() {
  const [k, setK] = useState(5);
  const [degree, setDegree] = useState(3);
  const [activeF, setActiveF] = useState(0);
  const [seed] = useState(42);

  const { xs, ys } = useMemo(() => {
    const r = rng(seed);
    const xs = linspace(-1, 1, N);
    const ys = xs.map((x) => TRUE_F(x) + gaussian(r, 0, 0.25));
    return { xs, ys };
  }, [seed]);

  const foldSize = Math.floor(N / k);

  const folds = useMemo(() => range(k).map((i) => {
    const start = i * foldSize;
    const end = i === k - 1 ? N : start + foldSize;
    return range(end - start).map((j) => start + j);
  }), [k, foldSize]);

  const cvErrors = useMemo(() => range(k).map((fi) => {
    const valIdx = folds[fi];
    const trainIdx = range(N).filter((i) => !valIdx.includes(i));
    const txs = trainIdx.map((i) => xs[i]);
    const tys = trainIdx.map((i) => ys[i]);
    const vxs = valIdx.map((i) => xs[i]);
    const vys = valIdx.map((i) => ys[i]);
    const coeffs = polyfit(txs, tys, degree);
    const vpreds = vxs.map((x) => polyval(coeffs, x));
    return mse(vys, vpreds);
  }), [k, folds, xs, ys, degree]);

  const cvMean = mean(cvErrors);
  const cvStd = Math.sqrt(mean(cvErrors.map((e) => (e - cvMean) ** 2)));

  const activeCoeffs = useMemo(() => {
    const valIdx = folds[activeF] ?? [];
    const trainIdx = range(N).filter((i) => !valIdx.includes(i));
    return polyfit(trainIdx.map((i) => xs[i]), trainIdx.map((i) => ys[i]), degree);
  }, [folds, activeF, xs, ys, degree]);

  const fullCoeffs = useMemo(() => polyfit(xs, ys, degree), [xs, ys, degree]);

  const xMin = -1.1, xMax = 1.1, yMin = -2.0, yMax = 2.0;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const curvePath = (coeffs: number[]) =>
    "M" + linspace(xMin, xMax, 160).map((v) => `${sx(v).toFixed(1)},${sy(polyval(coeffs, v)).toFixed(1)}`).join(" L");

  const maxErr = Math.max(...cvErrors) * 1.15 || 1;
  const barW = 28, barGap = 10;
  const bx = (fi: number) => 16 + fi * (barW + barGap);
  const by = (e: number) => 110 - (e / maxErr) * 90;

  const validIdx = folds[activeF] ?? [];

  return (
    <VizFrame
      title="Cross-Validation"
      hint="change k or fold to see the split"
      controls={
        <ControlGroup>
          <Slider
            label="k (number of folds)"
            min={2} max={10} step={1} value={k}
            onChange={(v) => { setK(v); setActiveF(0); }}
            format={(v) => `${v}-fold`}
          />
          <Slider
            label="Model complexity (degree)"
            min={1} max={8} step={1} value={degree}
            onChange={setDegree}
            format={(v) => `poly-${v}`}
          />
        </ControlGroup>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Active fold:</span>
        {range(k).map((fi) => (
          <SegButton key={fi} active={activeF === fi} onClick={() => setActiveF(fi)}>
            {fi + 1}
          </SegButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
            <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

            {/* True function */}
            <path
              d={"M" + linspace(xMin, xMax, 160).map((v) => `${sx(v).toFixed(1)},${sy(TRUE_F(v)).toFixed(1)}`).join(" L")}
              fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5"
            />

            {/* Full-data fit */}
            <path d={curvePath(fullCoeffs)} fill="none" stroke="var(--brand-indigo)" strokeWidth="1.5" opacity="0.45" strokeDasharray="4 3" />

            {/* Active fold fit */}
            <path d={curvePath(activeCoeffs)} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />

            {/* Training points */}
            {range(N).filter((i) => !validIdx.includes(i)).map((i) => (
              <circle key={i} cx={sx(xs[i])} cy={sy(ys[i])} r={3.5} fill="var(--brand-cyan)" opacity="0.75" stroke="var(--background)" strokeWidth="0.8" />
            ))}

            {/* Validation points */}
            {validIdx.map((i) => (
              <circle key={i} cx={sx(xs[i])} cy={sy(ys[i])} r={4.5} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="1.2" />
            ))}
          </svg>

          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ background: "var(--brand-cyan)" }} /> train ({N - validIdx.length})</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ background: "var(--brand-pink)" }} /> validation ({validIdx.length})</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--brand-violet)" }} /> fold fit</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed opacity-50" style={{ borderColor: "var(--brand-indigo)" }} /> full fit</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Fold errors (MSE)</div>
          <svg viewBox={`0 0 ${k * (barW + barGap) + 16} 120`} className="w-full">
            {range(k).map((fi) => {
              const h = (cvErrors[fi] / maxErr) * 90;
              return (
                <g key={fi}>
                  <rect
                    x={bx(fi)} y={by(cvErrors[fi])}
                    width={barW} height={h}
                    rx={3}
                    fill={fi === activeF ? "var(--brand-violet)" : "var(--brand-violet)"}
                    opacity={fi === activeF ? 1 : 0.35}
                  />
                  <text x={bx(fi) + barW / 2} y={116} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{fi + 1}</text>
                </g>
              );
            })}
            {/* mean line */}
            <line x1={10} y1={by(cvMean)} x2={k * (barW + barGap) + 6} y2={by(cvMean)} stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <div className="mt-1 space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CV mean</span>
              <span className="font-mono font-semibold" style={{ color: "var(--warning)" }}>{cvMean.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CV std</span>
              <span className="font-mono">{cvStd.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">fold {activeF + 1}</span>
              <span className="font-mono" style={{ color: "var(--brand-pink)" }}>{(cvErrors[activeF] ?? 0).toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
