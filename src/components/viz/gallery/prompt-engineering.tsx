"use client";

import { useState, useMemo } from "react";

import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 340, PAD = 40;

type Technique = "fewshot" | "cot" | "structured";
type Task = "classify" | "math" | "extract";

const TASK_LABELS: Record<Task, string> = {
  classify: "Sentiment classification",
  math: "Multi-step reasoning",
  extract: "Structured extraction",
};

// Simulated quality scores [0..1] for each task × technique combination
// Rows: task; Cols: baseline, +fewshot, +cot, +structured, all-three
// These encode domain knowledge about what helps what
const SCORES: Record<Task, Record<string, number>> = {
  classify: { base: 0.38, fewshot: 0.81, cot: 0.52, structured: 0.55, all: 0.93 },
  math:     { base: 0.22, fewshot: 0.41, cot: 0.84, structured: 0.47, all: 0.96 },
  extract:  { base: 0.31, fewshot: 0.58, cot: 0.44, structured: 0.89, all: 0.97 },
};

// Individual technique contributions when combined (used for bar breakdown)
const CONTRIB: Record<Task, Record<Technique, number>> = {
  classify: { fewshot: 0.43, cot: 0.14, structured: 0.17 },
  math:     { fewshot: 0.19, cot: 0.62, structured: 0.25 },
  extract:  { fewshot: 0.27, cot: 0.13, structured: 0.58 },
};

const TECHNIQUE_COLORS: Record<Technique, string> = {
  fewshot:    "var(--brand-cyan)",
  cot:        "var(--brand-violet)",
  structured: "var(--brand-pink)",
};

const TECHNIQUE_LABELS: Record<Technique, string> = {
  fewshot:    "Few-shot examples",
  cot:        "Chain-of-thought",
  structured: "Structured output",
};

const PROMPT_SNIPPETS: Record<Technique, string> = {
  fewshot:    '"positive" → happy review\n"negative" → complaint\nNow classify:',
  cot:        "Let's think step by step:\n1) Identify entities\n2) Reason through\n3) Answer:",
  structured: 'Respond ONLY as JSON:\n{"label": ..., "conf": ...,\n "reason": "..."}',
};

function computeScore(task: Task, on: Set<Technique>): number {
  if (on.size === 0) return SCORES[task].base;
  if (on.size === 3) return SCORES[task].all;
  const base = SCORES[task].base;
  let gain = 0;
  const contribs = CONTRIB[task];
  const keys = Array.from(on) as Technique[];
  // Diminishing returns: each extra technique adds fraction of its solo gain
  keys.forEach((t, i) => { gain += contribs[t] * Math.pow(0.72, i); });
  return Math.min(base + gain, SCORES[task].all);
}

function qualityLabel(score: number): { text: string; color: string } {
  if (score >= 0.88) return { text: "Excellent", color: "var(--success)" };
  if (score >= 0.70) return { text: "Good", color: "var(--brand-cyan)" };
  if (score >= 0.50) return { text: "Fair", color: "var(--warning)" };
  return { text: "Poor", color: "var(--danger)" };
}

