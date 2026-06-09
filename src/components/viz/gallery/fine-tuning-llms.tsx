"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range, clamp, lerp } from "@/lib/utils";

const W = 620, H = 300, PAD = 24;
type Method = "full" | "lora" | "instruct";
const DIM = 8;

function makeBaseWeights(seed: number): number[][] {
  const r = rng(seed);
  const g = gaussian(r, 0, 1);
  return range(DIM).map(() => range(DIM).map(() => g));
}

function makeLowRankDelta(seed: number, rank: number, trainSteps: number): number[][] {
  const rA = rng(seed + 1);
  const rB = rng(seed + 2);
  const gA = gaussian(rA, 0, 1);
  const gB = gaussian(rB, 0, 1);
  const A: number[][] = range(DIM).map(() => range(rank).map(() => gA));
  const B: number[][] = range(rank).map(() => range(DIM).map(() => gB));
  const scale = (trainSteps / 100) * (0.8 / Math.sqrt(rank));
  return range(DIM).map((i) =>
    range(DIM).map((j) =>
      scale * range(rank).reduce((s, k) => s + A[i][k] * B[k][j], 0)
    )
  );
}

function makeFullDelta(seed: number, trainSteps: number): number[][] {
  const r = rng(seed + 10);
  const g = gaussian(r, 0, 1);
  const scale = trainSteps / 100;
  return range(DIM).map(() => range(DIM).map(() => scale * 0.5 * g));
}

function makeInstructDelta(seed: number, trainSteps: number): number[][] {
  const r = rng(seed + 20);
  const g = gaussian(r, 0, 1);
  const scale = trainSteps / 100;
  return range(DIM).map((i) =>
    range(DIM).map((j) =>
      (i < 2 || j < 2) ? scale * 0.6 * g : scale * 0.06 * g
    )
  );
}

function colorCell(v: number): string {
  const c = clamp((v + 2) / 4, 0, 1); // normalize [-2,2] → [0,1]
  if (c < 0.5) {
    const t = c / 0.5;
    const r = Math.round(lerp(37, 255, 1 - t));
    const g2 = Math.round(lerp(99, 255, 1 - t));
    const b = Math.round(lerp(235, 255, 1 - t));
    return `rgb(${r},${g2},${b})`;
  } else {
    const t = (c - 0.5) / 0.5;
    const r = Math.round(lerp(255, 235, 1 - t));
    const g2 = Math.round(lerp(255, 68, 1 - t));
    const b = Math.round(lerp(255, 99, 1 - t));
    return `rgb(${r},${g2},${b})`;
  }
}

function frobNorm(m: number[][]): number {
  return Math.sqrt(m.flat().reduce((s, v) => s + v * v, 0));
}

function qualityScore(full: number[][], approx: number[][]): number {
  const f = full.flat(), a = approx.flat();
  const dot = f.reduce((s, v, i) => s + v * a[i], 0);
  const nf = Math.sqrt(f.reduce((s, v) => s + v * v, 0));
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  if (nf < 1e-9 || na < 1e-9) return 1;
  return clamp(dot / (nf * na), 0, 1);
}

const CELL = Math.floor((H - 2 * PAD) / DIM);
const GRID_W = CELL * DIM;

function WeightGrid({ matrix, label, accent, x0, y0 }: {
  matrix: number[][];
  label: string;
  accent: string;
  x0: number;
  y0: number;
}) {
  return (
    <>
      <text x={x0 + GRID_W / 2} y={y0 - 6} textAnchor="middle" fontSize={10} fontWeight="600" fill={accent}>
        {label}
      </text>
      {range(DIM).map((row) =>
        range(DIM).map((col) => (
          <rect
            key={`${row}-${col}`}
            x={x0 + col * CELL}
            y={y0 + row * CELL}
            width={CELL - 1}
            height={CELL - 1}
            rx={1}
            fill={colorCell(matrix[row][col])}
          />
        ))
      )}
      <rect x={x0} y={y0} width={GRID_W} height={GRID_W} fill="none" stroke={accent} strokeWidth={1.5} rx={2} opacity={0.5} />
    </>
  );
}

