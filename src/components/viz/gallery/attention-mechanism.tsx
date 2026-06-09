"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { Shuffle } from "lucide-react";

const W = 640, H = 320, PAD = 36;
const TOKENS = ["the", "cat", "sat", "on", "mat"];
const N = TOKENS.length;
const DK = 4; // key dimension

function makeVecs(seed: number): { Q: number[][]; K: number[][]; V: number[][] } {
  const r = rng(seed);
  const rand = () => (r() * 2 - 1) * 1.5;
  return {
    Q: range(N).map(() => range(DK).map(rand)),
    K: range(N).map(() => range(DK).map(rand)),
    V: range(N).map(() => range(DK).map(rand)),
  };
}

function dot(a: number[], b: number[]) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function softmax(xs: number[]): number[] {
  const max = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function Viz() {
  const [queryIdx, setQueryIdx] = useState(1);
  const [temperature, setTemperature] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [mode, setMode] = useState<"weights" | "output">("weights");

  const { Q, K, V } = useMemo(() => makeVecs(seed), [seed]);

  const rawScores = useMemo(() => {
    const scale = Math.sqrt(DK);
    return range(N).map((j) => dot(Q[queryIdx], K[j]) / (scale * temperature));
  }, [Q, K, queryIdx, temperature]);

  const weights = useMemo(() => softmax(rawScores), [rawScores]);

  const outputVec = useMemo(
    () => range(DK).map((d) => weights.reduce((s, w, j) => s + w * V[j][d], 0)),
    [weights, V],
  );

  const topIdx = weights.indexOf(Math.max(...weights));

  const colX = (j: number) => PAD + (j / (N - 1)) * (W - 2 * PAD);
  const tokenY = 38;
  const barBase = H - PAD;
  const barMaxH = H - tokenY - PAD * 2 - 20;

  const barColor = (j: number) =>
    j === queryIdx
      ? "var(--brand-cyan)"
      : j === topIdx
        ? "var(--brand-violet)"
        : "var(--muted-foreground)";

  return (
    <VizFrame
      title="Attention Mechanism"
      hint="pick a query token — watch weights shift"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((tok, i) => (
              <SegButton key={tok} active={queryIdx === i} onClick={() => setQueryIdx(i)}>
                {tok}
              </SegButton>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              query token: <span className="font-mono text-foreground">"{TOKENS[queryIdx]}"</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[160px]">
              <Slider
                label="Temperature (sharpness)"
                min={0.3}
                max={3}
                step={0.1}
                value={temperature}
                onChange={setTemperature}
                format={(v) => v.toFixed(1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <SegButton active={mode === "weights"} onClick={() => setMode("weights")}>Weights</SegButton>
              <SegButton active={mode === "output"} onClick={() => setMode("output")}>Output vec</SegButton>
              <VizButton onClick={() => setSeed((s) => s + 1)}><Shuffle size={13} /> Reseed</VizButton>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            entropy:{" "}
            <span className="font-mono text-foreground">
              {(-weights.reduce((s, w) => s + (w > 0 ? w * Math.log2(w) : 0), 0)).toFixed(2)} bits
            </span>
            {" · "}top attend:{" "}
            <span className="font-mono text-[var(--brand-violet)]">
              "{TOKENS[topIdx]}" ({(weights[topIdx] * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* arrows from query to all keys */}
        {range(N).map((j) => {
          if (j === queryIdx) return null;
          const alpha = 0.15 + weights[j] * 1.8;
          return (
            <line
              key={`arrow-${j}`}
              x1={colX(queryIdx)}
              y1={tokenY + 14}
              x2={colX(j)}
              y2={tokenY + 14}
              stroke="var(--brand-cyan)"
              strokeWidth={1 + weights[j] * 8}
              opacity={Math.min(alpha, 0.85)}
              strokeLinecap="round"
            />
          );
        })}

        {/* token labels */}
        {range(N).map((j) => (
          <g key={`tok-${j}`}>
            <rect
              x={colX(j) - 20}
              y={tokenY - 14}
              width={40}
              height={22}
              rx={5}
              fill={j === queryIdx ? "var(--brand-cyan)" : "var(--card)"}
              stroke={j === queryIdx ? "var(--brand-cyan)" : "var(--border)"}
              strokeWidth={j === queryIdx ? 0 : 1}
              opacity={j === queryIdx ? 0.9 : 1}
            />
            <text
              x={colX(j)}
              y={tokenY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={j === queryIdx ? "700" : "500"}
              fill={j === queryIdx ? "var(--background)" : "var(--foreground)"}
            >
              {TOKENS[j]}
            </text>
          </g>
        ))}

        {/* Q label */}
        <text
          x={colX(queryIdx)}
          y={tokenY - 18}
          textAnchor="middle"
          fontSize={9}
          fontWeight="700"
          fill="var(--brand-cyan)"
        >
          Q
        </text>

        {/* mode: attention weight bars */}
        {mode === "weights" &&
          range(N).map((j) => {
            const bh = weights[j] * barMaxH;
            return (
              <g key={`bar-${j}`}>
                <rect
                  x={colX(j) - 16}
                  y={barBase - bh}
                  width={32}
                  height={bh}
                  rx={3}
                  fill={barColor(j)}
                  opacity={j === queryIdx ? 0.4 : 0.82}
                />
                <text
                  x={colX(j)}
                  y={barBase - bh - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="600"
                  fill={barColor(j)}
                >
                  {(weights[j] * 100).toFixed(0)}%
                </text>
                <text
                  x={colX(j)}
                  y={barBase + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--muted-foreground)"
                >
                  {rawScores[j].toFixed(1)}
                </text>
              </g>
            );
          })}

        {/* mode: output vector visualization */}
        {mode === "output" &&
          range(DK).map((d) => {
            const cx = PAD + (d / (DK - 1)) * (W - 2 * PAD);
            const val = outputVec[d];
            const maxV = 2.5;
            const posH = Math.min((val / maxV) * (barMaxH * 0.5), barMaxH * 0.5);
            const negH = Math.max((val / maxV) * (barMaxH * 0.5), -barMaxH * 0.5);
            const midY = barBase - barMaxH * 0.5;
            return (
              <g key={`out-${d}`}>
                {val >= 0 ? (
                  <rect x={cx - 22} y={midY - posH} width={44} height={posH} rx={3} fill="var(--brand-cyan)" opacity={0.82} />
                ) : (
                  <rect x={cx - 22} y={midY} width={44} height={-negH} rx={3} fill="var(--brand-pink)" opacity={0.82} />
                )}
                <line x1={PAD - 8} y1={midY} x2={W - PAD + 8} y2={midY} stroke="var(--border)" strokeWidth={1} />
                <text x={cx} y={val >= 0 ? midY - posH - 6 : midY - negH + 14} textAnchor="middle" fontSize={10} fontWeight="600" fill={val >= 0 ? "var(--brand-cyan)" : "var(--brand-pink)"}>
                  {val.toFixed(2)}
                </text>
                <text x={cx} y={barBase + 14} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
                  d{d + 1}
                </text>
              </g>
            );
          })}

        {/* axis label */}
        <text x={W / 2} y={barBase + 26} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
          {mode === "weights" ? "attention weights  (raw score below bar)" : "output = weighted sum of V vectors"}
        </text>
      </svg>
    </VizFrame>
  );
}
