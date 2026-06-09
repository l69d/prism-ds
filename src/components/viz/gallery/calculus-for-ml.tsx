"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 620, H = 340, PAD = 40;

type Mode = "quadratic" | "cubic" | "sine";

const fns: Record<Mode, (x: number) => number> = {
  quadratic: (x) => 0.4 * x * x - 0.5 * x + 0.8,
  cubic: (x) => 0.08 * x * x * x - 0.6 * x + 1.0,
  sine: (x) => 1.2 * Math.sin(x) + 0.5 * x + 1.0,
};

const dfns: Record<Mode, (x: number) => number> = {
  quadratic: (x) => 0.8 * x - 0.5,
  cubic: (x) => 0.24 * x * x - 0.6,
  sine: (x) => 1.2 * Math.cos(x) + 0.5,
};

const xMin = -4, xMax = 4, yMin = -2, yMax = 5;

export default function Viz() {
  const [mode, setMode] = useState<Mode>("quadratic");
  const [xPos, setXPos] = useState(-2.5);
  const [lr, setLr] = useState(0.3);
  const [running, setRunning] = useState(false);
  const [stepLog, setStepLog] = useState<number[]>([-2.5]);
  const rafRef = useRef<number | null>(null);

  const f = fns[mode];
  const df = dfns[mode];

  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const curvePath = useMemo(() => {
    const pts = linspace(xMin, xMax, 200);
    return "M" + pts.map((v) => `${sx(v).toFixed(1)},${sy(f(v)).toFixed(1)}`).join(" L");
  }, [mode]);

  const step = () => {
    setXPos((cur) => {
      const next = clamp(cur - lr * df(cur), xMin + 0.1, xMax - 0.1);
      setStepLog((log) => [...log.slice(-50), next]);
      return next;
    });
  };

  const reset = (x = xPos) => {
    setRunning(false);
    setStepLog([x]);
  };

  useEffect(() => {
    if (!running) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 280) { step(); last = t; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, lr, mode]);

  useEffect(() => {
    setRunning(false);
    setStepLog([xPos]);
  }, [mode]);

  const grad = df(xPos);
  const fx = f(xPos);
  const tangentSpan = 1.1;
  const tx1 = xPos - tangentSpan;
  const tx2 = xPos + tangentSpan;
  const ty1 = fx - tangentSpan * grad;
  const ty2 = fx + tangentSpan * grad;

  const nextX = clamp(xPos - lr * grad, xMin + 0.1, xMax - 0.1);
  const nextFx = f(nextX);

  const converged = Math.abs(grad) < 0.03;
  const diverging = Math.abs(grad) > 8;
  const statusColor = converged ? "var(--success)" : diverging ? "var(--danger)" : "var(--brand-indigo)";
  const statusText = converged ? "minimum reached" : diverging ? "gradient too steep" : "descending...";

  return (
    <VizFrame
      title="Derivatives & Gradient Descent"
      hint="drag the x-position slider to explore the slope"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="x position"
              min={xMin + 0.1}
              max={xMax - 0.1}
              step={0.05}
              value={xPos}
              onChange={(v) => { setXPos(v); reset(v); }}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="learning rate η"
              min={0.02}
              max={1.2}
              step={0.02}
              value={lr}
              onChange={(v) => { setLr(v); reset(); }}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run descent</>}
            </VizButton>
            <VizButton onClick={() => { setRunning(false); step(); }}>Step</VizButton>
            <VizButton onClick={() => { reset(xPos); }}><RotateCcw size={13} /> Reset</VizButton>
            <span className="ml-auto text-xs font-mono" style={{ color: statusColor }}>{statusText}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>f(x) = <span className="font-mono text-foreground">{fx.toFixed(3)}</span></span>
            <span>f′(x) = <span className="font-mono" style={{ color: grad > 0 ? "var(--danger)" : grad < 0 ? "var(--success)" : "var(--foreground)" }}>{grad.toFixed(3)}</span></span>
            <span>step = <span className="font-mono text-foreground">{(nextX - xPos).toFixed(3)}</span></span>
            <span>x_next = <span className="font-mono text-foreground">{nextX.toFixed(3)}</span></span>
          </div>
          <div className="flex gap-1.5">
            {(["quadratic", "cubic", "sine"] as Mode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => setMode(m)}>
                {m}
              </SegButton>
            ))}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* x-axis ticks */}
        {linspace(xMin, xMax, 9).map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={sy(0) - 3} x2={sx(v)} y2={sy(0) + 3} stroke="var(--border)" strokeWidth="1" />
            <text x={sx(v)} y={sy(0) + 13} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}

        {/* past steps as fading dots */}
        {stepLog.map((px, i) => (
          <circle
            key={i}
            cx={sx(px)}
            cy={sy(f(px))}
            r={2.5}
            fill="var(--brand-indigo)"
            opacity={0.15 + 0.7 * (i / stepLog.length)}
          />
        ))}

        {/* main curve */}
        <path d={curvePath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" strokeLinejoin="round" />

        {/* tangent line */}
        <line
          x1={sx(tx1)} y1={sy(ty1)}
          x2={sx(tx2)} y2={sy(ty2)}
          stroke="var(--brand-pink)"
          strokeWidth="1.8"
          strokeDasharray="5 3"
          opacity="0.9"
        />

        {/* gradient step arrow: from current to next x */}
        <line
          x1={sx(xPos)} y1={sy(fx) - 28}
          x2={sx(nextX)} y2={sy(fx) - 28}
          stroke="var(--brand-cyan)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="var(--brand-cyan)" />
          </marker>
        </defs>
        {/* step label */}
        <text
          x={(sx(xPos) + sx(nextX)) / 2}
          y={sy(fx) - 33}
          textAnchor="middle"
          fontSize="9"
          fill="var(--brand-cyan)"
        >
          −η·f′(x)
        </text>

        {/* vertical drop to next point */}
        <line
          x1={sx(nextX)} y1={sy(fx)}
          x2={sx(nextX)} y2={sy(nextFx)}
          stroke="var(--brand-cyan)"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity="0.6"
        />

        {/* next point */}
        <circle cx={sx(nextX)} cy={sy(nextFx)} r={5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.5" opacity="0.8" />

        {/* current point */}
        <circle cx={sx(xPos)} cy={sy(fx)} r={7} fill="var(--brand-indigo)" stroke="var(--background)" strokeWidth="2" />

        {/* slope readout */}
        <text x={W - PAD + 4} y={PAD + 8} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
          slope = <tspan fontFamily="monospace" fill="var(--foreground)">{grad.toFixed(2)}</tspan>
        </text>
      </svg>
    </VizFrame>
  );
}
