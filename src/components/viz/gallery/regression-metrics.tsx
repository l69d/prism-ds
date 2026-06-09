"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 620, H = 320, PAD = 44;

const BASE_SEED = 42;

function makeData(seed: number, n: number): { x: number; y: number }[] {
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = (i / (n - 1)) * 8 + 1;
    const noise = gaussian(rand, 0, 0.8);
    return { x, y: clamp(1.2 * x + noise, 0.5, 12) };
  });
}

function calcMetrics(
  ys: number[],
  preds: number[]
): { mae: number; rmse: number; r2: number; mape: number } {
  const n = ys.length;
  const errors = ys.map((y, i) => y - preds[i]);
  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / n;
  const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / n);
  const yMean = mean(ys);
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = errors.reduce((s, e) => s + e * e, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const mape =
    ys.reduce((s, y, i) => s + Math.abs((y - preds[i]) / Math.max(y, 0.01)), 0) /
    n *
    100;
  return { mae, rmse, r2, mape };
}

function MetricCard({
  label,
  value,
  format,
  color,
  note,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  color: string;
  note: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card/50 px-3 py-2 gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold" style={{ color }}>{format(value)}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{note}</span>
    </div>
  );
}

export default function Viz() {
  const [seed, setSeed] = useState(BASE_SEED);
  const [n, setN] = useState(12);
  const [outlierY, setOutlierY] = useState(8.5);
  const [metric, setMetric] = useState<"mae" | "rmse" | "r2" | "mape">("rmse");

  const baseData = useMemo(() => makeData(seed, n), [seed, n]);

  const allPoints = useMemo(() => {
    const outlier = { x: 9.5, y: outlierY };
    return [...baseData, outlier];
  }, [baseData, outlierY]);

  const fitLine = useMemo(() => {
    const xs = allPoints.map((p) => p.x);
    const ys = allPoints.map((p) => p.y);
    const mx = mean(xs), my = mean(ys);
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    const slope = den > 0 ? num / den : 0;
    const intercept = my - slope * mx;
    return { slope, intercept };
  }, [allPoints]);

  const preds = useMemo(
    () => allPoints.map((p) => fitLine.slope * p.x + fitLine.intercept),
    [allPoints, fitLine]
  );

  const metrics = useMemo(
    () => calcMetrics(allPoints.map((p) => p.y), preds),
    [allPoints, preds]
  );

  const xMin = 0, xMax = 11, yMin = 0, yMax = 13;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const linePath =
    "M" +
    linspace(xMin, xMax, 80)
      .map((x) => `${sx(x).toFixed(1)},${sy(fitLine.slope * x + fitLine.intercept).toFixed(1)}`)
      .join(" L");

  const outlierPt = { x: 9.5, y: outlierY };
  const outlierPred = fitLine.slope * outlierPt.x + fitLine.intercept;
  const outlierErr = outlierPt.y - outlierPred;

  const accentFor = (m: "mae" | "rmse" | "r2" | "mape") => {
    const map: Record<string, string> = {
      mae: "var(--brand-cyan)",
      rmse: "var(--brand-violet)",
      r2: "var(--success)",
      mape: "var(--brand-pink)",
    };
    return map[m];
  };

  return (
    <VizFrame
      title="Regression Metrics"
      hint="drag the outlier slider to see which metric reacts most"
      controls={
        <div className="space-y-3">
          <Slider
            label="Outlier Y position"
            min={0.5}
            max={12.5}
            step={0.1}
            value={outlierY}
            onChange={setOutlierY}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Dataset size"
            min={6}
            max={20}
            step={1}
            value={n}
            onChange={setN}
            format={(v) => `${v} pts`}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard label="MAE" value={metrics.mae} format={(v) => v.toFixed(3)} color="var(--brand-cyan)" note="mean |error|" />
            <MetricCard label="RMSE" value={metrics.rmse} format={(v) => v.toFixed(3)} color="var(--brand-violet)" note="√mean error²" />
            <MetricCard label="R²" value={metrics.r2} format={(v) => v.toFixed(3)} color="var(--success)" note="variance explained" />
            <MetricCard label="MAPE" value={metrics.mape} format={(v) => `${v.toFixed(1)}%`} color="var(--brand-pink)" note="mean %error" />
          </div>
          <div className="text-[11px] text-muted-foreground">
            Outlier error:{" "}
            <span className="font-mono text-foreground">{outlierErr.toFixed(2)}</span>
            {" "}— RMSE penalizes this as{" "}
            <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{(outlierErr ** 2).toFixed(2)}</span>
            {" "}(squared) vs MAE:{" "}
            <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>{Math.abs(outlierErr).toFixed(2)}</span>
          </div>
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {(["mae", "rmse", "r2", "mape"] as const).map((m) => (
          <SegButton key={m} active={metric === m} onClick={() => setMetric(m)}>
            {m.toUpperCase()}
          </SegButton>
        ))}
        <VizButton onClick={() => setSeed((s) => s + 1)} className="ml-auto">
          <RotateCcw size={12} /> Reshuffle
        </VizButton>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* grid */}
        {[2, 4, 6, 8, 10, 12].map((v) => (
          <line key={v} x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeWidth="0.5" opacity="0.6" />
        ))}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* error bars for all points (highlight chosen metric) */}
        {allPoints.map((p, i) => {
          const isOutlier = i === allPoints.length - 1;
          const pred = preds[i];
          const err = p.y - pred;
          const absErr = Math.abs(err);
          const showBar = metric === "mae" || metric === "rmse";
          if (!showBar) return null;
          const barColor = isOutlier
            ? metric === "rmse" ? "var(--brand-violet)" : "var(--brand-cyan)"
            : "var(--muted-foreground)";
          const opacity = isOutlier ? 0.9 : 0.3;
          const thickness = metric === "rmse" ? clamp(absErr * 2.5, 1, 8) : 2;
          return (
            <line
              key={i}
              x1={sx(p.x)}
              y1={sy(p.y)}
              x2={sx(p.x)}
              y2={sy(pred)}
              stroke={barColor}
              strokeWidth={thickness}
              opacity={opacity}
            />
          );
        })}

        {/* R² shaded band */}
        {metric === "r2" && (
          <rect
            x={PAD}
            y={sy(metrics.r2 * (yMax - yMin) + yMin)}
            width={W - 2 * PAD}
            height={sy(yMin) - sy(metrics.r2 * (yMax - yMin) + yMin)}
            fill="var(--success)"
            opacity="0.08"
          />
        )}

        {/* fitted line */}
        <path d={linePath} fill="none" stroke="var(--brand-violet)" strokeWidth="2" opacity="0.85" />

        {/* regular points */}
        {baseData.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={4}
            fill="var(--brand-indigo)"
            opacity="0.7"
            stroke="var(--background)"
            strokeWidth="1"
          />
        ))}

        {/* outlier point */}
        <circle
          cx={sx(outlierPt.x)}
          cy={sy(outlierPt.y)}
          r={7}
          fill={accentFor(metric)}
          stroke="var(--background)"
          strokeWidth="1.5"
          opacity="0.95"
        />
        <text
          x={sx(outlierPt.x) + 10}
          y={sy(outlierPt.y) - 4}
          className="text-[10px] font-medium fill-[var(--foreground)]"
        >
          outlier
        </text>

        {/* axis labels */}
        {[2, 4, 6, 8, 10].map((v) => (
          <text key={v} x={sx(v)} y={H - PAD + 14} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">{v}</text>
        ))}
        {[0, 4, 8, 12].map((v) => (
          <text key={v} x={PAD - 6} y={sy(v) + 3} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">{v}</text>
        ))}
      </svg>
    </VizFrame>
  );
}
