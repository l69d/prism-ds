"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, std } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 290, PAD = 36;
const N = 120;
const WINDOW = 20;

type Mode = "trend" | "seasonal" | "stationary";

export default function Viz() {
  const [mode, setMode] = useState<Mode>("trend");
  const [trendSlope, setTrendSlope] = useState(0.06);
  const [amplitude, setAmplitude] = useState(2.0);
  const [noiseLevel, setNoiseLevel] = useState(0.8);
  const [seed, setSeed] = useState(42);
  const [showDiff, setShowDiff] = useState(false);

  const { series, diffSeries, rollingMeans, rollingStds, adfStat } = useMemo(() => {
    const rand = rng(seed);
    const noise = range(N).map(() => gaussian(rand, 0, noiseLevel));
    const xs = range(N);

    let raw: number[];
    if (mode === "trend") {
      raw = xs.map((t) => trendSlope * t + noise[t]);
    } else if (mode === "seasonal") {
      raw = xs.map((t) => amplitude * Math.sin((2 * Math.PI * t) / 30) + noise[t]);
    } else {
      raw = noise.slice();
    }

    // first-order differencing
    const diff: number[] = range(N - 1).map((i) => raw[i + 1] - raw[i]);

    // rolling mean and std with fixed window
    const rmeans: number[] = [];
    const rstds: number[] = [];
    for (let i = WINDOW; i <= N; i++) {
      const slice = raw.slice(i - WINDOW, i);
      rmeans.push(mean(slice));
      rstds.push(std(slice));
    }

    // simple ADF-like stationarity score: variance of rolling means
    const rollingMeanVar = std(rmeans);

    return {
      series: raw,
      diffSeries: diff,
      rollingMeans: rmeans,
      rollingStds: rstds,
      adfStat: rollingMeanVar,
    };
  }, [mode, trendSlope, amplitude, noiseLevel, seed]);

  const displaySeries = showDiff ? diffSeries : series;
  const displayLen = displaySeries.length;

  const yMin = Math.min(...displaySeries) - 0.5;
  const yMax = Math.max(...displaySeries) + 0.5;

  const sx = (i: number) => PAD + (i / (displayLen - 1)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);

  const seriesPath =
    "M" + displaySeries.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");

  // rolling mean path (offset by WINDOW on original series)
  const rmPath = showDiff
    ? null
    : "M" +
      rollingMeans
        .map((v, i) => `${sx(i + WINDOW).toFixed(1)},${sy(v).toFixed(1)}`)
        .join(" L");

  // rolling std band
  const bandTop = showDiff
    ? null
    : "M" +
      rollingMeans
        .map((v, i) =>
          i === 0
            ? `${sx(i + WINDOW).toFixed(1)},${sy(v + rollingStds[i]).toFixed(1)}`
            : `L${sx(i + WINDOW).toFixed(1)},${sy(v + rollingStds[i]).toFixed(1)}`
        )
        .join(" ") +
      " " +
      [...rollingMeans]
        .reverse()
        .map((v, i, rev) => {
          const idx = rev.length - 1 - i;
          return `L${sx(idx + WINDOW).toFixed(1)},${sy(v - rollingStds[idx]).toFixed(1)}`;
        })
        .join(" ") +
      " Z";

  const isStationary = adfStat < 0.35;
  const statusColor = isStationary ? "var(--success)" : "var(--danger)";
  const statusLabel = isStationary ? "Stationary" : "Non-stationary";

  const diffMeanStd = showDiff
    ? { m: mean(diffSeries).toFixed(3), s: std(diffSeries).toFixed(3) }
    : null;

  return (
    <VizFrame
      title="Stationarity"
      hint="change the series type and toggle differencing"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            {mode === "trend" && (
              <Slider
                label="Trend slope"
                min={0}
                max={0.15}
                step={0.005}
                value={trendSlope}
                onChange={setTrendSlope}
                format={(v) => v.toFixed(3)}
              />
            )}
            {mode === "seasonal" && (
              <Slider
                label="Seasonality amplitude"
                min={0.2}
                max={4}
                step={0.1}
                value={amplitude}
                onChange={setAmplitude}
                format={(v) => v.toFixed(1)}
              />
            )}
            {mode === "stationary" && (
              <div className="flex items-center text-xs text-muted-foreground pt-1">
                Pure white noise — constant mean &amp; variance.
              </div>
            )}
            <Slider
              label="Noise level"
              min={0.1}
              max={2.5}
              step={0.1}
              value={noiseLevel}
              onChange={setNoiseLevel}
              format={(v) => v.toFixed(1)}
            />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <VizButton onClick={() => setSeed((s) => s + 1)}>
              <RotateCcw size={13} /> New sample
            </VizButton>
            <span className="text-xs text-muted-foreground ml-1">
              Rolling mean variability:{" "}
              <span className="font-mono" style={{ color: statusColor }}>
                {adfStat.toFixed(3)}
              </span>
            </span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <SegButton active={mode === "stationary"} onClick={() => setMode("stationary")}>
            White noise
          </SegButton>
          <SegButton active={mode === "trend"} onClick={() => setMode("trend")}>
            Trend
          </SegButton>
          <SegButton active={mode === "seasonal"} onClick={() => setMode("seasonal")}>
            Seasonal
          </SegButton>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: statusColor + "22", color: statusColor }}
          >
            {statusLabel}
          </span>
          <SegButton active={showDiff} onClick={() => setShowDiff((d) => !d)}>
            {showDiff ? "Differenced ▸" : "Original ▸"}
          </SegButton>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD * 0.6} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* zero line */}
        {yMin < 0 && yMax > 0 && (
          <line
            x1={PAD}
            y1={sy(0)}
            x2={W - PAD}
            y2={sy(0)}
            stroke="var(--muted-foreground)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}

        {/* rolling std band */}
        {!showDiff && bandTop && (
          <path d={bandTop} fill="var(--brand-pink)" opacity="0.12" />
        )}

        {/* main series */}
        <path
          d={seriesPath}
          fill="none"
          stroke={showDiff ? "var(--brand-cyan)" : "var(--brand-pink)"}
          strokeWidth="1.8"
          opacity="0.9"
        />

        {/* rolling mean */}
        {!showDiff && rmPath && (
          <path
            d={rmPath}
            fill="none"
            stroke="var(--brand-pink)"
            strokeWidth="2.2"
            strokeDasharray="5 3"
          />
        )}

        {/* diff mean line */}
        {showDiff && (
          <line
            x1={PAD}
            y1={sy(mean(diffSeries))}
            x2={W - PAD}
            y2={sy(mean(diffSeries))}
            stroke="var(--brand-cyan)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.7"
          />
        )}

        {/* x-axis label */}
        <text
          x={W / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted-foreground)"
        >
          time →
        </text>

        {/* legend */}
        {!showDiff && (
          <>
            <line x1={W - 130} y1={16} x2={W - 110} y2={16} stroke="var(--brand-pink)" strokeWidth="1.8" />
            <text x={W - 106} y={20} fontSize="9.5" fill="var(--muted-foreground)">series</text>
            <line x1={W - 130} y1={30} x2={W - 110} y2={30} stroke="var(--brand-pink)" strokeWidth="2" strokeDasharray="5 3" />
            <text x={W - 106} y={34} fontSize="9.5" fill="var(--muted-foreground)">rolling mean (w={WINDOW})</text>
          </>
        )}
        {showDiff && (
          <>
            <line x1={W - 130} y1={16} x2={W - 110} y2={16} stroke="var(--brand-cyan)" strokeWidth="1.8" />
            <text x={W - 106} y={20} fontSize="9.5" fill="var(--muted-foreground)">Δ series</text>
            <line x1={W - 130} y1={30} x2={W - 110} y2={30} stroke="var(--brand-cyan)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
            <text x={W - 106} y={34} fontSize="9.5" fill="var(--muted-foreground)">mean</text>
          </>
        )}
      </svg>

      {/* readouts */}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {showDiff && diffMeanStd ? (
          <>
            <span>
              mean{" "}
              <span className="font-mono text-foreground">{diffMeanStd.m}</span>
            </span>
            <span>
              std{" "}
              <span className="font-mono text-foreground">{diffMeanStd.s}</span>
            </span>
            <span style={{ color: "var(--success)" }} className="font-medium">
              Differencing removed the non-stationarity
            </span>
          </>
        ) : (
          <>
            <span>
              overall mean{" "}
              <span className="font-mono text-foreground">{mean(series).toFixed(2)}</span>
            </span>
            <span>
              rolling mean range{" "}
              <span className="font-mono text-foreground">
                [{Math.min(...rollingMeans).toFixed(2)}, {Math.max(...rollingMeans).toFixed(2)}]
              </span>
            </span>
            <span style={{ color: statusColor }} className="font-medium">
              {isStationary
                ? "Rolling mean stays flat — stationary"
                : "Rolling mean drifts — non-stationary"}
            </span>
          </>
        )}
      </div>
    </VizFrame>
  );
}
