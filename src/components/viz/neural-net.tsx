"use client";

import { useMemo, useState } from "react";
import { rng } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, VizButton } from "./controls";
import { Shuffle } from "lucide-react";

const W = 560, H = 320;

const act = (z: number) => Math.tanh(z);

export function NeuralNetPlayground() {
  const [hidden, setHidden] = useState(5);
  const [x1, setX1] = useState(0.6);
  const [x2, setX2] = useState(-0.4);
  const [seed, setSeed] = useState(3);

  const layers = [2, hidden, hidden, 1];

  const weights = useMemo(() => {
    const r = rng(seed * 101 + hidden);
    const Ws: number[][][] = [];
    for (let l = 0; l < layers.length - 1; l++) {
      const rows = layers[l + 1], cols = layers[l];
      Ws.push(Array.from({ length: rows }, () => Array.from({ length: cols }, () => (r() * 2 - 1) * 1.4)));
    }
    return Ws;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, hidden]);

  const activations = useMemo(() => {
    const acts: number[][] = [[x1, x2]];
    for (let l = 0; l < weights.length; l++) {
      const prev = acts[l];
      const out = weights[l].map((row) => {
        const z = row.reduce((s, w, j) => s + w * prev[j], 0);
        return l === weights.length - 1 ? 1 / (1 + Math.exp(-z)) : act(z);
      });
      acts.push(out);
    }
    return acts;
  }, [weights, x1, x2]);

  const colX = (l: number) => 50 + (l / (layers.length - 1)) * (W - 100);
  const nodeY = (count: number, i: number) => (H / (count + 1)) * (i + 1);
  const heat = (v: number) => {
    const t = (v + 1) / 2; // -1..1 -> 0..1
    return `color-mix(in oklab, var(--brand-cyan) ${Math.round(t * 100)}%, var(--brand-pink))`;
  };

  return (
    <VizFrame
      title="Neural Network — Forward Pass"
      hint="change the inputs"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider label="Input x₁" min={-1} max={1} step={0.01} value={x1} onChange={setX1} format={(v) => v.toFixed(2)} />
            <Slider label="Input x₂" min={-1} max={1} step={0.01} value={x2} onChange={setX2} format={(v) => v.toFixed(2)} />
            <Slider label="Hidden units" min={2} max={7} step={1} value={hidden} onChange={setHidden} />
          </div>
          <div className="flex items-center gap-2">
            <VizButton onClick={() => setSeed((s) => s + 1)}><Shuffle size={13} /> Reseed weights</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              output ŷ = <span className="font-mono text-foreground">{activations[activations.length - 1][0].toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {weights.map((Wl, l) =>
          Wl.map((row, i) =>
            row.map((w, j) => (
              <line
                key={`${l}-${i}-${j}`}
                x1={colX(l)} y1={nodeY(layers[l], j)}
                x2={colX(l + 1)} y2={nodeY(layers[l + 1], i)}
                stroke={w >= 0 ? "var(--brand-violet)" : "var(--brand-pink)"}
                strokeWidth={Math.min(3, Math.abs(w) * 1.4)}
                opacity={0.15 + Math.min(0.55, Math.abs(w) * 0.35)}
              />
            )),
          ),
        )}
        {layers.map((count, l) =>
          Array.from({ length: count }, (_, i) => {
            const v = activations[l]?.[i] ?? 0;
            return (
              <g key={`n-${l}-${i}`}>
                <circle cx={colX(l)} cy={nodeY(count, i)} r={13} fill={heat(l === layers.length - 1 ? v * 2 - 1 : v)} stroke="var(--background)" strokeWidth="2" />
                <text x={colX(l)} y={nodeY(count, i) + 3} textAnchor="middle" className="fill-[var(--background)] text-[8px] font-semibold">
                  {v.toFixed(1)}
                </text>
              </g>
            );
          }),
        )}
        <text x={colX(0)} y={H - 4} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">inputs</text>
        <text x={colX(layers.length - 1)} y={H - 4} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">output</text>
      </svg>
    </VizFrame>
  );
}
