"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range, clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { Play, RotateCcw } from "lucide-react";

const W = 640, H = 300, PAD = 28;
const STAGES = [
  { id: "ingest",   label: "Ingest",   sub: "raw data",     dur: 6,  risk: 0.08 },
  { id: "validate", label: "Validate", sub: "schema",       dur: 5,  risk: 0.15 },
  { id: "features", label: "Features", sub: "engineer",     dur: 9,  risk: 0.10 },
  { id: "train",    label: "Train",    sub: "model fit",    dur: 18, risk: 0.05 },
  { id: "evaluate", label: "Eval",     sub: "metrics",      dur: 5,  risk: 0.12 },
  { id: "register", label: "Register", sub: "model store",  dur: 4,  risk: 0.04 },
] as const;

type StageId = typeof STAGES[number]["id"];
type StageState = "idle" | "running" | "done" | "failed" | "skipped";
type RunStatus = "idle" | "running" | "done" | "failed";

const N = STAGES.length;
const TOTAL_DUR = STAGES.reduce((s, st) => s + st.dur, 0);
const NX = (i: number) => PAD + 32 + i * ((W - 2 * PAD - 64) / (N - 1));
const NY = H / 2;
const R = 22;

function stateColor(s: StageState) {
  if (s === "done")    return "var(--success)";
  if (s === "failed")  return "var(--danger)";
  if (s === "running") return "var(--brand-indigo)";
  if (s === "skipped") return "var(--warning)";
  return "var(--border)";
}

function buildStates(tick: number, skipped: Set<StageId>, seed: number): StageState[] {
  const roll = rng(seed);
  let elapsed = 0;
  return STAGES.map((st) => {
    if (skipped.has(st.id)) { elapsed += st.dur; return "skipped"; }
    const start = elapsed; elapsed += st.dur;
    if (tick < start) return "idle";
    if (tick < elapsed) return "running";
    return roll() < st.risk ? "failed" : "done";
  });
}

function progressFrac(tick: number, idx: number): number {
  let e = 0; for (let i = 0; i < idx; i++) e += STAGES[i].dur;
  return clamp((tick - e) / STAGES[idx].dur, 0, 1);
}

