"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { mapRange, clamp } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

const W = 620, H = 360, PAD = 48;

type Word = { label: string; x: number; y: number };

const DATASETS: Record<string, Word[]> = {
  royalty: [
    { label: "king",   x: 0.72, y: 0.78 },
    { label: "queen",  x: 0.56, y: 0.78 },
    { label: "man",    x: 0.74, y: 0.42 },
    { label: "woman",  x: 0.58, y: 0.42 },
    { label: "prince", x: 0.88, y: 0.63 },
    { label: "princess", x: 0.72, y: 0.63 },
    { label: "boy",    x: 0.86, y: 0.27 },
    { label: "girl",   x: 0.70, y: 0.27 },
    { label: "dog",    x: 0.20, y: 0.40 },
    { label: "cat",    x: 0.20, y: 0.22 },
    { label: "fish",   x: 0.20, y: 0.60 },
    { label: "stone",  x: 0.22, y: 0.78 },
  ],
  foods: [
    { label: "pizza",   x: 0.62, y: 0.72 },
    { label: "pasta",   x: 0.75, y: 0.72 },
    { label: "burger",  x: 0.62, y: 0.55 },
    { label: "fries",   x: 0.76, y: 0.55 },
    { label: "sushi",   x: 0.25, y: 0.72 },
    { label: "ramen",   x: 0.38, y: 0.72 },
    { label: "apple",   x: 0.25, y: 0.30 },
    { label: "banana",  x: 0.38, y: 0.30 },
    { label: "mango",   x: 0.32, y: 0.18 },
    { label: "cake",    x: 0.69, y: 0.25 },
    { label: "cookie",  x: 0.69, y: 0.12 },
    { label: "bread",   x: 0.56, y: 0.25 },
  ],
  tech: [
    { label: "python",  x: 0.40, y: 0.72 },
    { label: "numpy",   x: 0.26, y: 0.72 },
    { label: "pandas",  x: 0.54, y: 0.72 },
    { label: "java",    x: 0.80, y: 0.65 },
    { label: "kotlin",  x: 0.80, y: 0.52 },
    { label: "swift",   x: 0.80, y: 0.38 },
    { label: "react",   x: 0.40, y: 0.30 },
    { label: "vue",     x: 0.26, y: 0.30 },
    { label: "angular", x: 0.55, y: 0.30 },
    { label: "sql",     x: 0.18, y: 0.55 },
    { label: "mongo",   x: 0.18, y: 0.42 },
    { label: "redis",   x: 0.18, y: 0.28 },
  ],
};

const ANALOGY_PAIRS: Record<string, [string, string, string, string]> = {
  royalty: ["king", "man", "woman", "queen"],
  foods: ["pizza", "pasta", "ramen", "sushi"],
  tech: ["java", "kotlin", "python", "numpy"],
};

function cosine(a: Word, b: Word): number {
  const dot = a.x * b.x + a.y * b.y;
  const ma = Math.sqrt(a.x ** 2 + a.y ** 2);
  const mb = Math.sqrt(b.x ** 2 + b.y ** 2);
  if (ma < 1e-9 || mb < 1e-9) return 0;
  return clamp(dot / (ma * mb), -1, 1);
}

