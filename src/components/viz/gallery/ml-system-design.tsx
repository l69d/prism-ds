"use client";

import { useState, useMemo } from "react";
import { clamp, mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 320, PAD = 36;

type ServingMode = "realtime" | "batch" | "streaming";

const MODE_LABELS: Record<ServingMode, string> = {
  realtime: "Real-time API",
  batch:    "Batch offline",
  streaming: "Stream (micro-batch)",
};

// Model complexity index 1–10 → base latency (ms per item) and accuracy bonus
function modelLatency(complexity: number): number {
  return 2 * Math.exp(complexity * 0.28); // ~2ms at 1, ~40ms at 10
}
function modelAccuracy(complexity: number): number {
  return 0.55 + 0.43 * (1 - Math.exp(-complexity * 0.38));
}

// Serving mode modifiers
const MODE_LATENCY_MULT: Record<ServingMode, number> = { realtime: 1.0, streaming: 1.4, batch: 2.5 };
const MODE_THROUGHPUT_MULT: Record<ServingMode, number> = { realtime: 0.6, streaming: 1.8, batch: 4.5 };

function computeMetrics(complexity: number, batchSize: number, mode: ServingMode) {
  const baseLatMs = modelLatency(complexity);
  const modeMult = MODE_LATENCY_MULT[mode];
  // Batching adds queueing latency: O(batchSize * 0.1) extra per item queued
  const batchLatency = mode === "realtime" ? 0 : batchSize * 0.08 * baseLatMs;
  const latency = baseLatMs * modeMult + batchLatency;
  // Throughput scales with batch size but diminishes (GPU memory wall) and with mode
  const tpuBase = 1000 / baseLatMs; // items/sec at bs=1
  const batchGain = Math.log2(1 + batchSize) * 1.4;
  const throughput = tpuBase * batchGain * MODE_THROUGHPUT_MULT[mode];
  const accuracy = modelAccuracy(complexity);
  return { latency, throughput, accuracy };
}

export default function Viz() {
  const [complexity, setComplexity] = useState(4);
  const [batchSize, setBatchSize] = useState(32);
  const [mode, setMode] = useState<ServingMode>("realtime");
  const [pinned, setPinned] = useState<{ complexity: number; batchSize: number; mode: ServingMode } | null>(null);

  const current = useMemo(() => computeMetrics(complexity, batchSize, mode), [complexity, batchSize, mode]);
  const baseline = useMemo(
    () => pinned ? computeMetrics(pinned.complexity, pinned.batchSize, pinned.mode) : null,
    [pinned],
  );

  const bsSweep = useMemo(
    () => [1, 2, 4, 8, 16, 32, 64, 128, 256].map((bs) => ({
      bs,
      ...computeMetrics(complexity, bs, mode),
    })),
    [complexity, mode],
  );

  // Sweep chart bounds
  const maxTp = Math.max(...bsSweep.map((d) => d.throughput));
  const maxLat = Math.max(...bsSweep.map((d) => d.latency));
  const chartXs = bsSweep.map((_, i) => PAD + (i / (bsSweep.length - 1)) * (W - 2 * PAD));
  const syTp = (v: number) => H - PAD - mapRange(v, 0, maxTp * 1.1, 0, H - 2 * PAD);
  const syLat = (v: number) => H - PAD - mapRange(v, 0, maxLat * 1.1, 0, H - 2 * PAD);

  const tpPath = bsSweep.map((d, i) => `${i === 0 ? "M" : "L"}${chartXs[i].toFixed(1)},${syTp(d.throughput).toFixed(1)}`).join(" ");
  const latPath = bsSweep.map((d, i) => `${i === 0 ? "M" : "L"}${chartXs[i].toFixed(1)},${syLat(d.latency).toFixed(1)}`).join(" ");

  const curIdx = bsSweep.findIndex((d) => d.bs >= batchSize);
  const curX = curIdx >= 0 ? chartXs[clamp(curIdx, 0, bsSweep.length - 1)] : chartXs[0];
  const curTpY = syTp(current.throughput);
  const curLatY = syLat(current.latency);

  const delta = (cur: number, base: number | undefined, higher: boolean) => {
    if (base === undefined) return null;
    const pct = ((cur - base) / base) * 100;
    const good = higher ? pct > 0 : pct < 0;
    const color = good ? "var(--success)" : "var(--danger)";
    return <span className="font-mono text-[10px]" style={{ color }}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>;
  };

  return (
    <VizFrame
      title="ML System Design — Serving Tradeoffs"
      hint="tune batch size & model complexity"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Model complexity" min={1} max={10} step={1} value={complexity} onChange={setComplexity} format={(v) => `${v}/10`} />
            <Slider label="Batch size" min={1} max={256} step={1} value={batchSize} onChange={setBatchSize} format={(v) => `${v}`} />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["realtime", "streaming", "batch"] as ServingMode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => setMode(m)}>{MODE_LABELS[m]}</SegButton>
            ))}
            <VizButton onClick={() => setPinned(pinned ? null : { complexity, batchSize, mode })} className="ml-auto">
              {pinned ? <><RotateCcw size={12} /> Clear baseline</> : "Pin baseline"}
            </VizButton>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/60 px-3 py-2 text-center text-xs">
            {([
              ["Latency", current.latency.toFixed(1) + " ms", false, baseline?.latency],
              ["Throughput", (current.throughput / 1000).toFixed(1) + " k/s", true, baseline ? baseline.throughput : undefined],
              ["Accuracy", (current.accuracy * 100).toFixed(1) + "%", true, baseline ? baseline.accuracy : undefined],
            ] as [string, string, boolean, number | undefined][]).map(([label, val, higher, base]) => (
              <div key={label} className="space-y-0.5">
                <div className="font-mono text-foreground">{val}</div>
                {delta(
                  label === "Latency" ? current.latency : label === "Throughput" ? current.throughput : current.accuracy,
                  base,
                  higher,
                )}
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="mb-2 flex gap-3 text-[11px]">
        {(
          [
            ["Throughput →", "var(--brand-indigo)"],
            ["Latency →", "var(--brand-pink)"],
            ["Accuracy (flat)", "var(--brand-cyan)"],
          ] as [string, string][]
        ).map(([label, color], i) => (
          <span key={label} className="flex items-center gap-1 text-muted-foreground">
            <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke={color} strokeWidth="2" strokeDasharray={i === 2 ? "3 2" : "none"} /></svg>
            {label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {range(5).map((i) => {
          const y = PAD + (i / 4) * (H - 2 * PAD);
          return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth="0.5" opacity="0.6" />;
        })}
        {/* X axis labels */}
        {bsSweep.map((d, i) => (
          <text key={i} x={chartXs[i]} y={H - 6} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[8px]">{d.bs}</text>
        ))}
        <text x={W / 2} y={H} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">batch size</text>

        {/* Accuracy flat line (doesn't change with batch size) */}
        <line
          x1={PAD} y1={H - PAD - (current.accuracy - 0.5) / 0.5 * (H - 2 * PAD) * 0.9}
          x2={W - PAD} y2={H - PAD - (current.accuracy - 0.5) / 0.5 * (H - 2 * PAD) * 0.9}
          stroke="var(--brand-cyan)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"
        />

        {/* Throughput curve */}
        <path d={tpPath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" />
        {/* Latency curve */}
        <path d={latPath} fill="none" stroke="var(--brand-pink)" strokeWidth="2" opacity="0.85" />

        {/* Current batch-size vertical marker */}
        <line x1={curX} y1={PAD} x2={curX} y2={H - PAD} stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />

        {/* Dots at current */}
        <circle cx={curX} cy={curTpY} r={5} fill="var(--brand-indigo)" stroke="var(--background)" strokeWidth="2" />
        <circle cx={curX} cy={curLatY} r={5} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="2" />

        {/* Baseline dots */}
        {baseline && pinned && (() => {
          const bIdx = bsSweep.findIndex((d) => d.bs >= pinned.batchSize);
          const bX = bIdx >= 0 ? chartXs[clamp(bIdx, 0, bsSweep.length - 1)] : chartXs[0];
          const bTpY = syTp(baseline.throughput);
          const bLatY = syLat(baseline.latency);
          return (
            <g>
              <circle cx={bX} cy={bTpY} r={4} fill="none" stroke="var(--brand-indigo)" strokeWidth="1.5" strokeDasharray="2 1.5" />
              <circle cx={bX} cy={bLatY} r={4} fill="none" stroke="var(--brand-pink)" strokeWidth="1.5" strokeDasharray="2 1.5" />
            </g>
          );
        })()}

        {/* Annotation: sweet-spot zone */}
        <text x={W - PAD - 2} y={PAD + 12} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">
          complexity {complexity}/10 · {MODE_LABELS[mode]}
        </text>
      </svg>
    </VizFrame>
  );
}
