"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { rng } from "@/lib/mathx";
import { clamp, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 620, H = 300, PAD = 36;
const MAX_TICKS = 120;
const ARRIVAL_RATE_BASE = 0.4; // requests/tick

type ServingMode = "sync" | "batch";

interface TickSnapshot {
  tick: number;
  queue: number;
  throughput: number;
  avgLatency: number;
}

function simulate(
  mode: ServingMode,
  batchSize: number,
  workers: number,
  modelMs: number,
  seed: number
): TickSnapshot[] {
  const rand = rng(seed);
  const snapshots: TickSnapshot[] = [];
  let queue = 0;
  let totalServed = 0;
  let totalLatencyAcc = 0;
  let busyTicks: number[] = Array(workers).fill(0);

  for (let t = 1; t <= MAX_TICKS; t++) {
    // Poisson arrivals
    const arrivals = rand() < ARRIVAL_RATE_BASE ? (rand() < 0.3 ? 2 : 1) : 0;
    queue += arrivals;

    // Each free worker picks up work
    let servedThisTick = 0;
    for (let w = 0; w < workers; w++) {
      if (busyTicks[w] > 0) {
        busyTicks[w]--;
        continue;
      }
      const take = mode === "batch" ? Math.min(batchSize, queue) : Math.min(1, queue);
      if (take > 0) {
        queue -= take;
        servedThisTick += take;
        totalServed += take;
        const latency = mode === "batch"
          ? modelMs + (take - 1) * 2
          : modelMs;
        totalLatencyAcc += latency * take;
        // worker busy for latency / 10 ticks
        busyTicks[w] = Math.round(latency / 10);
      }
    }
    const avgLat = totalServed > 0 ? totalLatencyAcc / totalServed : modelMs;
    snapshots.push({ tick: t, queue: clamp(queue, 0, 60), throughput: totalServed, avgLatency: avgLat });
  }
  return snapshots;
}

export default function Viz() {
  const [mode, setMode] = useState<ServingMode>("sync");
  const [batchSize, setBatchSize] = useState(4);
  const [workers, setWorkers] = useState(2);
  const [modelMs, setModelMs] = useState(50);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const snapshots = useMemo(
    () => simulate(mode, batchSize, workers, modelMs, 42),
    [mode, batchSize, workers, modelMs]
  );

  const reset = () => {
    setRunning(false);
    setTick(0);
  };

  useEffect(() => {
    reset();
  }, [mode, batchSize, workers, modelMs]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTick((t) => {
          if (t >= MAX_TICKS - 1) {
            setRunning(false);
            return t;
          }
          return t + 1;
        });
      }, 60);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const cur = snapshots[Math.max(0, tick)] ?? snapshots[0];
  const final = snapshots[MAX_TICKS - 1];

  // Chart coords
  const xMin = 0, xMax = MAX_TICKS;
  const qMax = 30;
  const tpMax = final.throughput;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sqy = (v: number) => H - PAD - (clamp(v, 0, qMax) / qMax) * (H - 2 * PAD);
  const sty = (v: number) => H - PAD - (clamp(v, 0, tpMax) / tpMax) * (H - 2 * PAD);

  const queuePath = "M" + snapshots.slice(0, tick + 1).map((s) => `${sx(s.tick).toFixed(1)},${sqy(s.queue).toFixed(1)}`).join(" L");
  const tpPath = "M" + snapshots.slice(0, tick + 1).map((s) => `${sx(s.tick).toFixed(1)},${sty(s.throughput).toFixed(1)}`).join(" L");

  // Worker utilization bars (estimated)
  const utilization = clamp((cur.throughput / Math.max(tick, 1)) / (workers * (mode === "batch" ? batchSize : 1) * 0.5), 0, 1);

  const latencyColor = cur.avgLatency < 60 ? "var(--success)" : cur.avgLatency < 120 ? "var(--warning)" : "var(--danger)";

  return (
    <VizFrame
      title="Model Serving & Batching"
      hint="toggle sync vs batch, then play"
      controls={
        <ControlGroup>
          <Slider label="Batch size" value={batchSize} min={1} max={16} step={1}
            onChange={setBatchSize} format={(v) => `${v} req`} />
          <Slider label="Workers" value={workers} min={1} max={6} step={1}
            onChange={setWorkers} format={(v) => `${v}`} />
          <Slider label="Model inference (ms)" value={modelMs} min={10} max={200} step={10}
            onChange={setModelMs} format={(v) => `${v} ms`} />
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground">Live readouts</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>queue depth <span className="font-mono text-foreground">{cur.queue}</span></span>
              <span>served total <span className="font-mono text-foreground">{cur.throughput}</span></span>
              <span>avg latency <span className="font-mono" style={{ color: latencyColor }}>{cur.avgLatency.toFixed(0)} ms</span></span>
              <span>util est <span className="font-mono text-foreground">{(utilization * 100).toFixed(0)}%</span></span>
            </div>
          </div>
        </ControlGroup>
      }
    >
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          <SegButton active={mode === "sync"} onClick={() => setMode("sync")}>Sync (1-by-1)</SegButton>
          <SegButton active={mode === "batch"} onClick={() => setMode("batch")}>Batched</SegButton>
        </div>
        <div className="flex gap-1.5 ml-auto">
          <VizButton onClick={() => setRunning((r) => !r)}>
            {running ? <Pause size={13} /> : <Play size={13} />}
            {running ? "Pause" : "Play"}
          </VizButton>
          <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {range(5).map((i) => {
          const y = PAD + (i / 4) * (H - 2 * PAD);
          return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth="0.5" />;
        })}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" />

        {/* Queue depth line */}
        {tick > 0 && (
          <path d={queuePath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2" />
        )}
        {/* Throughput line */}
        {tick > 0 && (
          <path d={tpPath} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" strokeDasharray="5 3" />
        )}

        {/* Current tick marker */}
        {tick > 0 && (
          <line x1={sx(cur.tick)} y1={PAD} x2={sx(cur.tick)} y2={H - PAD}
            stroke="var(--brand-indigo)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        )}

        {/* Worker utilization bars at bottom */}
        {range(workers).map((w) => {
          const bx = PAD + 8 + w * 22;
          const bh = 14 * utilization;
          return (
            <rect key={w} x={bx} y={H - PAD - bh} width={16} height={bh}
              fill="var(--brand-indigo)" opacity="0.35" rx="2" />
          );
        })}
        {range(workers).map((w) => (
          <rect key={w} x={PAD + 8 + w * 22} y={H - PAD - 14} width={16} height={14}
            fill="none" stroke="var(--border)" rx="2" />
        ))}

        {/* Labels */}
        <text x={PAD - 4} y={PAD + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{qMax}</text>
        <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">0</text>
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">simulation ticks</text>
        <text x={14} y={H / 2} textAnchor="middle" fontSize="9" fill="var(--brand-indigo)"
          transform={`rotate(-90, 14, ${H / 2})`}>queue depth</text>

        {/* Legend */}
        <rect x={W - PAD - 130} y={PAD + 6} width={10} height={3} fill="var(--brand-indigo)" rx="1" />
        <text x={W - PAD - 117} y={PAD + 10} fontSize="9" fill="var(--muted-foreground)">queue depth</text>
        <line x1={W - PAD - 130} y1={PAD + 22} x2={W - PAD - 120} y2={PAD + 22}
          stroke="var(--brand-cyan)" strokeWidth="2" strokeDasharray="4 2" />
        <text x={W - PAD - 117} y={PAD + 26} fontSize="9" fill="var(--muted-foreground)">total served</text>
      </svg>

      {/* Insight banner */}
      <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        {mode === "batch"
          ? <>Batching <span className="font-semibold text-foreground">{batchSize} req/batch</span> — GPU utilization rises, latency adds ~{(batchSize - 1) * 2} ms overhead, but throughput per worker multiplies.</>
          : <>Sync mode: each worker handles <span className="font-semibold text-foreground">1 request</span> at a time — low latency, but queue grows if arrivals spike.</>
        }
      </div>
    </VizFrame>
  );
}
