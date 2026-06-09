"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 340, PAD = 44;

const TOPICS = ["Python", "SQL", "ML", "Stats", "Viz", "NLP", "DL", "Cloud"] as const;
type Topic = (typeof TOPICS)[number];

const QUERY_LABELS: Topic[] = ["NLP", "ML", "Stats"];

interface Doc { x: number; y: number; topic: Topic; label: string }
interface ScoredDoc extends Doc { sim: number }

function cosSim(ax: number, ay: number, bx: number, by: number): number {
  const dot = ax * bx + ay * by;
  const mag = Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by);
  return mag < 1e-9 ? 0 : dot / mag;
}

const TOPIC_CLUSTERS: Record<Topic, [number, number]> = {
  NLP: [0.55, 0.72], ML: [0.48, 0.52], Stats: [0.38, 0.62],
  DL: [0.65, 0.55], Python: [0.30, 0.30], SQL: [0.18, 0.40],
  Viz: [0.22, 0.65], Cloud: [0.80, 0.28],
};

const TOPIC_COLORS: Record<Topic, string> = {
  NLP: "var(--brand-cyan)", ML: "var(--brand-violet)", Stats: "var(--brand-indigo)",
  DL: "var(--brand-pink)", Python: "var(--success)", SQL: "var(--warning)",
  Viz: "var(--brand-cyan)", Cloud: "var(--muted-foreground)",
};

const DOC_COUNT = 28;

function makeDocs(seed: number): Doc[] {
  const r = rng(seed);
  return range(DOC_COUNT).map((i: number) => {
    const topic = TOPICS[i % TOPICS.length];
    const [cx, cy] = TOPIC_CLUSTERS[topic];
    const jx = (r() - 0.5) * 0.22;
    const jy = (r() - 0.5) * 0.22;
    return { x: Math.max(0.05, Math.min(0.95, cx + jx)), y: Math.max(0.05, Math.min(0.95, cy + jy)), topic, label: `${topic}-${i + 1}` };
  });
}

const QUERY_POSITIONS: Record<Topic, [number, number]> = {
  NLP: [0.58, 0.68], ML: [0.50, 0.50], Stats: [0.35, 0.60],
  DL: [0.62, 0.50], Python: [0.28, 0.32], SQL: [0.16, 0.42],
  Viz: [0.20, 0.68], Cloud: [0.78, 0.30],
};

const LEGEND: [Topic, string][] = [
  ["NLP", "var(--brand-cyan)"], ["ML", "var(--brand-violet)"],
  ["Stats", "var(--brand-indigo)"], ["DL", "var(--brand-pink)"],
];

