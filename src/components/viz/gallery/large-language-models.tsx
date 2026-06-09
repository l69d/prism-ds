"use client";

import { useState, useMemo } from "react";
import { range, clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 320, PAD = 36;

// Candidate next tokens for each "step" in the sentence
const SCENARIOS: { context: string[]; candidates: string[]; logits: number[] }[] = [
  {
    context: ["The", "cat", "sat", "on", "the"],
    candidates: ["mat", "floor", "chair", "roof", "dog", "sky"],
    logits: [3.8, 2.4, 1.6, 0.4, -0.6, -1.2],
  },
  {
    context: ["Neural", "networks", "learn", "by"],
    candidates: ["training", "gradient", "backprop", "weights", "loss", "data"],
    logits: [2.9, 3.5, 2.1, 1.8, 1.2, 0.7],
  },
  {
    context: ["The", "model", "predicts", "the", "next"],
    candidates: ["token", "word", "sentence", "layer", "number", "step"],
    logits: [4.1, 3.2, 1.0, 0.3, -0.2, 0.8],
  },
];

function softmax(logits: number[], temp: number): number[] {
  const scaled = logits.map((l) => l / temp);
  const max = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

// Scale logits towards uniform (small model) or amplify (large model)
function scaledLogits(base: number[], modelScale: number): number[] {
  // modelScale: 0..1 → small (near-uniform) to large (sharp/correct)
  const mean = base.reduce((a, b) => a + b, 0) / base.length;
  return base.map((l) => mean + (l - mean) * modelScale);
}

export default function Viz() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [modelScale, setModelScale] = useState(0.5); // 0.1=tiny … 1.0=large
  const [temperature, setTemperature] = useState(1.0);
  const [generated, setGenerated] = useState<string[]>([]);

  const scenario = SCENARIOS[scenarioIdx];

  const logits = useMemo(
    () => scaledLogits(scenario.logits, clamp(modelScale, 0.1, 1.0)),
    [scenario.logits, modelScale],
  );

  const probs = useMemo(() => softmax(logits, temperature), [logits, temperature]);

  const topIdx = probs.indexOf(Math.max(...probs));
  const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);

  const context = [...scenario.context, ...generated];

  function handleStep() {
    setGenerated((g) => [...g, scenario.candidates[topIdx]]);
  }

  function handleReset() {
    setGenerated([]);
  }

  // Bar layout
  const n = scenario.candidates.length;
  const barW = Math.floor((W - 2 * PAD) / n) - 6;
  const barBase = H - PAD - 18;
  const barMaxH = H - PAD * 2 - 60;

  const barColor = (i: number) =>
    i === topIdx ? "var(--brand-cyan)" : "var(--brand-indigo)";

  const perplexity = Math.pow(2, entropy);

  return (
    <VizFrame
      title="Large Language Models"
      hint="raise model scale — watch the prediction sharpen"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Sentence:</span>
            {SCENARIOS.map((_s, i) => (
              <SegButton
                key={i}
                active={scenarioIdx === i}
                onClick={() => { setScenarioIdx(i); setGenerated([]); }}
              >
                #{i + 1}
              </SegButton>
            ))}
          </div>
          <ControlGroup>
            <Slider
              label="Model scale (parameters)"
              min={0.1}
              max={1.0}
              step={0.05}
              value={modelScale}
              onChange={setModelScale}
              format={(v) => v < 0.3 ? "tiny" : v < 0.6 ? "small" : v < 0.85 ? "medium" : "large"}
            />
            <Slider
              label="Sampling temperature"
              min={0.3}
              max={2.5}
              step={0.1}
              value={temperature}
              onChange={setTemperature}
              format={(v) => v.toFixed(1)}
            />
          </ControlGroup>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-xs text-muted-foreground">
              entropy:{" "}
              <span className="font-mono text-foreground">{entropy.toFixed(2)} bits</span>
              {" · "}perplexity:{" "}
              <span className="font-mono text-[var(--brand-cyan)]">{perplexity.toFixed(1)}</span>
              {" · "}top token:{" "}
              <span className="font-mono text-[var(--brand-cyan)]">
                "{scenario.candidates[topIdx]}" ({(probs[topIdx] * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex gap-2 ml-auto">
              <VizButton onClick={handleStep}>▶ Accept top</VizButton>
              <VizButton onClick={handleReset}><RotateCcw size={13} /> Reset</VizButton>
            </div>
          </div>
        </div>
      }
    >
      {/* Context tokens */}
      <div className="flex flex-wrap gap-1 px-2 pb-2 min-h-[32px]">
        {context.map((tok, i) => {
          const isNew = i >= scenario.context.length;
          return (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
              style={{
                background: isNew ? "var(--brand-cyan)" : "var(--card)",
                color: isNew ? "var(--background)" : "var(--foreground)",
                border: `1px solid ${isNew ? "var(--brand-cyan)" : "var(--border)"}`,
              }}
            >
              {tok}
            </span>
          );
        })}
        <span className="px-1 py-0.5 text-xs font-mono text-muted-foreground animate-pulse">▌</span>
      </div>

      {/* Probability bars */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {range(5).map((i) => {
          const p = (i + 1) * 0.2;
          const y = barBase - p * barMaxH;
          return (
            <g key={i}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize={8} fill="var(--muted-foreground)">
                {(p * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={PAD} y1={barBase} x2={W - PAD} y2={barBase} stroke="var(--border)" strokeWidth={1} />

        {/* Bars */}
        {range(n).map((i) => {
          const cx = PAD + (i + 0.5) * ((W - 2 * PAD) / n);
          const bh = clamp(probs[i] * barMaxH, 2, barMaxH);
          const isTop = i === topIdx;
          return (
            <g key={i}>
              <rect
                x={cx - barW / 2}
                y={barBase - bh}
                width={barW}
                height={bh}
                rx={3}
                fill={barColor(i)}
                opacity={isTop ? 0.95 : 0.55}
              />
              {isTop && (
                <rect
                  x={cx - barW / 2 - 2}
                  y={barBase - bh - 2}
                  width={barW + 4}
                  height={bh + 2}
                  rx={4}
                  fill="none"
                  stroke="var(--brand-cyan)"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              )}
              <text
                x={cx}
                y={barBase - bh - 6}
                textAnchor="middle"
                fontSize={9}
                fontWeight={isTop ? "700" : "500"}
                fill={isTop ? "var(--brand-cyan)" : "var(--muted-foreground)"}
              >
                {(probs[i] * 100).toFixed(0)}%
              </text>
              <text
                x={cx}
                y={barBase + 12}
                textAnchor="middle"
                fontSize={10}
                fontWeight={isTop ? "700" : "500"}
                fill={isTop ? "var(--foreground)" : "var(--muted-foreground)"}
              >
                {scenario.candidates[i]}
              </text>
            </g>
          );
        })}

        {/* Axis label */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
          next-token probability distribution  (↑ model scale = sharper = lower perplexity)
        </text>
      </svg>
    </VizFrame>
  );
}