export default function Viz() {
  const [method, setMethod] = useState<Method>("lora");
  const [rank, setRank] = useState(2);
  const [trainSteps, setTrainSteps] = useState(60);

  const base = useMemo(() => makeBaseWeights(42), []);

  const delta = useMemo(() => {
    if (method === "full") return makeFullDelta(42, trainSteps);
    if (method === "lora") return makeLowRankDelta(42, rank, trainSteps);
    return makeInstructDelta(42, trainSteps);
  }, [method, rank, trainSteps]);

  const adapted = useMemo(
    () => range(DIM).map((i) => range(DIM).map((j) => clamp(base[i][j] + delta[i][j], -2.5, 2.5))),
    [base, delta]
  );

  const fullDelta = useMemo(() => makeFullDelta(42, trainSteps), [trainSteps]);
  const totalParams = DIM * DIM;
  const trainableParams = method === "full"
    ? totalParams
    : method === "lora"
    ? 2 * DIM * rank
    : Math.round(totalParams * 0.12);

  const pctParams = ((trainableParams / totalParams) * 100).toFixed(0);
  const deltaStrength = frobNorm(delta).toFixed(2);
  const quality = method === "full" ? 1.0 : qualityScore(fullDelta, delta);
  const qualityPct = (quality * 100).toFixed(0);
  const qualityColor = quality > 0.85 ? "var(--success)" : quality > 0.6 ? "var(--warning)" : "var(--danger)";

  const x0Base = PAD;
  const x0Delta = x0Base + GRID_W + 46;
  const x0Adapted = x0Delta + GRID_W + 46;
  const y0 = PAD + 16;

  const opSign = x0Base + GRID_W + 8;
  const eqSign = x0Delta + GRID_W + 8;
  const midY = y0 + GRID_W / 2;

  const accentDelta = method === "full"
    ? "var(--brand-pink)"
    : method === "lora"
    ? "var(--brand-cyan)"
    : "var(--brand-violet)";

  const methodLabel: Record<Method, string> = {
    full: "Full fine-tune  ΔW",
    lora: `LoRA  ΔW = A·B  (rank ${rank})`,
    instruct: "Instruction-tune  ΔW",
  };

  return (
    <VizFrame
      title="Fine-Tuning LLMs"
      hint="switch method and drag rank — watch trainable params drop"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground">Method:</span>
            <SegButton active={method === "full"} onClick={() => setMethod("full")}>Full</SegButton>
            <SegButton active={method === "lora"} onClick={() => setMethod("lora")}>LoRA</SegButton>
            <SegButton active={method === "instruct"} onClick={() => setMethod("instruct")}>Instruction</SegButton>
          </div>
          <ControlGroup>
            <Slider
              label="Training steps"
              min={0}
              max={100}
              step={5}
              value={trainSteps}
              onChange={setTrainSteps}
              format={(v) => `${v}`}
            />
            <Slider
              label="LoRA rank  r"
              min={1}
              max={4}
              step={1}
              value={rank}
              onChange={setRank}
              format={(v) => (method === "lora" ? `r=${v}` : "—")}
            />
          </ControlGroup>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>
              trainable params:{" "}
              <span className="font-mono font-semibold" style={{ color: accentDelta }}>
                {trainableParams} / {totalParams}
              </span>{" "}
              <span className="font-mono">({pctParams}%)</span>
            </span>
            <span>
              |ΔW| ={" "}
              <span className="font-mono text-foreground">{deltaStrength}</span>
            </span>
            <span>
              update alignment:{" "}
              <span className="font-mono font-semibold" style={{ color: qualityColor }}>
                {qualityPct}%
              </span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <WeightGrid matrix={base} label="Base W" accent="var(--muted-foreground)" x0={x0Base} y0={y0} />
        <text x={opSign + 18} y={midY + 5} textAnchor="middle" fontSize={22} fill="var(--muted-foreground)" fontWeight="300">+</text>
        <WeightGrid matrix={delta} label={methodLabel[method]} accent={accentDelta} x0={x0Delta} y0={y0} />
        {method === "lora" && (
          <>
            <line
              x1={x0Delta}
              y1={y0 + GRID_W + 5}
              x2={x0Delta + rank * CELL}
              y2={y0 + GRID_W + 5}
              stroke="var(--brand-cyan)"
              strokeWidth={2}
            />
            <text x={x0Delta + rank * CELL / 2} y={y0 + GRID_W + 17} textAnchor="middle" fontSize={8} fill="var(--brand-cyan)">
              rank {rank}
            </text>
          </>
        )}

        <text x={eqSign + 18} y={midY + 5} textAnchor="middle" fontSize={22} fill="var(--muted-foreground)" fontWeight="300">=</text>
        <WeightGrid matrix={adapted} label="Adapted W′" accent="var(--brand-cyan)" x0={x0Adapted} y0={y0} />
        <rect x={x0Adapted} y={y0 + GRID_W + 10} width={GRID_W} height={7} rx={3} fill="var(--border)" />
        <rect
          x={x0Adapted}
          y={y0 + GRID_W + 10}
          width={Math.max(2, (trainableParams / totalParams) * GRID_W)}
          height={7}
          rx={3}
          fill={accentDelta}
          opacity={0.85}
        />
        <text x={x0Adapted + GRID_W / 2} y={y0 + GRID_W + 27} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">
          {pctParams}% of params trained
        </text>
      </svg>
    </VizFrame>
  );
}
