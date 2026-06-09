"use client";

import { useState, useMemo } from "react";
import { linspace } from "@/lib/mathx";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 640, H = 320, PAD = 42;
const X_MAX = 33, Y_MAX = 33;
const sx = (v: number) => PAD + (v / X_MAX) * (W - 2 * PAD);
const sy = (v: number) => H - PAD - (v / Y_MAX) * (H - 2 * PAD);

type Strategy = "data" | "model" | "pipeline";

const STRATEGY_LABELS: Record<Strategy, string> = {
  data: "Data Parallel",
  model: "Model Parallel",
  pipeline: "Pipeline",
};

// Communication overhead grows with workers (all-reduce ~ O(N) messages per step)
// Data parallel: all-reduce gradient sync
// Model parallel: point-to-point tensor passing (lower overhead, less speedup)
// Pipeline: bubble overhead eats efficiency
function computeScaling(workers: number, modelGb: number, strategy: Strategy) {
  const baseTime = 100; // ms per step, single GPU
  const commBase = 0.015 * modelGb; // fraction of step time per extra worker

  let speedup: number;
  let commOverhead: number; // fraction 0..1

  if (strategy === "data") {
    // Amdahl's law + all-reduce cost grows linearly with workers
    const parallelFrac = 0.92;
    const amdahl = 1 / ((1 - parallelFrac) + parallelFrac / workers);
    commOverhead = commBase * (workers - 1) * 0.9;
    speedup = amdahl / (1 + commOverhead);
  } else if (strategy === "model") {
    // Each worker holds a shard → good for huge models, but activation passing costly
    const parallelFrac = 0.78;
    const amdahl = 1 / ((1 - parallelFrac) + parallelFrac / workers);
    commOverhead = commBase * (workers - 1) * 0.35;
    speedup = amdahl / (1 + commOverhead);
  } else {
    // Pipeline parallel: microbatch bubble = (workers-1)/workers
    const bubbleFrac = (workers - 1) / (workers * 1.8);
    commOverhead = commBase * (workers - 1) * 0.2 + bubbleFrac;
    speedup = workers * (1 - bubbleFrac) / (1 + commOverhead * 0.4);
  }

  const stepMs = baseTime / Math.max(speedup, 0.01);
  const efficiency = speedup / workers; // 1 = perfect linear
  const costPerStep = stepMs * workers * 0.0001; // relative cost (workers × time)
  return {
    speedup: clamp(speedup, 0.1, workers * 1.1),
    stepMs,
    efficiency: clamp(efficiency, 0, 1),
    costPerStep,
    commOverhead: clamp(commOverhead, 0, 1),
  };
}

