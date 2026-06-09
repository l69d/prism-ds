"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, VizButton, SegButton } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 620, H = 320;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const sigmoidD = (z: number) => { const s = sigmoid(z); return s * (1 - s); };
const relu = (z: number) => Math.max(0, z);
const reluD = (z: number) => (z > 0 ? 1 : 0);

type ActFn = "sigmoid" | "relu";

function initWeights(seed: number): number[][] {
  const r = rng(seed);
  return [
    [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
    [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r() * 2 - 1],
  ];
}

function forward(x: [number, number], W: number[][], act: ActFn) {
  const fn = act === "sigmoid" ? sigmoid : relu;
  const z1 = [W[0][0] * x[0] + W[0][1] * x[1], W[0][2] * x[0] + W[0][3] * x[1]];
  const h = [fn(z1[0]), fn(z1[1])];
  const z2 = W[1][0] * h[0] + W[1][1] * h[1];
  const out = sigmoid(z2);
  return { z1, h, z2, out };
}

function backprop(
  x: [number, number], target: number, W: number[][], act: ActFn, lr: number
): { newW: number[][]; grads: number[][] } {
  const fnD = act === "sigmoid" ? sigmoidD : reluD;
  const { z1, h, z2, out } = forward(x, W, act);
  const dOut = (out - target) * sigmoidD(z2);
  const dW1 = [dOut * h[0], dOut * h[1]];
  const dH = [W[1][0] * dOut, W[1][1] * dOut];
  const dZ1 = [dH[0] * fnD(z1[0]), dH[1] * fnD(z1[1])];
  const dW0 = [dZ1[0] * x[0], dZ1[0] * x[1], dZ1[1] * x[0], dZ1[1] * x[1]];
  const newW = [
    W[0].map((w, i) => clamp(w - lr * dW0[i], -4, 4)),
    W[1].map((w, i) => clamp(w - lr * dW1[i], -4, 4)),
  ];
  return { newW, grads: [dW0, dW1] };
}

const LAYER_X = [70, 240, 410, 570];
const nodeY = (count: number, i: number) => (H / (count + 1)) * (i + 1);

export default function Viz() {
  const [seed] = useState(7);
  const [weights, setWeights] = useState<number[][]>(() => initWeights(7));
  const [lr, setLr] = useState(0.4);
  const [target, setTarget] = useState(0.8);
  const [act, setAct] = useState<ActFn>("sigmoid");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [grads, setGrads] = useState<number[][]>([Array(4).fill(0), Array(2).fill(0)]);
  const raf = useRef<number | null>(null);

  const input: [number, number] = useMemo(() => {
    const r = rng(seed * 13);
    return [r() * 2 - 1, r() * 2 - 1];
  }, [seed]);

  const { out, h } = useMemo(() => forward(input, weights, act), [input, weights, act]);
  const loss = 0.5 * (out - target) ** 2;

  const doStep = (W: number[][]): number[][] => {
    const { newW, grads: g } = backprop(input, target, W, act, lr);
    setGrads(g);
    return newW;
  };

  const handleStep = () => {
    setWeights((W) => {
      const nW = doStep(W);
      setStep((s) => s + 1);
      return nW;
    });
  };

  useEffect(() => {
    if (!running) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 180) {
        setWeights((W) => {
          const nW = doStep(W);
          setStep((s) => s + 1);
          return nW;
        });
        last = t;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr, target, act, input]);

  const reset = () => {
    setRunning(false);
    setWeights(initWeights(seed));
    setGrads([Array(4).fill(0), Array(2).fill(0)]);
    setStep(0);
  };

  const gradMax = Math.max(...grads.flat().map(Math.abs), 0.001);
  const gradColor = (g: number) =>
    clamp(Math.abs(g) / gradMax, 0, 1) > 0.5 ? "var(--brand-indigo)" : "var(--brand-cyan)";

  const actColor = (v: number) => {
    const t = clamp(v, 0, 1);
    return `color-mix(in oklab, var(--brand-indigo) ${Math.round(t * 100)}%, var(--brand-cyan))`;
  };

  return (
    <VizFrame
      title="Backpropagation — Blame by Chain Rule"
      hint="step or run to watch gradients flow backward"
      controls={
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Learning rate" min={0.01} max={1.5} step={0.01} value={lr} onChange={setLr} format={(v) => v.toFixed(2)} />
            <Slider label="Target ŷ" min={0.05} max={0.95} step={0.01} value={target} onChange={setTarget} format={(v) => v.toFixed(2)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <SegButton active={act === "sigmoid"} onClick={() => setAct("sigmoid")}>Sigmoid</SegButton>
              <SegButton active={act === "relu"} onClick={() => setAct("relu")}>ReLU</SegButton>
            </div>
            <VizButton onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={13} />Pause</> : <><Play size={13} />Run</>}</VizButton>
            <VizButton onClick={handleStep}>Step</VizButton>
            <VizButton onClick={reset}><RotateCcw size={13} />Reset</VizButton>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              step <span className="text-foreground">{step}</span>
              {" · "}loss <span style={{ color: loss < 0.01 ? "var(--success)" : loss < 0.05 ? "var(--warning)" : "var(--danger)" }}>{loss.toFixed(4)}</span>
              {" · "}output <span className="text-foreground">{out.toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Layer 0→1 edges */}
        {[0, 1].map((j) =>
          [0, 1].map((i) => {
            const wi = j * 2 + i;
            const g = grads[0][wi];
            const gNorm = clamp(Math.abs(g) / gradMax, 0.05, 1);
            return (
              <line key={`e0-${j}-${i}`}
                x1={LAYER_X[0]} y1={nodeY(2, j)}
                x2={LAYER_X[1]} y2={nodeY(2, i)}
                stroke={gradColor(g)}
                strokeWidth={1 + gNorm * 3.5}
                opacity={0.2 + gNorm * 0.7}
              />
            );
          })
        )}
        {/* Layer 1→2 edges */}
        {[0, 1].map((i) => {
          const g = grads[1][i];
          const gNorm = clamp(Math.abs(g) / gradMax, 0.05, 1);
          return (
            <line key={`e1-${i}`}
              x1={LAYER_X[1]} y1={nodeY(2, i)}
              x2={LAYER_X[2]} y2={nodeY(1, 0)}
              stroke={gradColor(g)}
              strokeWidth={1 + gNorm * 3.5}
              opacity={0.2 + gNorm * 0.7}
            />
          );
        })}

        {/* Input nodes */}
        {[0, 1].map((i) => (
          <g key={`in-${i}`}>
            <circle cx={LAYER_X[0]} cy={nodeY(2, i)} r={16} fill={actColor(clamp(input[i] * 0.5 + 0.5, 0, 1))} stroke="var(--background)" strokeWidth="2" />
            <text x={LAYER_X[0]} y={nodeY(2, i) + 4} textAnchor="middle" fontSize="9" fill="var(--background)" fontWeight="600">{input[i].toFixed(2)}</text>
          </g>
        ))}

        {/* Hidden nodes */}
        {[0, 1].map((i) => (
          <g key={`h-${i}`}>
            <circle cx={LAYER_X[1]} cy={nodeY(2, i)} r={16} fill={actColor(h[i])} stroke="var(--background)" strokeWidth="2" />
            <text x={LAYER_X[1]} y={nodeY(2, i) + 4} textAnchor="middle" fontSize="9" fill="var(--background)" fontWeight="600">{h[i].toFixed(2)}</text>
          </g>
        ))}

        {/* Output node */}
        <circle cx={LAYER_X[2]} cy={nodeY(1, 0)} r={20} fill={actColor(out)} stroke="var(--brand-indigo)" strokeWidth="2.5" />
        <text x={LAYER_X[2]} y={nodeY(1, 0) + 4} textAnchor="middle" fontSize="10" fill="var(--background)" fontWeight="700">{out.toFixed(2)}</text>

        {/* Target indicator */}
        <circle cx={LAYER_X[3]} cy={nodeY(1, 0)} r={18} fill="none" stroke="var(--success)" strokeWidth="2" strokeDasharray="4 3" />
        <text x={LAYER_X[3]} y={nodeY(1, 0) + 4} textAnchor="middle" fontSize="10" fill="var(--success)" fontWeight="700">{target.toFixed(2)}</text>

        {/* Error arrow */}
        <line x1={LAYER_X[2] + 22} y1={nodeY(1, 0)} x2={LAYER_X[3] - 20} y2={nodeY(1, 0)} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" opacity="0.8" />
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--danger)" />
          </marker>
        </defs>

        {/* Layer labels */}
        {[["input", 0], ["hidden", 1], ["output", 2], ["target", 3]].map(([lbl, li]) => (
          <text key={lbl as string} x={LAYER_X[li as number]} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{lbl}</text>
        ))}

        {/* Gradient legend */}
        <text x={W / 2} y={14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">edge width = |gradient|  · color: cyan (small) → indigo (large)</text>
      </svg>
    </VizFrame>
  );
}