export default function Viz() {
  const [dataset, setDataset] = useState<keyof typeof DATASETS>("royalty");
  const [queryIdx, setQueryIdx] = useState(0);
  const [showAnalogy, setShowAnalogy] = useState(false);

  const words = useMemo(() => DATASETS[dataset], [dataset]);
  const query = words[queryIdx] ?? words[0];

  const similarities = useMemo(
    () => words.map((w) => ({ label: w.label, sim: cosine(query, w) })),
    [words, query],
  );

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - v * (H - 2 * PAD);

  const analogyPair = ANALOGY_PAIRS[dataset];
  const aW = words.find((w) => w.label === analogyPair[0]);
  const bW = words.find((w) => w.label === analogyPair[1]);
  const cW = words.find((w) => w.label === analogyPair[2]);
  const dW = words.find((w) => w.label === analogyPair[3]);

  const topSim = similarities
    .filter((s) => s.label !== query.label)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3);

  return (
    <VizFrame
      title="Embedding Space"
      hint="click a word to query similarity"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(["royalty", "foods", "tech"] as const).map((d) => (
              <SegButton key={d} active={dataset === d} onClick={() => { setDataset(d); setQueryIdx(0); setShowAnalogy(false); }}>
                {d}
              </SegButton>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <VizButton onClick={() => setShowAnalogy((a) => !a)}>
              {showAnalogy ? <><RotateCcw size={13} /> Hide analogy</> : <>Show analogy vector</>}
            </VizButton>
            <span className="text-xs text-muted-foreground ml-auto">
              query: <span className="font-mono text-[var(--brand-indigo)] font-semibold">{query.label}</span>
              &nbsp;→ top match: <span className="font-mono text-foreground font-semibold">{topSim[0]?.label}</span>
              &nbsp;<span className="font-mono text-[var(--success)]">{topSim[0]?.sim.toFixed(3)}</span>
            </span>
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            {topSim.map((s) => (
              <span key={s.label}>
                <span className="font-mono text-foreground">{s.label}</span>{" "}
                <span className="font-mono" style={{ color: `color-mix(in oklab, var(--success) ${Math.round(s.sim * 80 + 20)}%, var(--muted-foreground))` }}>
                  {s.sim.toFixed(3)}
                </span>
              </span>
            ))}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axis labels */}
        <text x={PAD} y={PAD - 10} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">dim₂</text>
        <text x={W - PAD + 4} y={H - PAD + 14} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">dim₁</text>
        <line x1={PAD} y1={PAD - 4} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />
        <line x1={PAD} y1={H - PAD} x2={W - PAD + 4} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />

        {/* Analogy arrow: A - B + C ≈ D, i.e. A→D shift equals B→C shift */}
        {showAnalogy && aW && bW && cW && dW && (
          <g opacity={0.85}>
            <defs>
              <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <polygon points="0 0, 7 3.5, 0 7" fill="var(--brand-indigo)" />
              </marker>
            </defs>
            <line
              x1={sx(bW.x)} y1={sy(bW.y)} x2={sx(cW.x) - 2} y2={sy(cW.y) + 2}
              stroke="var(--brand-indigo)" strokeWidth={2} strokeDasharray="5 3"
              markerEnd="url(#arrow)"
            />
            <line
              x1={sx(aW.x)} y1={sy(aW.y)} x2={sx(dW.x) - 2} y2={sy(dW.y) + 2}
              stroke="var(--brand-indigo)" strokeWidth={2} strokeDasharray="5 3"
              markerEnd="url(#arrow)"
            />
            <text x={(sx(bW.x) + sx(cW.x)) / 2 - 14} y={(sy(bW.y) + sy(cW.y)) / 2 - 6}
              fontSize={9} fill="var(--brand-indigo)" fontWeight="600">
              {analogyPair[1]}→{analogyPair[2]}
            </text>
          </g>
        )}

        {/* Similarity lines from query to each word */}
        {words.map((w, i) => {
          const sim = similarities[i].sim;
          if (w.label === query.label || sim < 0.85) return null;
          return (
            <line
              key={"sl" + i}
              x1={sx(query.x)} y1={sy(query.y)}
              x2={sx(w.x)} y2={sy(w.y)}
              stroke="var(--brand-indigo)"
              strokeWidth={mapRange(sim, 0.85, 1, 0.5, 2.5)}
              opacity={mapRange(sim, 0.85, 1, 0.08, 0.4)}
            />
          );
        })}

        {/* Word points */}
        {words.map((w, i) => {
          const sim = similarities[i].sim;
          const isQuery = w.label === query.label;
          const r = isQuery ? 8 : 5;
          const fill = isQuery
            ? "var(--brand-indigo)"
            : sim > 0.95
            ? "var(--success)"
            : sim > 0.85
            ? "var(--brand-cyan)"
            : "var(--muted-foreground)";

          const labelX = sx(w.x);
          const labelY = sy(w.y) - r - 4;

          return (
            <g
              key={w.label}
              style={{ cursor: "pointer" }}
              onClick={() => setQueryIdx(i)}
            >
              {isQuery && (
                <circle cx={sx(w.x)} cy={sy(w.y)} r={14} fill="var(--brand-indigo)" opacity={0.18} />
              )}
              <circle
                cx={sx(w.x)} cy={sy(w.y)} r={r}
                fill={fill}
                stroke={isQuery ? "var(--background)" : "none"}
                strokeWidth={2}
                opacity={0.9}
              />
              <text
                x={labelX} y={labelY}
                textAnchor="middle"
                fontSize={isQuery ? 11 : 10}
                fontWeight={isQuery ? "700" : "400"}
                fill={isQuery ? "var(--brand-indigo)" : "var(--foreground)"}
                opacity={isQuery ? 1 : 0.82}
              >
                {w.label}
              </text>
            </g>
          );
        })}

      </svg>
    </VizFrame>
  );
}
