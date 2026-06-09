"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { range, clamp, mapRange } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 660, H = 310, PAD = 36;
const MAX_T = 10;
const NODE_R = 18;
const H_ROW = 120, X_ROW = 220, OUT_ROW = 44;

// tanh and its derivative
const tanh = (x: number) => Math.tanh(x);

export default function Viz() {
  const [seqLen, setSeqLen] = useState(7);
  const [Whh, setWhh] = useState(0.85);
  const [signalAt, setSignalAt] = useState(1);
  const [mode, setMode] = useState<"memory" | "gradient">("memory");
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0);
  const raf = useRef<number | null>(null);

  // Animate: each tick we highlight one more step to show signal flow
  useEffect(() => {
    if (!playing) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 420) {
        setTick((prev) => {
          if (prev >= seqLen - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
        last = t;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, seqLen]);

  // Hidden states h[t] and influence of signal injected at signalAt
  const { hiddenVals, influence } = useMemo(() => {
    const Wxh = 0.5;
    const inputs = range(seqLen).map((i) => (i === signalAt - 1 ? 1.0 : 0.05));
    const h: number[] = [0];
    for (let t = 0; t < seqLen; t++) {
      const z = Whh * h[t] + Wxh * inputs[t];
      h.push(tanh(z));
    }
    // influence[t] = how much of the signal at signalAt survives to step t+1
    // approximated by product of local tanh derivatives × Whh
    const inf: number[] = range(seqLen).map(() => 0);
    for (let t = 0; t < seqLen; t++) {
      if (t < signalAt - 1) {
        inf[t] = 0;
      } else if (t === signalAt - 1) {
        inf[t] = 1.0;
      } else {
        const dtanh = 1 - h[t] * h[t]; // derivative of tanh at h[t]
        inf[t] = inf[t - 1] * Whh * dtanh;
      }
    }
    return { hiddenVals: h.slice(1), influence: inf };
  }, [seqLen, Whh, signalAt]);

  const reset = () => { setPlaying(false); setTick(0); };

  // Layout: evenly space seqLen nodes across W
  const cx = (i: number) => PAD + ((i + 0.5) / seqLen) * (W - 2 * PAD);
  const activeSteps = playing || tick > 0 ? tick + 1 : seqLen;

  const metricLabel = mode === "memory" ? "h influence" : "grad flow";
  const halfDecayStep = useMemo(() => {
    for (let t = signalAt; t < seqLen; t++) {
      if (influence[t] < 0.5) return t - signalAt + 1;
    }
    return seqLen - signalAt;
  }, [influence, signalAt, seqLen]);

  return (
    <VizFrame
      title="Recurrent Networks — Memory Over Sequences"
      hint="slide Whh to see how memory fades or persists"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Recurrent weight Whh" min={0.1} max={1.1} step={0.01} value={Whh} onChange={(v) => { reset(); setWhh(v); }} format={(v) => v.toFixed(2)} />
            <Slider label="Sequence length T" min={3} max={MAX_T} step={1} value={seqLen} onChange={(v) => { reset(); setSeqLen(v); if (signalAt > v) setSignalAt(1); }} />
          </ControlGroup>
          <Slider label={`Signal injected at step`} min={1} max={seqLen} step={1} value={signalAt} onChange={(v) => { reset(); setSignalAt(v); }} format={(v) => `t=${v}`} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <SegButton active={mode === "memory"} onClick={() => setMode("memory")}>Memory</SegButton>
              <SegButton active={mode === "gradient"} onClick={() => setMode("gradient")}>Gradient</SegButton>
            </div>
            <VizButton onClick={() => { reset(); setPlaying(true); }}><Play size={13} /> Animate</VizButton>
            <VizButton onClick={() => { setPlaying((p) => !p); }}>{playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}</VizButton>
            <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              half-decay in <span className="font-mono text-foreground">{halfDecayStep}</span> steps
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axis labels */}
        <text x={8} y={H_ROW + 6} textAnchor="start" className="fill-[var(--muted-foreground)] text-[10px]">h</text>
        <text x={8} y={X_ROW + 6} textAnchor="start" className="fill-[var(--muted-foreground)] text-[10px]">x</text>

        {/* Recurrent connections h[t] → h[t+1] */}
        {range(seqLen - 1).map((i) => {
          const active = i + 1 < activeSteps;
          const inf = clamp(influence[i + 1], 0, 1);
          const opacity = active ? 0.25 + inf * 0.6 : 0.1;
          return (
            <line
              key={`rec-${i}`}
              x1={cx(i)} y1={H_ROW}
              x2={cx(i + 1)} y2={H_ROW}
              stroke="var(--brand-indigo)"
              strokeWidth={active ? 1.5 + inf * 3 : 1}
              opacity={opacity}
              strokeDasharray={active ? "none" : "4 3"}
            />
          );
        })}

        {/* Input to hidden connections */}
        {range(seqLen).map((i) => {
          const isSignal = i === signalAt - 1;
          const active = i < activeSteps;
          return (
            <line
              key={`xh-${i}`}
              x1={cx(i)} y1={X_ROW}
              x2={cx(i)} y2={H_ROW + NODE_R}
              stroke={isSignal ? "var(--brand-cyan)" : "var(--border)"}
              strokeWidth={isSignal ? 2.5 : 1}
              opacity={active ? 0.8 : 0.25}
            />
          );
        })}

        {/* Output arrows */}
        {range(seqLen).map((i) => {
          const active = i < activeSteps;
          return (
            <line
              key={`out-${i}`}
              x1={cx(i)} y1={H_ROW - NODE_R}
              x2={cx(i)} y2={OUT_ROW - 14}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              opacity={active ? 0.45 : 0.1}
              markerEnd="none"
            />
          );
        })}

        {/* Hidden state nodes */}
        {range(seqLen).map((i) => {
          const active = i < activeSteps;
          const inf = influence[i];
          const normed = clamp(inf, 0, 1);
          const isSignalStep = i === signalAt - 1;
          const fillOpacity = active ? 0.15 + normed * 0.75 : 0.07;
          const hVal = hiddenVals[i] ?? 0;
          return (
            <g key={`h-${i}`}>
              <circle
                cx={cx(i)} cy={H_ROW} r={NODE_R}
                fill="var(--brand-indigo)"
                fillOpacity={fillOpacity}
                stroke={isSignalStep ? "var(--brand-cyan)" : "var(--brand-indigo)"}
                strokeWidth={isSignalStep ? 2.5 : 1.5}
                opacity={active ? 1 : 0.35}
              />
              <text x={cx(i)} y={H_ROW + 4} textAnchor="middle"
                className="fill-[var(--foreground)] text-[8.5px] font-mono"
                opacity={active ? 1 : 0.3}>
                {hVal.toFixed(2)}
              </text>
              <text x={cx(i)} y={H_ROW - NODE_R - 5} textAnchor="middle"
                className="fill-[var(--muted-foreground)] text-[9px]"
                opacity={active ? 1 : 0.3}>
                t={i + 1}
              </text>
            </g>
          );
        })}

        {/* Input nodes */}
        {range(seqLen).map((i) => {
          const isSignal = i === signalAt - 1;
          const active = i < activeSteps;
          return (
            <g key={`x-${i}`}>
              <circle
                cx={cx(i)} cy={X_ROW} r={12}
                fill={isSignal ? "var(--brand-cyan)" : "var(--muted-foreground)"}
                fillOpacity={active ? (isSignal ? 0.35 : 0.12) : 0.06}
                stroke={isSignal ? "var(--brand-cyan)" : "var(--border)"}
                strokeWidth={isSignal ? 2 : 1}
                opacity={active ? 1 : 0.3}
              />
              <text x={cx(i)} y={X_ROW + 4} textAnchor="middle"
                className="fill-[var(--foreground)] text-[8px] font-mono"
                opacity={active ? 1 : 0.3}>
                {isSignal ? "1.0" : "0"}
              </text>
            </g>
          );
        })}

        {/* Influence bar chart at the bottom */}
        {range(seqLen).map((i) => {
          const inf = clamp(influence[i], 0, 1);
          const barH = mapRange(inf, 0, 1, 0, 38);
          const active = i < activeSteps;
          const col = inf > 0.5 ? "var(--success)" : inf > 0.2 ? "var(--warning)" : "var(--danger)";
          return (
            <g key={`bar-${i}`}>
              <rect
                x={cx(i) - 8} y={H - PAD - barH}
                width={16} height={barH}
                fill={col} opacity={active ? 0.75 : 0.15}
                rx={2}
              />
              <text x={cx(i)} y={H - 6} textAnchor="middle"
                className="text-[8px] fill-[var(--muted-foreground)]"
                opacity={active ? 1 : 0.3}>
                {(inf * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">{metricLabel}</text>
        <line x1={PAD - 2} y1={H - PAD} x2={W - PAD + 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </VizFrame>
  );
}
