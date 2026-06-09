"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean, polyfit, polyval } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 640, H = 300, PAD = { l: 36, r: 16, t: 18, b: 32 };
const N_TOTAL = 60;

type Mode = "rolling" | "leaky";

function makeData(seed: number): { x: number; y: number }[] {
  const rand = rng(seed);
  return range(N_TOTAL).map((i) => {
    const t = i / N_TOTAL;
    const trend = 1.4 * t;
    const seasonal = 0.55 * Math.sin(2 * Math.PI * t * 3.2);
    const noise = gaussian(rand, 0, 0.18);
    return { x: t, y: trend + seasonal + noise };
  });
}

function mse(actual: number[], pred: number[]): number {
  return mean(actual.map((a, i) => (a - pred[i]) ** 2));
}

export default function Viz() {
  const [winSize, setWinSize] = useState(20);
  const [horizon, setHorizon] = useState(5);
  const [mode, setMode] = useState<Mode>("rolling");
  const [seed] = useState(42);

  const data = useMemo(() => makeData(seed), [seed]);
  const { xs, ys } = useMemo(() => ({
    xs: data.map((d) => d.x),
    ys: data.map((d) => d.y),
  }), [data]);

  // Rolling-window backtest: train on [i-winSize..i), predict [i..i+horizon)
  const rollingResults = useMemo(() => {
    const results: { trainEnd: number; predStart: number; preds: number[]; actual: number[] }[] = [];
    const start = winSize;
    const stop = N_TOTAL - horizon;
    for (let i = start; i <= stop; i += horizon) {
      const trainXs = xs.slice(i - winSize, i);
      const trainYs = ys.slice(i - winSize, i);
      const coeffs = polyfit(trainXs, trainYs, 2);
      const predXs = xs.slice(i, i + horizon);
      const actual = ys.slice(i, i + horizon);
      const preds = predXs.map((x) => polyval(coeffs, x));
      results.push({ trainEnd: i, predStart: i, preds, actual });
    }
    return results;
  }, [xs, ys, winSize, horizon]);

  // Leaky (full-data fit): fit on ALL data, then "evaluate" on same data
  const leakyResults = useMemo(() => {
    const coeffs = polyfit(xs, ys, 2);
    const results: { trainEnd: number; predStart: number; preds: number[]; actual: number[] }[] = [];
    const start = winSize;
    const stop = N_TOTAL - horizon;
    for (let i = start; i <= stop; i += horizon) {
      const predXs = xs.slice(i, i + horizon);
      const actual = ys.slice(i, i + horizon);
      const preds = predXs.map((x) => polyval(coeffs, x));
      results.push({ trainEnd: i, predStart: i, preds, actual });
    }
    return results;
  }, [xs, ys, winSize, horizon]);

  const activeResults = mode === "rolling" ? rollingResults : leakyResults;

  const rollingMSE = useMemo(() => {
    const allActual = rollingResults.flatMap((r) => r.actual);
    const allPred = rollingResults.flatMap((r) => r.preds);
    return mse(allActual, allPred);
  }, [rollingResults]);

  const leakyMSE = useMemo(() => {
    const allActual = leakyResults.flatMap((r) => r.actual);
    const allPred = leakyResults.flatMap((r) => r.preds);
    return mse(allActual, allPred);
  }, [leakyResults]);

  const xMin = 0, xMax = 1;
  const yMin = Math.min(...ys) - 0.2;
  const yMax = Math.max(...ys) + 0.2;

  const sx = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const leakyCoeffs = useMemo(() => polyfit(xs, ys, 2), [xs, ys]);
  const fullFitPath = linspace(0, 1, 120).map((x) => `${sx(x).toFixed(1)},${sy(polyval(leakyCoeffs, x)).toFixed(1)}`).join(" L");

  const inflation = leakyMSE > 0 ? ((rollingMSE - leakyMSE) / leakyMSE) * 100 : 0;

  const lastWindow = rollingResults[rollingResults.length - 1];
  const trainStartIdx = lastWindow ? lastWindow.trainEnd - winSize : 0;
  const trainEndIdx = lastWindow ? lastWindow.trainEnd : winSize;

  return (
    <VizFrame
      title="Evaluating Forecasts"
      hint="switch modes to reveal the leakage gap"
      controls={
        <ControlGroup>
          <Slider
            label="Training window size"
            min={10}
            max={35}
            step={1}
            value={winSize}
            onChange={setWinSize}
            format={(v) => `${v} steps`}
          />
          <Slider
            label="Forecast horizon"
            min={1}
            max={10}
            step={1}
            value={horizon}
            onChange={setHorizon}
            format={(v) => `${v} steps`}
          />
        </ControlGroup>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <SegButton active={mode === "rolling"} onClick={() => setMode("rolling")}>
            Rolling window
          </SegButton>
          <SegButton active={mode === "leaky"} onClick={() => setMode("leaky")}>
            Leaky (full fit)
          </SegButton>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            honest MSE{" "}
            <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>
              {rollingMSE.toFixed(4)}
            </span>
          </span>
          <span>
            leaky MSE{" "}
            <span className="font-mono" style={{ color: "var(--brand-pink)" }}>
              {leakyMSE.toFixed(4)}
            </span>
          </span>
          <span
            className="font-semibold"
            style={{ color: inflation > 5 ? "var(--danger)" : "var(--success)" }}
          >
            {inflation > 0 ? `leakage inflates error by ${inflation.toFixed(0)}%` : "no inflation"}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--border)" strokeWidth="1" />

        {/* Training window highlight (rolling mode) */}
        {mode === "rolling" && lastWindow && (
          <rect
            x={sx(xs[trainStartIdx])}
            y={PAD.t}
            width={sx(xs[trainEndIdx - 1]) - sx(xs[trainStartIdx])}
            height={H - PAD.t - PAD.b}
            fill="var(--brand-cyan)"
            opacity="0.07"
          />
        )}

        {/* Full fit line (leaky mode) */}
        {mode === "leaky" && (
          <path
            d={`M${fullFitPath}`}
            fill="none"
            stroke="var(--brand-pink)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.7"
          />
        )}

        {/* Actual data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={sx(d.x)}
            cy={sy(d.y)}
            r={2.2}
            fill="var(--muted-foreground)"
            opacity="0.45"
          />
        ))}

        {/* Forecast windows */}
        {activeResults.map((r, wi) => {
          const isLast = wi === activeResults.length - 1;
          return (
            <g key={wi}>
              {r.preds.map((pred, j) => {
                const px = sx(xs[r.predStart + j]);
                const py = sy(pred);
                const ay = sy(r.actual[j]);
                return (
                  <g key={j}>
                    <line
                      x1={px}
                      y1={py}
                      x2={px}
                      y2={ay}
                      stroke={mode === "rolling" ? "var(--brand-pink)" : "var(--warning)"}
                      strokeWidth={isLast ? 1.5 : 0.8}
                      opacity={isLast ? 0.9 : 0.4}
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r={isLast ? 3.5 : 2.2}
                      fill="var(--brand-pink)"
                      opacity={isLast ? 1 : 0.5}
                    />
                  </g>
                );
              })}
              {isLast && r.preds.length > 1 && (
                <path
                  d={
                    "M" +
                    r.preds
                      .map((pred, j) => `${sx(xs[r.predStart + j]).toFixed(1)},${sy(pred).toFixed(1)}`)
                      .join(" L")
                  }
                  fill="none"
                  stroke="var(--brand-pink)"
                  strokeWidth="2"
                  opacity="0.9"
                />
              )}
            </g>
          );
        })}

        {/* X axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={sx(t)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            t={Math.round(t * N_TOTAL)}
          </text>
        ))}

        {/* Mode label */}
        <text x={W - PAD.r - 2} y={PAD.t + 4} textAnchor="end" fontSize="11" fontWeight="600"
          fill={mode === "rolling" ? "var(--brand-cyan)" : "var(--brand-pink)"}>
          {mode === "rolling" ? "Rolling window backtest" : "Full-data fit (leakage!)"}
        </text>

        {/* Legend */}
        <circle cx={PAD.l + 8} cy={PAD.t + 6} r={3} fill="var(--muted-foreground)" opacity="0.6" />
        <text x={PAD.l + 16} y={PAD.t + 10} fontSize="10" fill="var(--muted-foreground)">actual</text>
        <circle cx={PAD.l + 60} cy={PAD.t + 6} r={3} fill="var(--brand-pink)" />
        <text x={PAD.l + 68} y={PAD.t + 10} fontSize="10" fill="var(--muted-foreground)">forecast</text>
        {mode === "rolling" && (
          <>
            <rect x={PAD.l + 112} y={PAD.t + 1} width={10} height={10} fill="var(--brand-cyan)" opacity="0.25" />
            <text x={PAD.l + 126} y={PAD.t + 10} fontSize="10" fill="var(--muted-foreground)">train window</text>
          </>
        )}
      </svg>
    </VizFrame>
  );
}
