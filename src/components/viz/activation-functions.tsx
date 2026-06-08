"use client";

import { useState } from "react";
import { linspace } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, SegButton } from "./controls";

const W = 560, H = 280, PAD = 30;

const FNS: Record<string, { f: (x: number) => number; d: (x: number) => number; color: string }> = {
  Sigmoid: { f: (x) => 1 / (1 + Math.exp(-x)), d: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, color: "var(--brand-cyan)" },
  Tanh: { f: (x) => Math.tanh(x), d: (x) => 1 - Math.tanh(x) ** 2, color: "var(--brand-violet)" },
  ReLU: { f: (x) => Math.max(0, x), d: (x) => (x > 0 ? 1 : 0), color: "var(--brand-pink)" },
  "Leaky ReLU": { f: (x) => (x > 0 ? x : 0.1 * x), d: (x) => (x > 0 ? 1 : 0.1), color: "var(--brand-indigo)" },
  GELU: { f: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), d: (x) => { const h = 1e-4; const g = (t: number) => 0.5 * t * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (t + 0.044715 * t ** 3))); return (g(x + h) - g(x - h)) / (2 * h); }, color: "var(--warning)" },
};

export function ActivationFunctions() {
  const [fn, setFn] = useState("ReLU");
  const [x, setX] = useState(0.8);
  const [showDeriv, setShowDeriv] = useState(true);

  const xMin = -5, xMax = 5, yMin = -1.2, yMax = 3;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);
  const xs = linspace(xMin, xMax, 140);
  const { f, d, color } = FNS[fn];
  const path = (g: (x: number) => number) => "M" + xs.map((v) => `${sx(v).toFixed(1)},${sy(g(v)).toFixed(1)}`).join(" L");

  return (
    <VizFrame
      title="Activation Functions"
      hint="probe a point"
      controls={
        <div className="space-y-3">
          <Slider label="Input x" min={-5} max={5} step={0.05} value={x} onChange={setX} format={(v) => v.toFixed(2)} />
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>f(x) = <span className="font-mono text-foreground">{f(x).toFixed(3)}</span></span>
            <span>f′(x) = <span className="font-mono text-foreground">{d(x).toFixed(3)}</span></span>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5">
              <input type="checkbox" checked={showDeriv} onChange={(e) => setShowDeriv(e.target.checked)} style={{ accentColor: "var(--brand-violet)" }} />
              show derivative
            </label>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Object.keys(FNS).map((k) => (
          <SegButton key={k} active={fn === k} onClick={() => setFn(k)}>{k}</SegButton>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" />
        {showDeriv && <path d={path(d)} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />}
        <path d={path(f)} fill="none" stroke={color} strokeWidth="2.5" />
        <line x1={sx(x)} y1={PAD} x2={sx(x)} y2={H - PAD} stroke="var(--brand-violet)" strokeDasharray="3 3" opacity="0.6" />
        <circle cx={sx(x)} cy={sy(f(x))} r={5} fill={color} stroke="var(--background)" strokeWidth="1.5" />
      </svg>
    </VizFrame>
  );
}
