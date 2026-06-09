"use client";

import { useState, useEffect, useRef } from "react";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton, Slider } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 640, H = 300, PAD = 32;
type Mode = "batch" | "realtime" | "edge";

interface Req { id: number; progress: number; done: boolean }

const CFG: Record<Mode, { label: string; color: string; stages: string[]; ticks: (l: number) => number[]; batch: number; desc: string }> = {
  batch:    { label: "Batch",        color: "var(--brand-indigo)", stages: ["Queue", "Preprocess", "Inference", "Postprocess", "Store"],    ticks: (l) => [22, 8, 30 + l * 8, 6, 4], batch: 6, desc: "Many inputs at once — high throughput, high latency" },
  realtime: { label: "Real-time API", color: "var(--brand-cyan)",   stages: ["Receive", "Preprocess", "Inference", "Respond"],              ticks: (l) => [2, 4, 12 + l * 16, 2],    batch: 1, desc: "One request at a time — low latency, scales horizontally" },
  edge:     { label: "Edge/On-device", color: "var(--brand-pink)",  stages: ["Receive", "Lite Inference", "Respond"],                       ticks: (_l) => [1, 6, 1],                 batch: 1, desc: "Runs locally — ultra-low latency, limited model size" },
};

const stageX = (n: number, i: number) => PAD + 44 + ((i + 0.5) / n) * (W - PAD * 2 - 88);

function progToX(p: number, durations: number[], total: number): number {
  let acc = 0;
  for (let i = 0; i < durations.length; i++) {
    const frac = durations[i] / total;
    if (p <= acc + frac) {
      const t = (p - acc) / frac;
      const x1 = stageX(durations.length, i) - 22, x2 = stageX(durations.length, i) + 22;
      return x1 + t * (x2 - x1);
    }
    acc += frac;
  }
  return stageX(durations.length, durations.length - 1) + 22;
}

