"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const DOCS = [
  "The cat sat on the mat near the warm fireplace",
  "Dogs are running and jumping through the green fields",
  "The cat and the dog are playing in the sunny fields",
];

const STOP_WORDS = new Set([
  "the","a","an","and","are","is","in","on","near","of","to","for",
  "with","through","by","at","from","it","be","was","were","or","but","not",
]);

const STEMS: Record<string, string> = {
  running:"run", jumping:"jump", playing:"play", warm:"warm", sunny:"sunny",
  green:"green", fields:"field", fireplace:"fireplac", cats:"cat", dogs:"dog",
  sat:"sat", fields_:"field",
};
function stem(w: string): string { return STEMS[w] ?? (w.endsWith("ing") ? w.slice(0,-3) : w.endsWith("s") ? w.slice(0,-1) : w); }

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).filter(Boolean);
}

type Stage = "raw" | "tokenized" | "stopped" | "stemmed";

const STAGE_LABELS: Stage[] = ["raw","tokenized","stopped","stemmed"];
const STAGE_NAMES: Record<Stage, string> = {
  raw:"Raw Text", tokenized:"Tokenized", stopped:"Stop Words Removed", stemmed:"Stemmed",
};

function processDoc(text: string, stage: Stage): string[] {
  if (stage === "raw") return [text];
  const tokens = tokenize(text);
  if (stage === "tokenized") return tokens;
  const noStop = tokens.filter((w) => !STOP_WORDS.has(w));
  if (stage === "stopped") return noStop;
  return noStop.map(stem);
}

function computeTfIdf(docs: string[][], term: string): number[] {
  const N = docs.length;
  const df = docs.filter((d) => d.includes(term)).length;
  const idf = df === 0 ? 0 : Math.log((N + 1) / (df + 1)) + 1;
  return docs.map((d) => {
    const tf = d.length === 0 ? 0 : d.filter((w) => w === term).length / d.length;
    return tf * idf;
  });
}

const ACCENT = "var(--brand-cyan)";
const ACCENT2 = "var(--brand-violet)";
const ACCENT3 = "var(--brand-pink)";
const DOC_COLORS = [ACCENT, ACCENT2, ACCENT3];
const DOC_LABELS = ["Doc 1","Doc 2","Doc 3"];

export default function Viz() {
  const [stage, setStage] = useState<Stage>("raw");
  const [docIdx, setDocIdx] = useState(0);

  const stemmedDocs = useMemo(() => DOCS.map((d) => processDoc(d, "stemmed")), []);

  const vocab = useMemo(() => {
    const all = stemmedDocs.flat();
    const counts: Record<string, number> = {};
    all.forEach((w) => { counts[w] = (counts[w] ?? 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([w]) => w);
  }, [stemmedDocs]);

  const tfidfMatrix = useMemo(
    () => vocab.map((term) => computeTfIdf(stemmedDocs, term)),
    [vocab, stemmedDocs],
  );

  const currentTokens = useMemo(() => processDoc(DOCS[docIdx], stage), [stage, docIdx]);

  const W = 640, H = 210, PAD_L = 56, PAD_R = 16, PAD_T = 14, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const barWidth = chartW / vocab.length;
  const maxTf = useMemo(() => Math.max(...tfidfMatrix.flat(), 0.01), [tfidfMatrix]);

  const sy = (v: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - v / maxTf);
  const barH = (v: number) => Math.max(2, (H - PAD_T - PAD_B) * (v / maxTf));
  const barX = (i: number) => PAD_L + i * barWidth + barWidth * 0.15;
  const singleBarW = barWidth * 0.7;

  const stageIdx = STAGE_LABELS.indexOf(stage);

  return (
    <VizFrame
      title="Text Preprocessing Pipeline"
      hint="step through each stage, then explore TF-IDF"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {STAGE_LABELS.map((s, i) => (
              <SegButton key={s} active={stage === s} onClick={() => setStage(s)}>
                {i > 0 ? `${i}. ` : ""}{STAGE_NAMES[s]}
              </SegButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DOC_LABELS.map((lbl, i) => (
              <SegButton key={i} active={docIdx === i} onClick={() => setDocIdx(i)}>
                <span style={{ color: DOC_COLORS[i] }}>{lbl}</span>
              </SegButton>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-background p-2.5 font-mono text-xs leading-relaxed">
            {stage === "raw" ? (
              <span className="text-foreground">{DOCS[docIdx]}</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {currentTokens.map((tok, i) => {
                  const isStop = tokenize(DOCS[docIdx]).includes(tok) && STOP_WORDS.has(tok);
                  const color = isStop && stage === "tokenized" ? "var(--muted-foreground)" : DOC_COLORS[docIdx];
                  return (
                    <span key={i} style={{ color, border: `1px solid ${color}40`, borderRadius: "4px", padding: "1px 5px" }}>
                      {tok}
                    </span>
                  );
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Token count: <span className="font-mono text-foreground">{stage === "raw" ? tokenize(DOCS[docIdx]).length : currentTokens.length}</span></span>
            {stage !== "raw" && <span>→ <span className="font-mono text-foreground">{currentTokens.length}</span> remain</span>}
            {stageIdx >= 2 && <span className="ml-auto text-muted-foreground">stop words removed: <span className="font-mono text-foreground">{tokenize(DOCS[docIdx]).length - (stage === "stopped" ? currentTokens.length : processDoc(DOCS[docIdx], "stopped").length)}</span></span>}
          </div>
        </div>
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">TF-IDF scores after full pipeline (top 10 terms)</span>
        <div className="flex gap-1.5">
          {DOC_LABELS.map((lbl, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span style={{ display:"inline-block", width:8, height:8, borderRadius:2, background: DOC_COLORS[i] }} />
              {lbl}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {range(5).map((i) => {
          const v = (maxTf * (5 - i)) / 5;
          const y = sy(v);
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border)" strokeWidth="0.5" />
              <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="var(--muted-foreground)">{v.toFixed(2)}</text>
            </g>
          );
        })}
        {vocab.map((term, vi) => (
          <g key={term}>
            {range(3).map((di) => {
              const val = tfidfMatrix[vi][di];
              const bw = singleBarW / 3;
              const bx = barX(vi) + di * bw;
              const bh = barH(val);
              const by = sy(val);
              const isActive = di === docIdx;
              return (
                <rect
                  key={di}
                  x={bx}
                  y={by}
                  width={bw - 1}
                  height={bh}
                  fill={DOC_COLORS[di]}
                  opacity={isActive ? 0.9 : 0.3}
                  rx={1}
                />
              );
            })}
            <text
              x={barX(vi) + singleBarW / 2}
              y={H - PAD_B + 10}
              textAnchor="middle"
              fontSize="8.5"
              fill={vocab[vi] === (stage !== "raw" ? currentTokens[0] : "") ? ACCENT : "var(--muted-foreground)"}
            >
              {term}
            </text>
          </g>
        ))}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--border)" />
      </svg>
    </VizFrame>
  );
}
