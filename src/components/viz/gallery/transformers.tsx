"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { clamp, mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 340;
const TOKENS = ["The", "cat", "sat", "on", "mat"];
const N = TOKENS.length;
const D = 4; // embedding dim

function buildEmbeddings(seed: number): number[][] {
  const r = rng(seed);
  return range(N).map(() => range(D).map(() => r() * 2 - 1));
}

function buildWq(seed: number): number[][] {
  const r = rng(seed * 31 + 7);
  return range(D).map(() => range(D).map(() => (r() * 2 - 1) * 0.5));
}

function buildWk(seed: number): number[][] {
  const r = rng(seed * 17 + 3);
  return range(D).map(() => range(D).map(() => (r() * 2 - 1) * 0.5));
}

function matMulRow(row: number[], mat: number[][]): number[] {
  return range(D).map((j) => row.reduce((s, v, i) => s + v * mat[i][j], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function softmax(xs: number[], temp: number): number[] {
  const scaled = xs.map((x) => x / temp);
  const mx = Math.max(...scaled);
  const exps = scaled.map((x) => Math.exp(x - mx));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function Viz() {
  const [temp, setTemp] = useState(1.0);
  const [focus, setFocus] = useState(1); // which query token is highlighted
  const [seed, setSeed] = useState(42);
  const [mode, setMode] = useState<"heatmap" | "bars">("heatmap");

  const { attn, entropy } = useMemo(() => {
    const E = buildEmbeddings(seed);
    const Wq = buildWq(seed);
    const Wk = buildWk(seed);
    const Q = E.map((e) => matMulRow(e, Wq));
    const K = E.map((e) => matMulRow(e, Wk));
    const scale = Math.sqrt(D);
    const rows = range(N).map((i) =>
      softmax(range(N).map((j) => dot(Q[i], K[j]) / scale), temp)
    );
    const ent = rows.map((row) =>
      -row.reduce((s, p) => s + (p > 1e-9 ? p * Math.log2(p) : 0), 0)
    );
    return { attn: rows, entropy: ent };
  }, [seed, temp]);

  const CELL = 46;
  const GRID_X = 80, GRID_Y = 52;

  const cellColor = (v: number) => {
    const t = clamp(v, 0, 1);
    const alpha = 0.08 + t * 0.92;
    return `color-mix(in oklab, var(--brand-indigo) ${Math.round(alpha * 100)}%, var(--background))`;
  };

  const focusRow = attn[focus];
  const maxAttnVal = Math.max(...focusRow);

  const BAR_X = GRID_X + N * CELL + 28;
  const BAR_W = W - BAR_X - 20;
  const BAR_Y0 = GRID_Y + (focus + 0.5) * CELL;

  const avgEntropy = entropy.reduce((a, b) => a + b, 0) / N;
  const maxEntropy = Math.log2(N);

  return (
    <VizFrame
      title="Transformer Self-Attention"
      hint="slide temperature to sharpen or blur which tokens attend to which"
      controls={
        <div className="space-y-3">
          <Slider
            label="Temperature (softmax sharpness)"
            min={0.1}
            max={3.0}
            step={0.05}
            value={temp}
            onChange={setTemp}
            format={(v) => v.toFixed(2)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">View:</span>
            <SegButton active={mode === "heatmap"} onClick={() => setMode("heatmap")}>Heatmap</SegButton>
            <SegButton active={mode === "bars"} onClick={() => setMode("bars")}>Focus bar</SegButton>
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={13} /> New sentence</VizButton>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              entropy{" "}
              <span style={{ color: avgEntropy > maxEntropy * 0.7 ? "var(--warning)" : "var(--brand-indigo)" }}>
                {avgEntropy.toFixed(2)}
              </span>
              {" / "}{maxEntropy.toFixed(2)} bits
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Column headers (key tokens) */}
        {TOKENS.map((tok, j) => (
          <text
            key={`ch-${j}`}
            x={GRID_X + j * CELL + CELL / 2}
            y={GRID_Y - 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight={mode === "bars" && j === focus ? "700" : "400"}
            fill={mode === "bars" && j === focus ? "var(--brand-indigo)" : "var(--muted-foreground)"}
          >
            {tok}
          </text>
        ))}

        {/* Row headers (query tokens) */}
        {TOKENS.map((tok, i) => (
          <text
            key={`rh-${i}`}
            x={GRID_X - 8}
            y={GRID_Y + i * CELL + CELL / 2 + 4}
            textAnchor="end"
            fontSize="11"
            fontWeight={i === focus ? "700" : "400"}
            fill={i === focus ? "var(--brand-indigo)" : "var(--muted-foreground)"}
            style={{ cursor: "pointer" }}
            onClick={() => setFocus(i)}
          >
            {tok}
          </text>
        ))}

        {/* Attention cells */}
        {range(N).map((i) =>
          range(N).map((j) => {
            const v = attn[i][j];
            const isFocusRow = i === focus;
            return (
              <g key={`cell-${i}-${j}`} style={{ cursor: "pointer" }} onClick={() => setFocus(i)}>
                <rect
                  x={GRID_X + j * CELL}
                  y={GRID_Y + i * CELL}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={3}
                  fill={cellColor(v)}
                  stroke={isFocusRow ? "var(--brand-indigo)" : "var(--border)"}
                  strokeWidth={isFocusRow ? 1.5 : 0.5}
                  opacity={mode === "bars" && !isFocusRow ? 0.35 : 1}
                />
                <text
                  x={GRID_X + j * CELL + CELL / 2 - 1}
                  y={GRID_Y + i * CELL + CELL / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={v === Math.max(...attn[i]) ? "700" : "400"}
                  fill={v > 0.45 ? "var(--background)" : "var(--foreground)"}
                  opacity={mode === "bars" && !isFocusRow ? 0.4 : 1}
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })
        )}

        {/* Entropy dots on right of each row */}
        {range(N).map((i) => {
          const e = entropy[i];
          const r = mapRange(e, 0, maxEntropy, 2, 9);
          return (
            <circle
              key={`ent-${i}`}
              cx={GRID_X + N * CELL + 14}
              cy={GRID_Y + i * CELL + CELL / 2 - 1}
              r={r}
              fill="var(--brand-indigo)"
              opacity={0.55}
            />
          );
        })}
        <text
          x={GRID_X + N * CELL + 14}
          y={GRID_Y - 10}
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted-foreground)"
        >
          H
        </text>

        {/* Focus bar chart */}
        {mode === "bars" && (
          <g>
            {range(N).map((j) => {
              const v = focusRow[j];
              const bw = clamp((BAR_W - 8) / N - 6, 12, 28);
              const bx = BAR_X + (j * (BAR_W / N)) + (BAR_W / N - bw) / 2;
              const bh = mapRange(v, 0, maxAttnVal, 0, 80);
              const by = BAR_Y0 - bh;
              return (
                <g key={`bar-${j}`}>
                  <rect
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    rx={3}
                    fill="var(--brand-indigo)"
                    opacity={0.15 + v * 0.85}
                  />
                  <text x={bx + bw / 2} y={BAR_Y0 + 12} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
                    {TOKENS[j]}
                  </text>
                  <text x={bx + bw / 2} y={by - 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--brand-indigo)">
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })}
            <line
              x1={BAR_X}
              y1={BAR_Y0}
              x2={BAR_X + BAR_W}
              y2={BAR_Y0}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={BAR_X + BAR_W / 2}
              y={BAR_Y0 + 28}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted-foreground)"
            >
              attention from &quot;{TOKENS[focus]}&quot;
            </text>
          </g>
        )}

        {/* Temperature label */}
        <text x={GRID_X + (N * CELL) / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          {temp <= 0.4
            ? "Sharp: each token attends to one other"
            : temp >= 2.2
            ? "Flat: uniform attention (no focus)"
            : "Balanced attention pattern — click a row to focus"}
        </text>

        {/* X-axis label */}
        <text x={GRID_X + (N * CELL) / 2} y={GRID_Y - 24} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--muted-foreground)">
          key (attends to)
        </text>
        <text
          x={12}
          y={GRID_Y + (N * CELL) / 2}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--muted-foreground)"
          transform={`rotate(-90, 12, ${GRID_Y + (N * CELL) / 2})`}
        >
          query
        </text>
      </svg>
    </VizFrame>
  );
}