export default function Viz() {
  const [mode, setMode]     = useState<Mode>("realtime");
  const [load, setLoad]     = useState(3);
  const [running, setRunning] = useState(false);
  const [reqs, setReqs]     = useState<Req[]>([]);
  const [completed, setCompleted] = useState(0);
  const [tick, setTick]     = useState(0);
  const nextId = useRef(0);
  const tickRef = useRef(0);

  const cfg = CFG[mode];
  const durations = cfg.ticks(load);
  const total = durations.reduce((a, b) => a + b, 0);
  const latencyMs = Math.round(total * 80);
  const throughput = tick > 30 ? Math.round((completed / (tick / 60)) * 10) / 10 : 0;

  function reset() {
    setRunning(false); setReqs([]); setCompleted(0); setTick(0);
    nextId.current = 0; tickRef.current = 0;
  }
  useEffect(() => { reset(); }, [mode, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      setTick(t);
      setReqs((prev) => {
        let next = prev.map((r) => ({ ...r, progress: Math.min(1, r.progress + 1 / total), done: r.progress + 1 / total >= 1 }));
        const newDone = next.filter((r) => r.done && !prev.find((p) => p.id === r.id && p.done)).length;
        if (newDone > 0) setCompleted((c) => c + newDone);
        const spawnEvery = cfg.batch === 1 ? Math.max(3, 10 - load) : 28;
        if (t % spawnEvery === 0 && next.filter((r) => !r.done).length < load + 2)
          for (let b = 0; b < cfg.batch; b++) next = [...next, { id: nextId.current++, progress: 0, done: false }];
        return next.filter((r) => r.id > nextId.current - 24);
      });
    }, 80);
    return () => clearInterval(iv);
  }, [running, cfg, load, total]);

  const active = reqs.filter((r) => !r.done);
  const ROW = H / 2 + 36, STAGE = ROW - 68;
  const latencyColor = latencyMs < 500 ? "var(--success)" : latencyMs < 1500 ? "var(--warning)" : "var(--danger)";
  const tpColor = throughput > 5 ? "var(--success)" : throughput > 1.5 ? "var(--warning)" : "var(--muted-foreground)";
  const n = durations.length;
  const bw = Math.min(68, (W - PAD * 2 - 88) / n - 6);

  return (
    <VizFrame
      title="Model Deployment Modes"
      hint="Switch modes and dial up load — watch latency vs throughput shift"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            {(["batch", "realtime", "edge"] as Mode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => setMode(m)}>{CFG[m].label}</SegButton>
            ))}
            <VizButton onClick={() => setRunning((r) => !r)} className="ml-auto">
              {running ? <><Pause size={12} />Pause</> : <><Play size={12} />Play</>}
            </VizButton>
            <VizButton onClick={reset}><RotateCcw size={12} />Reset</VizButton>
          </div>
          <Slider label="Concurrent load" min={1} max={8} step={1} value={load} onChange={setLoad} format={(v) => `${Math.round(v)}×`} />
          <div className="flex flex-wrap gap-5 text-xs">
            <span style={{ color: cfg.color }} className="font-medium">{cfg.desc}</span>
          </div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <span>latency <span className="font-mono font-bold" style={{ color: latencyColor }}>{tick > 0 ? `~${latencyMs}ms` : "—"}</span></span>
            <span>throughput <span className="font-mono font-bold" style={{ color: tpColor }}>{tick > 0 ? `${throughput} req/s` : "—"}</span></span>
            <span>completed <span className="font-mono text-foreground">{completed}</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <marker id="dep-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={cfg.color} opacity={0.35} />
          </marker>
        </defs>

        {/* Stage boxes */}
        {range(n).map((i) => {
          const cx = stageX(n, i);
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={STAGE - 18} width={bw} height={36} rx={6}
                fill={cfg.color} fillOpacity={0.13} stroke={cfg.color} strokeOpacity={0.45} strokeWidth={1.5} />
              <text x={cx} y={STAGE} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontWeight="600" fill={cfg.color}>
                {cfg.stages[i]}
              </text>
              <text x={cx} y={STAGE + 22} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)">
                {Math.round(durations[i] * 80)}ms
              </text>
              {i < n - 1 && (
                <line x1={cx + bw / 2 + 2} y1={STAGE} x2={stageX(n, i + 1) - bw / 2 - 2} y2={STAGE}
                  stroke={cfg.color} strokeOpacity={0.25} strokeWidth={1} markerEnd="url(#dep-arr)" />
              )}
              <line x1={cx} y1={STAGE + 18} x2={cx} y2={ROW - 12}
                stroke={cfg.color} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="3 3" />
            </g>
          );
        })}

        {/* Flow track */}
        <line x1={PAD + 44} y1={ROW} x2={W - PAD - 44} y2={ROW} stroke="var(--border)" strokeWidth={2} strokeDasharray="4 4" />
        <text x={PAD + 16} y={ROW + 1} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">IN</text>
        <text x={W - PAD - 16} y={ROW + 1} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">OUT</text>

        {/* Batch queue indicator */}
        {mode === "batch" && (
          <rect x={PAD + 40} y={ROW - 22} width={(W - PAD * 2 - 88) * 0.18} height={44} rx={4}
            fill="var(--brand-indigo)" fillOpacity={0.07} stroke="var(--brand-indigo)" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="4 3" />
        )}

        {/* Request dots */}
        {active.map((r) => {
          const x = progToX(r.progress, durations, total);
          const pulse = (r.progress % (1 / n)) / (1 / n) > 0.35 && (r.progress % (1 / n)) / (1 / n) < 0.65;
          return (
            <g key={r.id}>
              {pulse && <circle cx={x} cy={ROW} r={11} fill="none" stroke={cfg.color} strokeWidth={1.5} opacity={0.3} />}
              <circle cx={x} cy={ROW} r={pulse ? 7 : 5} fill={cfg.color} opacity={pulse ? 0.9 : 0.65} />
            </g>
          );
        })}

        {/* Completed dots */}
        {range(Math.min(completed, 8)).map((i) => (
          <circle key={`d${i}`} cx={W - PAD - 30 + (i % 4) * 9} cy={ROW - 10 + Math.floor(i / 4) * 9}
            r={3} fill="var(--success)" opacity={0.55 - i * 0.04} />
        ))}

        {!running && (
          <text x={W / 2} y={ROW + 42} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)" opacity={0.65}>
            Press Play to send requests through the pipeline
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
