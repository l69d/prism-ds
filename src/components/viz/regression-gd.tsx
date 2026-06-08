"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rng, gaussian, mean as avg } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, VizButton } from "./controls";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

const W = 640;
const H = 340;
const PAD = { l: 40, r: 16, t: 16, b: 34 };

function makeData() {
  const r = rng(42);
  const trueW = 1.7;
  const trueB = 0.6;
  return Array.from({ length: 40 }, () => {
    const x = r() * 4 + 0.3;
    const y = trueW * x + trueB + gaussian(r, 0, 0.9);
    return { x, y };
  });
}

export function RegressionGradientDescent() {
  const data = useMemo(() => makeData(), []);
  const [params, setParams] = useState({ w: -0.5, b: 5 });
  const [lr, setLr] = useState(0.03);
  const [running, setRunning] = useState(false);
  const [iter, setIter] = useState(0);
  const raf = useRef<number | null>(null);
  const { w, b } = params;

  const xMin = 0, xMax = 5, yMin = 0, yMax = 11;
  const sx = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  const mse = useMemo(() => avg(data.map((d) => (w * d.x + b - d.y) ** 2)), [data, w, b]);

  const step = (cur: { w: number; b: number }, rate: number) => {
    const N = data.length;
    let gw = 0, gb = 0;
    for (const d of data) {
      const e = cur.w * d.x + cur.b - d.y;
      gw += (2 / N) * e * d.x;
      gb += (2 / N) * e;
    }
    return { w: cur.w - rate * gw, b: cur.b - rate * gb };
  };

  useEffect(() => {
    if (!running) return;
    const loop = () => {
      setParams((p) => step(p, lr));
      setIter((i) => i + 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr]);

  const reset = () => {
    setRunning(false);
    setParams({ w: -0.5, b: 5 });
    setIter(0);
  };

  return (
    <VizFrame
      title="Linear Regression by Gradient Descent"
      hint="run the descent"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Slope w" min={-2} max={4} step={0.01} value={w} onChange={(v) => { setRunning(false); setParams((p) => ({ ...p, w: v })); }} format={(v) => v.toFixed(2)} />
            <Slider label="Intercept b" min={-2} max={8} step={0.01} value={b} onChange={(v) => { setRunning(false); setParams((p) => ({ ...p, b: v })); }} format={(v) => v.toFixed(2)} />
          </div>
          <Slider label="Learning rate" min={0.001} max={0.12} step={0.001} value={lr} onChange={setLr} format={(v) => v.toFixed(3)} />
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run descent</>}
            </VizButton>
            <VizButton onClick={() => { setRunning(false); setParams((p) => step(p, lr)); setIter((i) => i + 1); }}>
              <SkipForward size={13} /> Step
            </VizButton>
            <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              iter <span className="font-mono text-foreground">{iter}</span> · MSE <span className="font-mono text-foreground">{mse.toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--border)" />
        {data.map((d, i) => (
          <line key={"r" + i} x1={sx(d.x)} y1={sy(d.y)} x2={sx(d.x)} y2={sy(w * d.x + b)} stroke="var(--brand-pink)" strokeWidth="1" opacity="0.4" />
        ))}
        <line x1={sx(xMin)} y1={sy(w * xMin + b)} x2={sx(xMax)} y2={sy(w * xMax + b)} stroke="var(--brand-violet)" strokeWidth="2.5" />
        {data.map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={4} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1" />
        ))}
        <text x={W - PAD.r} y={PAD.t + 4} textAnchor="end" className="fill-[var(--muted-foreground)] text-[11px] font-mono">
          ŷ = {w.toFixed(2)}·x + {b.toFixed(2)}
        </text>
      </svg>
    </VizFrame>
  );
}
