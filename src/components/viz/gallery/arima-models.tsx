"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range } from "@/lib/utils";

const W = 640, H = 300, PAD = 36;
const N = 120;

type View = "series" | "acf";

function buildARIMA(p: number, d: number, q: number, seed: number): number[] {
  const rand = rng(seed);
  const noise: number[] = [];
  for (let i = 0; i < N + 50; i++) noise.push(gaussian(rand, 0, 1));

  // AR coefficients — decay so process is stationary
  const phi: number[] = range(p).map((i) => 0.55 * Math.pow(0.6, i));
  // MA coefficients
  const theta: number[] = range(q).map((i) => 0.45 * Math.pow(0.5, i));

  // Generate stationary ARMA(p,q) base
  const arma: number[] = [];
  for (let t = 0; t < N + 50; t++) {
    let val = noise[t];
    for (let i = 0; i < p; i++) {
      val += phi[i] * (arma[t - i - 1] ?? 0);
    }
    for (let j = 0; j < q; j++) {
      val += theta[j] * (noise[t - j - 1] ?? 0);
    }
    arma.push(val);
  }

  // Integrate d times (cumulative sum)
  let series = arma.slice(50);
  for (let di = 0; di < d; di++) {
    const integrated: number[] = [];
    let cum = 0;
    for (const v of series) { cum += v; integrated.push(cum); }
    series = integrated;
  }
  return series;
}

function computeACF(series: number[], lags: number): number[] {
  const m = series.reduce((a, b) => a + b, 0) / series.length;
  const demeaned = series.map((v) => v - m);
  const c0 = demeaned.reduce((a, v) => a + v * v, 0) / series.length || 1;
  return range(lags).map((lag) => {
    if (lag === 0) return 1;
    const n = series.length - lag;
    let sum = 0;
    for (let t = 0; t < n; t++) sum += demeaned[t] * demeaned[t + lag];
    return sum / (series.length * c0);
  });
}