export default function Viz() {
  const [skipped, setSkipped] = useState<Set<StageId>>(new Set());
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [seed, setSeed] = useState(42);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const states = useMemo(() => buildStates(tick, skipped, seed), [tick, skipped, seed]);
  const effDur = useMemo(() => STAGES.reduce((s, st) => s + (skipped.has(st.id) ? 0 : st.dur), 0), [skipped]);
  const firstFail = states.findIndex((s) => s === "failed");
  const pct = effDur === 0 ? 100 : Math.round(clamp(tick / effDur * 100, 0, 100));
  const timeSaved = Math.round(((TOTAL_DUR - effDur) / TOTAL_DUR) * 100);

  function stop() { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }

  function handleReset() { stop(); setTick(0); setStatus("idle"); setSeed((s) => s + 1); }

  function handleRun() {
    if (status === "running") { stop(); setStatus("idle"); return; }
    if (status !== "idle") handleReset();
    setTick(0); setStatus("running");
    let t = 0;
    timerRef.current = setInterval(() => {
      t += 1; setTick(t);
      const ss = buildStates(t, skipped, seed);
      if (ss.findIndex((s) => s === "failed") !== -1) { stop(); setStatus("failed"); return; }
      if (t >= effDur) { stop(); setStatus("done"); }
    }, 80);
  }

  useEffect(() => () => stop(), []);

  function toggleSkip(id: StageId) {
    if (status === "running") return;
    setSkipped((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setTick(0); setStatus("idle");
  }

  const edgeColors = range(N - 1).map((i) => {
    const src = states[i], dst = states[i + 1];
    if (src === "failed") return "var(--danger)";
    if ((src === "done" || src === "skipped") &&
        (dst === "running" || dst === "done" || dst === "skipped" || dst === "failed"))
      return "var(--brand-indigo)";
    return "var(--border)";
  });

  const failedName = firstFail >= 0 ? STAGES[firstFail]?.label ?? "" : "";
  const statusLabel = status === "idle" ? "Ready" : status === "running" ? "Running…"
    : status === "done" ? "Succeeded" : `Failed at ${failedName}`;
  const statusColor = status === "done" ? "var(--success)" : status === "failed" ? "var(--danger)"
    : status === "running" ? "var(--brand-indigo)" : "var(--muted-foreground)";

  return (
    <VizFrame
      title="ML Pipelines — DAG Execution"
      hint="toggle stages on/off, then run"
      controls={
        <div className="space-y-3">
          <div className="text-[11px] text-muted-foreground">Click stages to skip — watch cascade failures and time savings:</div>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((st) => (
              <SegButton key={st.id} active={!skipped.has(st.id)} onClick={() => toggleSkip(st.id)}>{st.label}</SegButton>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <VizButton onClick={handleRun}><Play size={12} />{status === "running" ? "Pause" : "Run"}</VizButton>
            <VizButton onClick={handleReset}><RotateCcw size={12} /> Reset</VizButton>
            <div className="ml-auto grid grid-cols-3 gap-4 text-center text-xs">
              <div><div className="font-mono font-semibold" style={{ color: statusColor }}>{statusLabel}</div><div className="text-[10px] text-muted-foreground">status</div></div>
              <div><div className="font-mono font-semibold text-foreground">{pct}%</div><div className="text-[10px] text-muted-foreground">progress</div></div>
              <div><div className="font-mono font-semibold" style={{ color: timeSaved > 0 ? "var(--warning)" : "var(--muted-foreground)" }}>{timeSaved > 0 ? `-${timeSaved}%` : "—"}</div><div className="text-[10px] text-muted-foreground">time saved</div></div>
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Progress bar */}
        <rect x={PAD} y={18} width={W - 2 * PAD} height={5} rx={3} fill="var(--border)" />
        <rect x={PAD} y={18} width={(W - 2 * PAD) * clamp(tick / Math.max(effDur, 1), 0, 1)} height={5} rx={3}
          fill={status === "failed" ? "var(--danger)" : "var(--brand-indigo)"} />

        {/* Edges */}
        {range(N - 1).map((i) => {
          const x1 = NX(i) + R, x2 = NX(i + 1) - R;
          const active = edgeColors[i] === "var(--brand-indigo)";
          return (
            <g key={i}>
              <line x1={x1} y1={NY} x2={x2} y2={NY} stroke="var(--border)" strokeWidth="3" />
              <line x1={x1} y1={NY} x2={x2} y2={NY} stroke={edgeColors[i]} strokeWidth="3" opacity={active ? 0.85 : 0.3} />
              <polygon points={`${x2 + 1},${NY} ${x2 - 7},${NY - 4} ${x2 - 7},${NY + 4}`} fill={edgeColors[i]} opacity={active ? 0.85 : 0.3} />
            </g>
          );
        })}

        {/* Stage nodes */}
        {STAGES.map((st, i) => {
          const cx = NX(i), state = states[i], color = stateColor(state);
          const frac = state === "running" ? progressFrac(tick, i) : 0;
          const isIdle = state === "idle";
          return (
            <g key={st.id} style={{ cursor: status !== "running" ? "pointer" : "default" }} onClick={() => toggleSkip(st.id)}>
              {state === "running" && <circle cx={cx} cy={NY} r={R + 6} fill="var(--brand-indigo)" opacity="0.12" />}
              {state === "running" && (
                <circle cx={cx} cy={NY} r={R} fill="none" stroke="var(--brand-indigo)" strokeWidth="4"
                  strokeDasharray={`${frac * 2 * Math.PI * R} ${2 * Math.PI * R}`} strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${NY})`} opacity="0.5" />
              )}
              <circle cx={cx} cy={NY} r={R} fill={isIdle ? "var(--card)" : color} stroke={color} strokeWidth={isIdle ? 1.5 : 2.5} />
              <text x={cx} y={NY - 5} textAnchor="middle" fontSize="9" fontWeight="600"
                fill={isIdle || state === "skipped" ? "var(--muted-foreground)" : "var(--background)"}>{st.label}</text>
              <text x={cx} y={NY + 6} textAnchor="middle" fontSize="7.5"
                fill={isIdle || state === "skipped" ? "var(--muted-foreground)" : "var(--background)"} opacity="0.8">{st.sub}</text>
              <rect x={cx - 14} y={NY + R + 7} width={28} height={12} rx={3} fill="var(--muted)" opacity="0.5" />
              <text x={cx} y={NY + R + 16} textAnchor="middle" fontSize="7.5" fill="var(--muted-foreground)">
                {skipped.has(st.id) ? "skip" : `${st.dur}s`}
              </text>
              {status === "failed" && firstFail !== -1 && i > firstFail && (
                <text x={cx} y={NY - R - 8} textAnchor="middle" fontSize="7.5" fill="var(--danger)" opacity="0.7">blocked</text>
              )}
            </g>
          );
        })}

        {status === "failed" && firstFail !== -1 && (
          <text x={NX(firstFail)} y={NY - R - 8} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--danger)">FAILED</text>
        )}
      </svg>
    </VizFrame>
  );
}
