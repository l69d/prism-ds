"use client";

import { useEffect, useRef, useState } from "react";
import { linspace } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, VizButton } from "./controls";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

const W = 640, H = 320, PAD = { l: 24, r: 16, t: 16, b: 28 };

const f = (x: number) => 0.05 * x ** 4 - 0.5 * x ** 2 + 0.12 * x + 2;
const df = (x: number) => 0.2 * x ** 3 - x + 0.12;

export function GradientDescentViz() {
  const [lr, setLr] = useState(0.4);
  const [start, setStart] = useState(-3.2);
  const [x, setX] = useState(-3.2);
  const [path, setPath] = useState<number[]>([-3.2]);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);

  const xMin = -4, xMax = 4, yMin = -0.5, yMax = 6;
  const sx = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const xs = linspace(xMin, xMax, 160);
  const curve = "M" + xs.map((v) => `${sx(v).toFixed(1)},${sy(f(v)).toFixed(1)}`).join(" L");

  const step = () => {
    setX((cur) => {
      const next = cur - lr * df(cur);
      const clamped = Math.max(xMin, Math.min(xMax, next));
      setPath((p) => [...p.slice(-60), clamped]);
      return clamped;
    });
  };

  useEffect(() => {
    if (!running) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 220) { step(); last = t; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr]);

  const reset = (s = start) => { setRunning(false); setX(s); setPath([s]); };

  const grad = df(x);
  const status = Math.abs(grad) < 0.02 ? "converged" : lr > 1.6 ? "diverging?" : "descending";
  const statusColor = status === "converged" ? "var(--success)" : status === "diverging?" ? "var(--danger)" : "var(--brand-cyan)";

  return (
    <VizFrame
      title="Gradient Descent on a Loss Surface"
      hint="tune the learning rate"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Learning rate" min={0.02} max={2.2} step={0.02} value={lr} onChange={setLr} format={(v) => v.toFixed(2)} />
            <Slider label="Start position" min={-3.8} max={3.8} step={0.1} value={start} onChange={(v) => { setStart(v); reset(v); }} format={(v) => v.toFixed(1)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}</VizButton>
            <VizButton onClick={() => { setRunning(false); step(); }}><SkipForward size={13} /> Step</VizButton>
            <VizButton onClick={() => reset()}><RotateCcw size={13} /> Reset</VizButton>
            <span className="ml-auto text-xs" style={{ color: statusColor }}>{status}</span>
            <span className="text-xs text-muted-foreground">grad <span className="font-mono text-foreground">{grad.toFixed(2)}</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={curve} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
        {/* descent steps */}
        {path.map((px, i) => (
          <circle key={i} cx={sx(px)} cy={sy(f(px))} r={2.5} fill="var(--brand-cyan)" opacity={0.25 + (0.7 * i) / path.length} />
        ))}
        {/* tangent at current */}
        <line x1={sx(x - 0.6)} y1={sy(f(x) - 0.6 * grad)} x2={sx(x + 0.6)} y2={sy(f(x) + 0.6 * grad)} stroke="var(--brand-pink)" strokeWidth="1.5" opacity="0.8" />
        <circle cx={sx(x)} cy={sy(f(x))} r={7} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="2" />
        <text x={W - PAD.r} y={PAD.t + 4} textAnchor="end" className="fill-[var(--muted-foreground)] text-[11px] font-mono">x={x.toFixed(2)} · loss={f(x).toFixed(2)}</text>
      </svg>
    </VizFrame>
  );
}
