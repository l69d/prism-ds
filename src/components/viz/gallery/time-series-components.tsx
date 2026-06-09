"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 640, H = 300, PAD = { l: 36, r: 16, t: 14, b: 28 };
const N = 120;

type View = "combined" | "decomposed";

export default function Viz() {
  const [trendSlope, setTrendSlope] = useState(0.8);
  const [seasonAmp, setSeasonAmp] = useState(1.5);
  const [seasonPeriod, setSeasonPeriod] = useState(24);
  const [noiseLevel, setNoiseLevel] = useState(0.4);
  const [view, setView] = useState<View>("combined");
  const [seed] = useState(42);

  const xs = useMemo(() => linspace(0, N - 1, N), []);

  const components = useMemo(() => {
    const rand = rng(seed);
    const trend = xs.map((x) => trendSlope * (x / N) * 4);
    const seasonal = xs.map((x) => seasonAmp * Math.sin((2 * Math.PI * x) / seasonPeriod));
    const noise = xs.map(() => gaussian(rand, 0, noiseLevel));
    const combined = xs.map((_, i) => trend[i] + seasonal[i] + noise[i]);
    return { trend, seasonal, noise, combined };
  }, [xs, trendSlope, seasonAmp, seasonPeriod, noiseLevel, seed]);

  const rowH = 72;
  const rowPad = 10;
  const DH = rowH * 3 + rowPad * 4;

  function makeSx(w: number) {
    return (i: number) => PAD.l + (i / (N - 1)) * (w - PAD.l - PAD.r);
  }

  function makeSy(vals: number[], top: number, bottom: number) {
    const lo = Math.min(...vals) - 0.2;
    const hi = Math.max(...vals) + 0.2;
    const span = hi - lo || 1;
    return (v: number) => bottom - ((v - lo) / span) * (bottom - top);
  }

  function makePath(vals: number[], sy: (v: number) => number, sx: (i: number) => number) {
    return "M" + vals.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");
  }

  const sx = makeSx(W);

  // combined view
  const syCombined = makeSy(components.combined, PAD.t, H - PAD.b);
  const syTrendOnCombined = (() => {
    const c = components.combined;
    const lo = Math.min(...c) - 0.2;
    const hi = Math.max(...c) + 0.2;
    const span = hi - lo || 1;
    return (v: number) => H - PAD.b - ((v - lo) / span) * (H - PAD.b - PAD.t);
  })();

  // decomposed rows
  const rows: { label: string; vals: number[]; color: string }[] = [
    { label: "Trend", vals: components.trend, color: "var(--brand-pink)" },
    { label: "Seasonal", vals: components.seasonal, color: "var(--brand-cyan)" },
    { label: "Noise (residual)", vals: components.noise, color: "var(--muted-foreground)" },
  ];

  const noiseStd = useMemo(() => {
    const n = components.noise;
    const m = n.reduce((a, b) => a + b, 0) / n.length;
    return Math.sqrt(n.reduce((a, v) => a + (v - m) ** 2, 0) / n.length);
  }, [components.noise]);

  return (
    <VizFrame
      title="Time Series Components"
      hint="adjust sliders to reshape each component"
      controls={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <SegButton active={view === "combined"} onClick={() => setView("combined")}>Combined</SegButton>
            <SegButton active={view === "decomposed"} onClick={() => setView("decomposed")}>Decomposed</SegButton>
          </div>
          <ControlGroup>
            <Slider
              label="Trend slope"
              min={-2}
              max={2}
              step={0.1}
              value={trendSlope}
              onChange={setTrendSlope}
              format={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
            />
            <Slider
              label="Seasonal amplitude"
              min={0}
              max={3}
              step={0.1}
              value={seasonAmp}
              onChange={setSeasonAmp}
              format={(v) => v.toFixed(1)}
            />
            <Slider
              label="Seasonal period (steps)"
              min={8}
              max={48}
              step={1}
              value={seasonPeriod}
              onChange={setSeasonPeriod}
              format={(v) => `${v}`}
            />
            <Slider
              label="Noise σ"
              min={0}
              max={2}
              step={0.05}
              value={noiseLevel}
              onChange={setNoiseLevel}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>trend end <span className="font-mono text-foreground">{(trendSlope * 4).toFixed(2)}</span></span>
            <span>seasonal cycles <span className="font-mono text-foreground">{(N / seasonPeriod).toFixed(1)}</span></span>
            <span>noise σ <span className="font-mono text-foreground">{noiseStd.toFixed(2)}</span></span>
            <span>signal-to-noise <span className="font-mono" style={{ color: "var(--brand-pink)" }}>
              {noiseLevel < 0.05 ? "∞" : ((seasonAmp + Math.abs(trendSlope * 2)) / (noiseLevel + 0.001)).toFixed(1)}
            </span></span>
          </div>
        </div>
      }
    >
      {view === "combined" ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Zero line */}
          <line x1={PAD.l} y1={syCombined(0)} x2={W - PAD.r} y2={syCombined(0)} stroke="var(--border)" strokeDasharray="4 3" />
          {/* X axis */}
          <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
          {/* Tick marks on x */}
          {range(5).map((i) => {
            const idx = Math.round((i / 4) * (N - 1));
            return (
              <g key={i}>
                <line x1={sx(idx)} y1={H - PAD.b} x2={sx(idx)} y2={H - PAD.b + 4} stroke="var(--border)" />
                <text x={sx(idx)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{idx}</text>
              </g>
            );
          })}
          {/* Trend line overlay */}
          <path
            d={makePath(components.trend, syTrendOnCombined, sx)}
            fill="none"
            stroke="var(--brand-pink)"
            strokeWidth="1.8"
            strokeDasharray="6 3"
            opacity="0.7"
          />
          {/* Combined series */}
          <path
            d={makePath(components.combined, syCombined, sx)}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="2"
          />
          {/* Legend */}
          <line x1={W - 130} y1={22} x2={W - 112} y2={22} stroke="var(--foreground)" strokeWidth="2" />
          <text x={W - 108} y={26} fontSize={10} fill="var(--muted-foreground)">observed</text>
          <line x1={W - 130} y1={38} x2={W - 112} y2={38} stroke="var(--brand-pink)" strokeWidth="1.8" strokeDasharray="5 3" />
          <text x={W - 108} y={42} fontSize={10} fill="var(--muted-foreground)">trend</text>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} ${DH}`} className="w-full">
          {rows.map((row, ri) => {
            const top = rowPad + ri * (rowH + rowPad);
            const bottom = top + rowH;
            const sy = makeSy(row.vals, top, bottom);
            const zeroY = sy(0);
            return (
              <g key={ri}>
                {/* Row background */}
                <rect x={PAD.l - 4} y={top - 4} width={W - PAD.l - PAD.r + 8} height={rowH + 8} rx={6} fill="var(--card)" opacity="0.5" />
                {/* Zero line */}
                <line x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY} stroke="var(--border)" strokeDasharray="3 3" />
                {/* Row label */}
                <text x={PAD.l} y={top + 12} fontSize={10} fontWeight="600" fill={row.color}>{row.label}</text>
                {/* Area fill for trend/seasonal */}
                {ri < 2 && (
                  <path
                    d={makePath(row.vals, sy, sx) + ` L${sx(N - 1).toFixed(1)},${zeroY.toFixed(1)} L${PAD.l},${zeroY.toFixed(1)} Z`}
                    fill={row.color}
                    opacity="0.1"
                  />
                )}
                {/* Noise as vertical bars */}
                {ri === 2 && row.vals.map((v, i) => (
                  <line
                    key={i}
                    x1={sx(i)}
                    y1={zeroY}
                    x2={sx(i)}
                    y2={sy(v)}
                    stroke="var(--muted-foreground)"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                ))}
                {/* Main line */}
                <path
                  d={makePath(row.vals, sy, sx)}
                  fill="none"
                  stroke={row.color}
                  strokeWidth={ri === 2 ? 1 : 2}
                />
                {/* X ticks on last row */}
                {ri === 2 && range(5).map((j) => {
                  const idx = Math.round((j / 4) * (N - 1));
                  return (
                    <g key={j}>
                      <line x1={sx(idx)} y1={bottom} x2={sx(idx)} y2={bottom + 4} stroke="var(--border)" />
                      <text x={sx(idx)} y={bottom + 13} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{idx}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {/* Plus signs between rows */}
          {[0, 1].map((i) => {
            const midY = rowPad + (i + 1) * (rowH + rowPad) - rowPad / 2;
            return (
              <text key={i} x={PAD.l / 2} y={midY + 4} textAnchor="middle" fontSize={14} fill="var(--muted-foreground)" fontWeight="300">+</text>
            );
          })}
        </svg>
      )}
    </VizFrame>
  );
}
