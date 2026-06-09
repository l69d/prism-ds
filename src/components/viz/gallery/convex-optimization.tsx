"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { linspace } from "@/lib/mathx";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 640, H = 320, PAD = 36;

type FnMode = "convex" | "nonconvex";

const fns: Record<FnMode, { f: (x: number) => number; df: (x: number) => number; label: string }> = {
  convex: {
    f: (x) => 0.4 * x * x + 0.3 * x + 0.5,
    df: (x) => 0.8 * x + 0.3,
    label: "f(x) = 0.4x² + 0.3x + 0.5",
  },
  nonconvex: {
    f: (x) => 0.1 * x * x * x * x - 1.2 * x * x + 0.3 * x + 2.2,
    df: (x) => 0.4 * x * x * x - 2.4 * x + 0.3,
    label: "f(x) = 0.1x⁴ − 1.2x² + 0.3x + 2.2",
  },
};

const X_MIN = -4, X_MAX = 4, Y_MIN = -0.4, Y_MAX = 7;

const sx = (v: number) => PAD + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const sy = (v: number) => H - PAD - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

export default function Viz() {
  const [mode, setMode] = useState<FnMode>("convex");
  const [lr, setLr] = useState(0.3);
  const [startX, setStartX] = useState(-3.0);
  const [pos, setPos] = useState(-3.0);
  const [trail, setTrail] = useState<number[]>([-3.0]);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const rafRef = useRef<number | null>(null);

  const { f, df } = fns[mode];

  const curvePath = useMemo(() => {
    const pts = linspace(X_MIN, X_MAX, 200);
    return "M" + pts.map((v) => `${sx(v).toFixed(1)},${sy(f(v)).toFixed(1)}`).join(" L");
  }, [mode, f]);

  const globalMinX = useMemo(() => {
    const pts = linspace(X_MIN, X_MAX, 400);
    return pts.reduce((best, v) => (f(v) < f(best) ? v : best), pts[0]);
  }, [mode, f]);

  const reset = (x: number = startX) => {
    setRunning(false);
    setPos(x);
    setTrail([x]);
    setSteps(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => { reset(startX); }, [mode]);

  const doStep = (cur: number): number => {
    const next = clamp(cur - lr * df(cur), X_MIN, X_MAX);
    return next;
  };

  useEffect(() => {
    if (!running) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 180) {
        last = t;
        setPos((cur) => {
          const next = doStep(cur);
          setTrail((tr) => [...tr.slice(-80), next]);
          setSteps((s) => s + 1);
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, lr, df]);

  const grad = df(pos);
  const converged = Math.abs(grad) < 0.015;
  const distToGlobal = Math.abs(pos - globalMinX);
  const foundGlobal = converged && distToGlobal < 0.5;
  const trapped = converged && !foundGlobal;

  const statusLabel = !steps ? "ready" : converged ? (foundGlobal ? "global min ✓" : "local min ✗") : "descending";
  const statusColor = converged ? (foundGlobal ? "var(--success)" : "var(--danger)") : "var(--brand-cyan)";

  return (
    <VizFrame
      title="Convex vs Non-Convex Optimization"
      hint="change start position, then press Run"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="Learning rate α"
              min={0.02}
              max={0.8}
              step={0.02}
              value={lr}
              onChange={(v) => { setLr(v); reset(); }}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Start position"
              min={-3.8}
              max={3.8}
              step={0.1}
              value={startX}
              onChange={(v) => { setStartX(v); reset(v); }}
              format={(v) => v.toFixed(1)}
            />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
            </VizButton>
            <VizButton onClick={() => reset()}>
              <RotateCcw size={13} /> Reset
            </VizButton>
            <span className="ml-auto font-mono text-xs" style={{ color: statusColor }}>{statusLabel}</span>
            <span className="text-xs text-muted-foreground">
              step <span className="font-mono text-foreground">{steps}</span>
              {" · "}grad <span className="font-mono text-foreground">{grad.toFixed(3)}</span>
              {" · "}f(x) <span className="font-mono text-foreground">{f(pos).toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SegButton active={mode === "convex"} onClick={() => setMode("convex")}>Convex</SegButton>
        <SegButton active={mode === "nonconvex"} onClick={() => setMode("nonconvex")}>Non-Convex</SegButton>
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">{fns[mode].label}</span>
        {mode === "convex" && (
          <span className="ml-auto rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[11px] font-medium" style={{ color: "var(--success)" }}>
            Any start → same global min
          </span>
        )}
        {mode === "nonconvex" && (
          <span className="ml-auto rounded-full bg-[var(--warning)]/15 px-2 py-0.5 text-[11px] font-medium" style={{ color: "var(--warning)" }}>
            Start matters — may get trapped
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* global minimum marker */}
        <line
          x1={sx(globalMinX)} y1={PAD}
          x2={sx(globalMinX)} y2={H - PAD}
          stroke="var(--success)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
        />
        <text
          x={sx(globalMinX)} y={PAD - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--success)"
          opacity="0.8"
        >global min</text>

        {/* convex hull shading to indicate convexity */}
        {mode === "convex" && (
          <path
            d={curvePath + ` L${sx(X_MAX)},${H - PAD} L${sx(X_MIN)},${H - PAD} Z`}
            fill="var(--brand-indigo)"
            opacity="0.07"
          />
        )}

        {/* function curve */}
        <path d={curvePath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" />

        {/* trail dots */}
        {trail.map((tx, i) => (
          <circle
            key={i}
            cx={sx(tx)}
            cy={sy(f(tx))}
            r={2}
            fill={trapped ? "var(--danger)" : "var(--brand-cyan)"}
            opacity={0.2 + (0.75 * i) / trail.length}
          />
        ))}

        {/* tangent line at current pos */}
        {steps > 0 && (
          <line
            x1={sx(pos - 0.7)} y1={sy(f(pos) - 0.7 * grad)}
            x2={sx(pos + 0.7)} y2={sy(f(pos) + 0.7 * grad)}
            stroke="var(--brand-pink)" strokeWidth="1.5" opacity="0.75"
          />
        )}

        {/* start marker */}
        <circle cx={sx(startX)} cy={sy(f(startX))} r={4} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* current position ball */}
        <circle
          cx={sx(pos)} cy={sy(f(pos))} r={8}
          fill={converged ? (foundGlobal ? "var(--success)" : "var(--danger)") : "var(--brand-cyan)"}
          stroke="var(--background)" strokeWidth="2.5"
        />

        {/* axis tick labels */}
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <text key={v} x={sx(v)} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{v}</text>
        ))}
      </svg>

      {trapped && (
        <p className="mt-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs" style={{ color: "var(--danger)" }}>
          Stuck in a local minimum! Try a different start position to reach the global min.
        </p>
      )}
      {foundGlobal && mode === "convex" && (
        <p className="mt-2 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-xs" style={{ color: "var(--success)" }}>
          Convexity guarantee: gradient descent always reaches the global minimum, no matter where you start.
        </p>
      )}
    </VizFrame>
  );
}