export default function Viz() {
  const [p, setP] = useState(1);
  const [d, setD] = useState(0);
  const [q, setQ] = useState(0);
  const [seed, setSeed] = useState(42);
  const [view, setView] = useState<View>("series");

  const series = useMemo(() => buildARIMA(p, d, q, seed), [p, d, q, seed]);
  const acf = useMemo(() => computeACF(series, 20), [series]);

  const yMin = Math.min(...series);
  const yMax = Math.max(...series);
  const yRange = (yMax - yMin) || 1;
  const yPad = yRange * 0.12;

  const sx = (i: number) => PAD + (i / (N - 1)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - (yMin - yPad)) / (yRange + 2 * yPad)) * (H - 2 * PAD);

  const linePath = series
    .map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
    .join(" ");

  // ACF bar chart
  const ACF_LAGS = 18;
  const acfBarW = (W - 2 * PAD) / ACF_LAGS - 3;
  const acy0 = H / 2;
  const acfScale = (H / 2 - PAD - 12);
  const confBound = 1.96 / Math.sqrt(N);

  const isStationary = d === 0;
  const label = `ARIMA(${p}, ${d}, ${q})`;
  const trendDesc = d === 0
    ? "stationary — mean-reverting"
    : d === 1
    ? "random-walk / unit root"
    : "doubly-integrated — accelerating drift";

  return (
    <VizFrame
      title="ARIMA Explorer"
      hint="adjust p, d, q and watch the series change"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="p — AR order (memory)"
              value={p} min={0} max={4} step={1}
              onChange={setP}
              format={(v) => String(v)}
            />
            <Slider
              label="d — Differencing (trend removal)"
              value={d} min={0} max={2} step={1}
              onChange={setD}
              format={(v) => String(v)}
            />
          </ControlGroup>
          <ControlGroup>
            <Slider
              label="q — MA order (shock smoothing)"
              value={q} min={0} max={4} step={1}
              onChange={setQ}
              format={(v) => String(v)}
            />
            <div className="flex flex-col justify-end gap-2">
              <VizButton onClick={() => setSeed((s) => s + 1)}>
                <RotateCcw size={13} /> New sample
              </VizButton>
            </div>
          </ControlGroup>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono font-semibold" style={{ color: "var(--brand-pink)" }}>{label}</span>
            <span style={{ color: isStationary ? "var(--success)" : "var(--warning)" }}>
              {trendDesc}
            </span>
            <span className="text-muted-foreground">
              acf[1] <span className="font-mono text-foreground">{acf[1].toFixed(2)}</span>
            </span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex gap-1.5">
        <SegButton active={view === "series"} onClick={() => setView("series")}>Time Series</SegButton>
        <SegButton active={view === "acf"} onClick={() => setView("acf")}>Autocorrelation (ACF)</SegButton>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {view === "series" && (
          <>
            {/* zero line */}
            <line
              x1={PAD} x2={W - PAD}
              y1={sy(0)} y2={sy(0)}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3"
            />
            {/* series path */}
            <path d={linePath} fill="none" stroke="var(--brand-pink)" strokeWidth="2" strokeLinejoin="round" />
            {/* AR shading: highlight last p values */}
            {p > 0 && range(Math.min(p, 3)).map((i) => {
              const idx = N - 1 - i;
              return (
                <circle key={i} cx={sx(idx)} cy={sy(series[idx])} r={4}
                  fill="var(--brand-pink)" opacity={0.7 - i * 0.2}
                  stroke="var(--background)" strokeWidth="1.5" />
              );
            })}
            {/* labels */}
            <text x={PAD + 4} y={PAD + 14} fontSize="11" fill="var(--muted-foreground)">t=0</text>
            <text x={W - PAD - 4} y={PAD + 14} fontSize="11" textAnchor="end" fill="var(--muted-foreground)">t={N - 1}</text>
            <text x={PAD - 6} y={sy(series[N - 1])} fontSize="10" textAnchor="end" fill="var(--brand-pink)" dominantBaseline="middle">
              y
            </text>
          </>
        )}

        {view === "acf" && (
          <>
            {/* zero line */}
            <line x1={PAD} x2={W - PAD} y1={acy0} y2={acy0} stroke="var(--border)" strokeWidth="1" />
            {/* confidence bands */}
            <rect
              x={PAD} y={acy0 - confBound * acfScale}
              width={W - 2 * PAD} height={2 * confBound * acfScale}
              fill="var(--brand-cyan)" opacity="0.08"
            />
            <line x1={PAD} x2={W - PAD} y1={acy0 - confBound * acfScale} y2={acy0 - confBound * acfScale}
              stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
            <line x1={PAD} x2={W - PAD} y1={acy0 + confBound * acfScale} y2={acy0 + confBound * acfScale}
              stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
            {/* ACF bars */}
            {range(ACF_LAGS).map((lag) => {
              const val = acf[lag] ?? 0;
              const bx = PAD + lag * ((W - 2 * PAD) / ACF_LAGS) + 2;
              const barH = Math.abs(val) * acfScale;
              const significant = Math.abs(val) > confBound;
              const barColor = lag === 0
                ? "var(--muted-foreground)"
                : significant
                  ? "var(--brand-pink)"
                  : "var(--muted-foreground)";
              return (
                <g key={lag}>
                  <rect
                    x={bx} width={acfBarW}
                    y={val >= 0 ? acy0 - barH : acy0}
                    height={barH}
                    fill={barColor} opacity={lag === 0 ? 0.3 : 0.75}
                    rx="2"
                  />
                  {lag % 3 === 0 && (
                    <text x={bx + acfBarW / 2} y={H - PAD + 12} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{lag}</text>
                  )}
                </g>
              );
            })}
            <text x={PAD + 4} y={acy0 - confBound * acfScale - 5} fontSize="10" fill="var(--brand-cyan)" opacity="0.8">95% CI</text>
            <text x={PAD - 6} y={acy0} fontSize="10" textAnchor="end" fill="var(--muted-foreground)" dominantBaseline="middle">0</text>
            <text x={W - PAD} y={H - PAD + 12} fontSize="10" fill="var(--muted-foreground)">lag</text>
          </>
        )}
      </svg>
    </VizFrame>
  );
}