export default function Viz() {
  const [seed, setSeed] = useState(7);
  const [topK, setTopK] = useState(4);
  const [queryTopic, setQueryTopic] = useState<Topic>("NLP");
  const [mode, setMode] = useState<"rag" | "norag">("rag");

  const docs = useMemo(() => makeDocs(seed), [seed]);
  const [qx, qy] = QUERY_POSITIONS[queryTopic];

  const scored: ScoredDoc[] = useMemo(
    () =>
      docs
        .map((d: Doc) => ({ ...d, sim: cosSim(d.x - 0.5, d.y - 0.5, qx - 0.5, qy - 0.5) }))
        .sort((a: ScoredDoc, b: ScoredDoc) => b.sim - a.sim),
    [docs, qx, qy],
  );

  const retrieved = scored.slice(0, topK);
  const retrievedSet = new Set(retrieved.map((d: ScoredDoc) => d.label));
  const relevantCount = retrieved.filter((d: ScoredDoc) => d.topic === queryTopic).length;
  const precision = topK > 0 ? relevantCount / topK : 0;

  const answerQuality = mode === "rag" ? Math.round(40 + precision * 55) : 32;
  const confidenceColor =
    answerQuality >= 80 ? "var(--success)" : answerQuality >= 55 ? "var(--warning)" : "var(--danger)";

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const sy = (v: number) => PAD + (1 - v) * (H - 2 * PAD);

  const kthDoc = scored[topK - 1] as ScoredDoc | undefined;
  const radiusPx = kthDoc
    ? Math.sqrt((sx(kthDoc.x) - sx(qx)) ** 2 + (sy(kthDoc.y) - sy(qy)) ** 2)
    : 0;

  const bx = W - PAD - 24, by = PAD + 8, bh = H - 2 * PAD - 16;
  const fillH = (answerQuality / 100) * bh;

  return (
    <VizFrame
      title="Retrieval-Augmented Generation"
      hint="change the query topic and top-K to see which docs get retrieved"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Query:</span>
            {QUERY_LABELS.map((t: Topic) => (
              <SegButton key={t} active={queryTopic === t} onClick={() => setQueryTopic(t)}>
                {t}
              </SegButton>
            ))}
            <SegButton active={mode === "rag"} onClick={() => setMode("rag")}>With RAG</SegButton>
            <SegButton active={mode === "norag"} onClick={() => setMode("norag")}>No RAG</SegButton>
            <VizButton onClick={() => setSeed((s: number) => s + 1)} className="ml-auto">
              <RotateCcw size={12} /> Reseed
            </VizButton>
          </div>
          <Slider
            label="Top-K retrieved docs"
            min={1} max={10} step={1}
            value={topK}
            onChange={(v: number) => setTopK(Math.round(v))}
            format={(v: number) => String(Math.round(v))}
          />
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span>
              relevant / retrieved:{" "}
              <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>
                {mode === "rag" ? `${relevantCount} / ${topK}` : "—"}
              </span>
            </span>
            <span>
              precision:{" "}
              <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>
                {mode === "rag" ? `${(precision * 100).toFixed(0)}%` : "—"}
              </span>
            </span>
            <span>
              answer quality:{" "}
              <span className="font-mono font-bold" style={{ color: confidenceColor }}>
                {answerQuality}%
              </span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">
          embedding dimension 1
        </text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)"
          transform={`rotate(-90, 10, ${H / 2})`}>
          dim 2
        </text>

        {/* retrieval radius circle */}
        {mode === "rag" && kthDoc && (
          <circle
            cx={sx(qx)} cy={sy(qy)} r={radiusPx}
            fill="var(--brand-cyan)" fillOpacity={0.07}
            stroke="var(--brand-cyan)" strokeOpacity={0.3}
            strokeWidth={1.5} strokeDasharray="5 4"
          />
        )}

        {/* connection lines from query to retrieved docs */}
        {mode === "rag" && retrieved.map((d: ScoredDoc) => (
          <line
            key={`line-${d.label}`}
            x1={sx(qx)} y1={sy(qy)}
            x2={sx(d.x)} y2={sy(d.y)}
            stroke={d.topic === queryTopic ? "var(--brand-cyan)" : "var(--muted-foreground)"}
            strokeWidth={d.topic === queryTopic ? 1.5 : 0.8}
            strokeOpacity={d.topic === queryTopic ? 0.7 : 0.3}
            strokeDasharray={d.topic === queryTopic ? "" : "3 3"}
          />
        ))}

        {/* document dots */}
        {docs.map((d: Doc) => {
          const isRetrieved = retrievedSet.has(d.label) && mode === "rag";
          const isRelevant = d.topic === queryTopic;
          const color = TOPIC_COLORS[d.topic];
          return (
            <circle
              key={d.label}
              cx={sx(d.x)} cy={sy(d.y)}
              r={isRetrieved ? 7 : 5}
              fill={color}
              fillOpacity={isRetrieved ? (isRelevant ? 0.92 : 0.45) : (isRelevant ? 0.35 : 0.18)}
              stroke={isRetrieved ? color : "none"}
              strokeWidth={isRetrieved ? (isRelevant ? 2 : 1) : 0}
            />
          );
        })}

        {/* query point */}
        <circle cx={sx(qx)} cy={sy(qy)} r={11}
          fill="var(--brand-cyan)" fillOpacity={0.2}
          stroke="var(--brand-cyan)" strokeWidth={2.5} />
        <text x={sx(qx)} y={sy(qy)} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fontWeight="700" fill="var(--brand-cyan)">Q</text>
        <text x={sx(qx)} y={sy(qy) - 16} textAnchor="middle"
          fontSize={9} fontWeight="600" fill="var(--brand-cyan)">
          &quot;{queryTopic} query&quot;
        </text>

        {/* answer quality bar */}
        <rect x={bx} y={by} width={22} height={bh} rx={4}
          fill="var(--muted)" fillOpacity={0.3} stroke="var(--border)" strokeWidth={1} />
        <rect x={bx} y={by + bh - fillH} width={22} height={fillH} rx={4}
          fill={confidenceColor} opacity={0.8} />
        <text x={bx + 11} y={by - 8} textAnchor="middle" fontSize={8} fill="var(--muted-foreground)">
          answer
        </text>
        <text x={bx + 11} y={by - 0} textAnchor="middle" fontSize={7} fill="var(--muted-foreground)">
          quality
        </text>
        <text x={bx + 11} y={by + bh + 12} textAnchor="middle"
          fontSize={9} fontWeight="700" fill={confidenceColor}>
          {answerQuality}%
        </text>

        {/* topic legend */}
        {LEGEND.map(([t, c]: [Topic, string], i: number) => (
          <g key={t}>
            <circle cx={PAD + i * 72} cy={H - 12} r={4} fill={c} fillOpacity={0.85} />
            <text x={PAD + i * 72 + 9} y={H - 8} fontSize={9} fill="var(--muted-foreground)">{t}</text>
          </g>
        ))}
      </svg>
    </VizFrame>
  );
}