export default function Viz() {
  const [workers, setWorkers] = useState(4);
  const [modelGb, setModelGb] = useState(8);
  const [strategy, setStrategy] = useState<Strategy>("data");

  const maxWorkers = 32;

  // Sweep over all worker counts for the curve
  const sweep = useMemo(() => {
    const ws = [1, 2, 4, 8, 16, 24, 32];
    return ws.map((w) => ({ w, ...computeScaling(w, modelGb, strategy) }));
  }, [modelGb, strategy]);

  const current = useMemo(() => computeScaling(workers, modelGb, strategy), [workers, modelGb, strategy]);

  // Smooth speedup curve via many sample points
  const speedupPath = useMemo(() => {
    const pts = linspace(1, maxWorkers, 80);
    return (
      "M" +
      pts
        .map((w) => {
          const ww = Math.round(w * 10) / 10;
          const { speedup } = computeScaling(ww, modelGb, strategy);
          return `${sx(ww).toFixed(1)},${sy(speedup).toFixed(1)}`;
        })
        .join(" L")
    );
  }, [modelGb, strategy]);

  const idealPath = `M${sx(1).toFixed(1)},${sy(1).toFixed(1)} L${sx(maxWorkers).toFixed(1)},${sy(maxWorkers).toFixed(1)}`;

  // Efficiency bars across the sweep
  const barW = 18;
  const barMaxH = H - 2 * PAD;

  // Y-axis ticks
  const yTicks = [0, 4, 8, 16, 24, 32];
  const xTicks = [1, 4, 8, 16, 24, 32];

  const effPct = (current.efficiency * 100).toFixed(0);
  const commPct = (current.commOverhead * 100).toFixed(0);

  return (
    <VizFrame
      title="Scaling ML — Distributed Training Tradeoffs"
      hint="slide workers to find the efficiency sweet spot"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider
              label="Workers (GPUs)"
              min={1}
              max={maxWorkers}
              step={1}
              value={workers}
              onChange={setWorkers}
              format={(v) => `${v}`}
            />
            <Slider
              label="Model size"
              min={1}
              max={70}
              step={1}
              value={modelGb}
              onChange={setModelGb}
              format={(v) => `${v} GB`}
            />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["data", "model", "pipeline"] as Strategy[]).map((s) => (
              <SegButton key={s} active={strategy === s} onClick={() => setStrategy(s)}>
                {STRATEGY_LABELS[s]}
              </SegButton>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-background/60 px-3 py-2 text-center text-xs">
            <div>
              <div className="font-mono text-foreground" style={{ color: "var(--brand-indigo)" }}>
                {current.speedup.toFixed(2)}×
              </div>
              <div className="text-[10px] text-muted-foreground">Speedup</div>
            </div>
            <div>
              <div
                className="font-mono text-foreground"
                style={{ color: current.efficiency > 0.7 ? "var(--success)" : current.efficiency > 0.4 ? "var(--warning)" : "var(--danger)" }}
              >
                {effPct}%
              </div>
              <div className="text-[10px] text-muted-foreground">Efficiency</div>
            </div>
            <div>
              <div
                className="font-mono text-foreground"
                style={{ color: current.commOverhead > 0.5 ? "var(--danger)" : current.commOverhead > 0.25 ? "var(--warning)" : "var(--success)" }}
              >
                {commPct}%
              </div>
              <div className="text-[10px] text-muted-foreground">Comm overhead</div>
            </div>
            <div>
              <div className="font-mono text-foreground">{current.costPerStep.toFixed(2)}×</div>
              <div className="text-[10px] text-muted-foreground">Rel. cost/step</div>
            </div>
          </div>
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap gap-3 text-[11px]">
        {[
          ["Actual speedup", "var(--brand-indigo)"],
          ["Ideal (linear)", "var(--muted-foreground)"],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1 text-muted-foreground">
            <svg width="16" height="6">
              <line
                x1="0"
                y1="3"
                x2="16"
                y2="3"
                stroke={color}
                strokeWidth={label === "Ideal (linear)" ? 1.5 : 2.5}
                strokeDasharray={label === "Ideal (linear)" ? "4 2" : undefined}
              />
            </svg>
            {label}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {STRATEGY_LABELS[strategy]} · {modelGb} GB model
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {yTicks.map((t) => (
          <line
            key={t}
            x1={PAD}
            y1={sy(t)}
            x2={W - PAD}
            y2={sy(t)}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity="0.6"
          />
        ))}
        {/* Axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />

        {/* Axis labels */}
        {xTicks.map((t) => (
          <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
            {t}
          </text>
        ))}
        {yTicks.filter((t) => t > 0).map((t) => (
          <text key={t} x={PAD - 6} y={sy(t) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
            {t}×
          </text>
        ))}
        <text x={W / 2} y={H - 0} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          Workers
        </text>
        <text
          x={10}
          y={H / 2}
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted-foreground)"
          transform={`rotate(-90, 10, ${H / 2})`}
        >
          Speedup
        </text>

        {/* Ideal linear line */}
        <path d={idealPath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.5" />

        {/* Actual speedup curve */}
        <path d={speedupPath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" />

        {/* Efficiency fill between ideal and actual */}
        {(() => {
          const pts = linspace(1, maxWorkers, 80);
          const topPts = pts.map((w) => {
            const ww = Math.round(w * 10) / 10;
            return `${sx(ww).toFixed(1)},${sy(ww).toFixed(1)}`;
          });
          const botPts = [...pts].reverse().map((w) => {
            const ww = Math.round(w * 10) / 10;
            const { speedup } = computeScaling(ww, modelGb, strategy);
            return `${sx(ww).toFixed(1)},${sy(speedup).toFixed(1)}`;
          });
          const fillD = `M${topPts.join(" L")} L${botPts.join(" L")} Z`;
          return (
            <path d={fillD} fill="var(--brand-pink)" opacity="0.08" />
          );
        })()}

        {/* Current worker vertical marker */}
        <line
          x1={sx(workers)}
          y1={PAD}
          x2={sx(workers)}
          y2={sy(0)}
          stroke="var(--foreground)"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.35"
        />

        {/* Dot at current speedup */}
        <circle
          cx={sx(workers)}
          cy={sy(current.speedup)}
          r={6}
          fill="var(--brand-indigo)"
          stroke="var(--background)"
          strokeWidth="2"
        />

        {/* Efficiency label bubble near dot */}
        {(() => {
          const cx = sx(workers);
          const cy = sy(current.speedup);
          const labelY = clamp(cy - 16, PAD + 6, H - PAD - 6);
          const labelX = clamp(cx, PAD + 28, W - PAD - 28);
          const effColor =
            current.efficiency > 0.7
              ? "var(--success)"
              : current.efficiency > 0.4
              ? "var(--warning)"
              : "var(--danger)";
          return (
            <g>
              <rect
                x={labelX - 26}
                y={labelY - 10}
                width="52"
                height="16"
                rx="4"
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="0.8"
              />
              <text x={labelX} y={labelY + 3} textAnchor="middle" fontSize="9" fill={effColor} fontWeight="600">
                {effPct}% eff
              </text>
            </g>
          );
        })()}

        {/* Sweep efficiency mini-bars at bottom */}
        {sweep.map((d) => {
          const bx = sx(d.w) - barW / 2;
          const bh = (d.efficiency * barMaxH) / 6;
          const by = sy(0) - bh;
          const col =
            d.efficiency > 0.7
              ? "var(--success)"
              : d.efficiency > 0.4
              ? "var(--warning)"
              : "var(--danger)";
          return (
            <rect
              key={d.w}
              x={bx}
              y={by}
              width={barW}
              height={bh}
              fill={col}
              opacity={d.w === workers ? 0.55 : 0.2}
              rx="2"
            />
          );
        })}

        {/* Annotation: "scaling wall" where efficiency drops */}
        {current.efficiency < 0.5 && (
          <text
            x={sx(workers) + 10}
            y={sy(current.speedup) + 5}
            fontSize="8"
            fill="var(--danger)"
            opacity="0.8"
          >
            scaling wall
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