export default function Viz() {
  const [task, setTask] = useState<Task>("classify");
  const [on, setOn] = useState<Set<Technique>>(new Set());

  const techniques: Technique[] = ["fewshot", "cot", "structured"];

  const toggle = (t: Technique) => {
    setOn((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const score = useMemo(() => computeScore(task, on), [task, on]);
  const baseline = SCORES[task].base;
  const maxScore = SCORES[task].all;
  const { text: qualText, color: qualColor } = qualityLabel(score);

  // Bar chart: per-technique contribution when toggled on
  const barW = 62, barGap = 28;
  const barAreaH = H - PAD * 2 - 30;
  const barAreaTop = PAD + 28;
  const barGroupX = (i: number) => PAD + 40 + i * (barW + barGap);

  // Meter arc dimensions
  const meterCX = W - 110, meterCY = PAD + 60, meterR = 52;
  const arcAngle = (v: number) => -Math.PI + v * Math.PI; // -π to 0
  const arcX = (v: number) => meterCX + meterR * Math.cos(arcAngle(v));
  const arcY = (v: number) => meterCY + meterR * Math.sin(arcAngle(v));
  const arcPath = (from: number, to: number, r: number) => {
    const x1 = meterCX + r * Math.cos(arcAngle(from));
    const y1 = meterCY + r * Math.sin(arcAngle(from));
    const x2 = meterCX + r * Math.cos(arcAngle(to));
    const y2 = meterCY + r * Math.sin(arcAngle(to));
    const large = to - from > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const activeList = techniques.filter((t) => on.has(t));

  return (
    <VizFrame
      title="Prompt Engineering"
      hint="toggle techniques — watch quality change"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Task:</span>
            {(Object.keys(TASK_LABELS) as Task[]).map((t) => (
              <SegButton key={t} active={task === t} onClick={() => { setTask(t); setOn(new Set()); }}>
                {TASK_LABELS[t]}
              </SegButton>
            ))}
            <VizButton onClick={() => setOn(new Set())} className="ml-auto">
              <RotateCcw size={12} /> Reset
            </VizButton>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1 self-center">Techniques:</span>
            {techniques.map((t) => (
              <button
                key={t}
                onClick={() => toggle(t)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  borderColor: on.has(t) ? TECHNIQUE_COLORS[t] : "var(--border)",
                  background: on.has(t) ? TECHNIQUE_COLORS[t] + "22" : "var(--muted)",
                  color: on.has(t) ? TECHNIQUE_COLORS[t] : "var(--muted-foreground)",
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: on.has(t) ? TECHNIQUE_COLORS[t] : "var(--border)" }}
                />
                {TECHNIQUE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              Quality:{" "}
              <span className="font-mono font-semibold" style={{ color: qualColor }}>
                {(score * 100).toFixed(0)}% — {qualText}
              </span>
            </span>
            <span>
              Baseline:{" "}
              <span className="font-mono text-foreground">{(baseline * 100).toFixed(0)}%</span>
            </span>
            <span>
              Gain:{" "}
              <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>
                +{((score - baseline) * 100).toFixed(0)}pp
              </span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* ── Meter arc ── */}
        <path d={arcPath(0, 1, meterR)} fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
        <path d={arcPath(0, score, meterR)} fill="none" stroke={qualColor} strokeWidth={8} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.4s" }} />
        {/* needle */}
        <line
          x1={meterCX} y1={meterCY}
          x2={arcX(score)} y2={arcY(score)}
          stroke={qualColor} strokeWidth={2.5} strokeLinecap="round"
        />
        <circle cx={meterCX} cy={meterCY} r={4} fill={qualColor} />
        <text x={meterCX} y={meterCY + 18} textAnchor="middle" fontSize={18} fontWeight="700" fill={qualColor}>
          {(score * 100).toFixed(0)}%
        </text>
        <text x={meterCX} y={meterCY + 32} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
          response quality
        </text>
        <text x={meterCX - meterR - 2} y={meterCY + 6} textAnchor="end" fontSize={8} fill="var(--muted-foreground)">0</text>
        <text x={meterCX + meterR + 2} y={meterCY + 6} textAnchor="start" fontSize={8} fill="var(--muted-foreground)">100%</text>

        {/* ── Bar chart: per-technique contribution ── */}
        {/* Y axis label */}
        <text x={PAD + 12} y={barAreaTop - 8} fontSize={9} fill="var(--muted-foreground)">quality lift per technique for "{TASK_LABELS[task]}"</text>

        {/* Baseline bar */}
        {(() => {
          const bh = (baseline / 1.0) * barAreaH;
          return (
            <g>
              <rect x={PAD + 40} y={barAreaTop + barAreaH - bh} width={barW} height={bh} rx={4}
                fill="var(--muted-foreground)" opacity={0.3} />
              <text x={PAD + 40 + barW / 2} y={barAreaTop + barAreaH - bh - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
                {(baseline * 100).toFixed(0)}%
              </text>
              <text x={PAD + 40 + barW / 2} y={barAreaTop + barAreaH + 14} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
                baseline
              </text>
            </g>
          );
        })()}

        {/* Per-technique bars */}
        {techniques.map((t, i) => {
          const soloScore = Math.min(baseline + CONTRIB[task][t], maxScore);
          const bh = (soloScore / 1.0) * barAreaH;
          const baseH = (baseline / 1.0) * barAreaH;
          const gainH = bh - baseH;
          const x = barGroupX(i + 1);
          const isOn = on.has(t);
          return (
            <g key={t} style={{ cursor: "pointer" }} onClick={() => toggle(t)}>
              {/* base portion */}
              <rect x={x} y={barAreaTop + barAreaH - baseH} width={barW} height={baseH} rx={4}
                fill="var(--muted-foreground)" opacity={0.18} />
              {/* gain portion */}
              <rect x={x} y={barAreaTop + barAreaH - bh} width={barW} height={gainH} rx={4}
                fill={TECHNIQUE_COLORS[t]} opacity={isOn ? 0.85 : 0.28} />
              <text x={x + barW / 2} y={barAreaTop + barAreaH - bh - 6} textAnchor="middle" fontSize={10}
                fontWeight="600" fill={isOn ? TECHNIQUE_COLORS[t] : "var(--muted-foreground)"}>
                {(soloScore * 100).toFixed(0)}%
              </text>
              <text x={x + barW / 2} y={barAreaTop + barAreaH + 14} textAnchor="middle" fontSize={9}
                fill={isOn ? TECHNIQUE_COLORS[t] : "var(--muted-foreground)"}>
                {t === "fewshot" ? "few-shot" : t === "cot" ? "chain-of-thought" : "structured"}
              </text>
              {isOn && (
                <text x={x + barW / 2} y={barAreaTop + barAreaH + 25} textAnchor="middle" fontSize={8}
                  fill={TECHNIQUE_COLORS[t]}>
                  ✓ ON
                </text>
              )}
            </g>
          );
        })}

        {/* Composite score marker line */}
        {on.size > 0 && (() => {
          const lineY = barAreaTop + barAreaH - (score / 1.0) * barAreaH;
          const x1 = PAD + 40;
          const x2 = barGroupX(3) + barW;
          return (
            <g>
              <line x1={x1} y1={lineY} x2={x2} y2={lineY}
                stroke={qualColor} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.8} />
              <text x={x2 + 6} y={lineY + 4} fontSize={9} fill={qualColor} fontWeight="600">
                combined: {(score * 100).toFixed(0)}%
              </text>
            </g>
          );
        })()}

        {/* X axis baseline */}
        <line x1={PAD + 28} y1={barAreaTop + barAreaH} x2={barGroupX(3) + barW + 8}
          y2={barAreaTop + barAreaH} stroke="var(--border)" strokeWidth={1} />

        {/* Prompt snippet panel */}
        {activeList.length > 0 && (() => {
          const snippetX = W - 210;
          const snippetY = meterCY + 60;
          const t = activeList[activeList.length - 1];
          const lines = PROMPT_SNIPPETS[t].split("\n");
          return (
            <g>
              <rect x={snippetX} y={snippetY} width={190} height={lines.length * 13 + 22} rx={6}
                fill="var(--card)" stroke={TECHNIQUE_COLORS[t]} strokeWidth={1} opacity={0.95} />
              <text x={snippetX + 8} y={snippetY + 13} fontSize={8} fontWeight="700" fill={TECHNIQUE_COLORS[t]}>
                {TECHNIQUE_LABELS[t]} snippet
              </text>
              {lines.map((line, i) => (
                <text key={i} x={snippetX + 8} y={snippetY + 24 + i * 13} fontSize={8}
                  fill="var(--muted-foreground)" fontFamily="monospace">
                  {line}
                </text>
              ))}
            </g>
          );
        })()}

        {/* Legend: "click bar to toggle" hint */}
        {on.size === 0 && (
          <text x={barGroupX(2) + barW / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
            click a bar or use the toggles below to activate a technique
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
