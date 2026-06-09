"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

type DataType = "continuous" | "categorical";
type Groups = "two" | "more" | "one";
type Paired = "yes" | "no";
type Normal = "yes" | "no";

interface TestResult {
  name: string;
  formula: string;
  use: string;
  color: string;
}

const TESTS: Record<string, TestResult> = {
  ttest_one: { name: "One-Sample t-test", formula: "t = (x̄ − μ₀) / (s/√n)", use: "Compare sample mean to known value", color: "var(--brand-violet)" },
  ttest_paired: { name: "Paired t-test", formula: "t = d̄ / (sᵈ/√n)", use: "Before/after on same subjects", color: "var(--brand-violet)" },
  ttest_two: { name: "Two-Sample t-test", formula: "t = (x̄₁−x̄₂) / SE", use: "Compare means of two independent groups", color: "var(--brand-violet)" },
  mann_whitney: { name: "Mann-Whitney U", formula: "U = n₁n₂ + n₁(n₁+1)/2 − R₁", use: "Two groups, non-normal — rank-based", color: "var(--brand-cyan)" },
  wilcoxon: { name: "Wilcoxon Signed-Rank", formula: "W = Σ sgn(xᵢ) · Rᵢ", use: "Paired, non-normal — rank-based", color: "var(--brand-cyan)" },
  anova: { name: "One-Way ANOVA", formula: "F = MS_between / MS_within", use: "Compare means across 3+ groups", color: "var(--brand-indigo)" },
  kruskal: { name: "Kruskal-Wallis", formula: "H = 12/(N(N+1)) · Σ Rᵢ²/nᵢ − 3(N+1)", use: "3+ groups, non-normal — rank-based", color: "var(--brand-cyan)" },
  chi_square: { name: "Chi-Square Test", formula: "χ² = Σ (O−E)²/E", use: "Association between categorical variables", color: "var(--brand-pink)" },
  fisher: { name: "Fisher's Exact", formula: "p = (a+b)!(c+d)!(a+c)!(b+d)! / (n! a! b! c! d!)", use: "2×2 table with small expected counts", color: "var(--brand-pink)" },
};

const W = 640, H = 320;

interface NodeBox { id: string; x: number; y: number; w: number; h: number; label: string; sub?: string; isQuestion: boolean; highlight?: boolean; testKey?: string; }
interface EdgeLine { x1: number; y1: number; x2: number; y2: number; label: string; active: boolean; }

export default function Viz() {
  const [dataType, setDataType] = useState<DataType | null>(null);
  const [groups, setGroups] = useState<Groups | null>(null);
  const [paired, setPaired] = useState<Paired | null>(null);
  const [normal, setNormal] = useState<Normal | null>(null);
  const [catSize, setCatSize] = useState<"small" | "normal" | null>(null);

  const reset = () => { setDataType(null); setGroups(null); setPaired(null); setNormal(null); setCatSize(null); };

  const result: TestResult | null = useMemo(() => {
    if (!dataType) return null;
    if (dataType === "categorical") {
      if (!catSize) return null;
      return catSize === "small" ? TESTS.fisher : TESTS.chi_square;
    }
    if (!groups) return null;
    if (groups === "one") return TESTS.ttest_one;
    if (groups === "more") {
      if (!normal) return null;
      return normal === "yes" ? TESTS.anova : TESTS.kruskal;
    }
    if (!paired) return null;
    if (!normal) return null;
    if (paired === "yes") return normal === "yes" ? TESTS.ttest_paired : TESTS.wilcoxon;
    return normal === "yes" ? TESTS.ttest_two : TESTS.mann_whitney;
  }, [dataType, groups, paired, normal, catSize]);

  const stepNum = useMemo(() => {
    if (!dataType) return 0;
    if (dataType === "categorical") return catSize ? 2 : 1;
    if (!groups) return 1;
    if (groups === "one") return 2;
    if (groups === "more") return normal ? 3 : 2;
    if (!paired) return 2;
    return normal ? 4 : 3;
  }, [dataType, groups, paired, normal, catSize]);

  const maxSteps = dataType === "categorical" ? 2 : (groups === "one" ? 2 : (groups === "more" ? 3 : 4));

  const nodes: NodeBox[] = [
    { id: "root", x: 270, y: 14, w: 100, h: 30, label: "Your Data", isQuestion: true, highlight: !dataType },
  ];
  const edges: EdgeLine[] = [];

  nodes.push({ id: "cont", x: 110, y: 80, w: 110, h: 28, label: "Continuous", sub: "measurements", isQuestion: false, highlight: dataType === "continuous" });
  nodes.push({ id: "cat", x: 420, y: 80, w: 110, h: 28, label: "Categorical", sub: "counts / labels", isQuestion: false, highlight: dataType === "categorical" });
  edges.push({ x1: 320, y1: 44, x2: 165, y2: 80, label: "numeric", active: dataType === "continuous" });
  edges.push({ x1: 320, y1: 44, x2: 475, y2: 80, label: "nominal", active: dataType === "categorical" });

  if (dataType === "continuous") {
    nodes.push({ id: "g1", x: 20, y: 148, w: 88, h: 28, label: "1 Group", isQuestion: false, highlight: groups === "one" });
    nodes.push({ id: "g2", x: 126, y: 148, w: 88, h: 28, label: "2 Groups", isQuestion: false, highlight: groups === "two" });
    nodes.push({ id: "gm", x: 56, y: 148, w: 88, h: 28, label: "3+ Groups", isQuestion: false, highlight: groups === "more" });
    edges.push({ x1: 165, y1: 108, x2: 64, y2: 148, label: "1", active: groups === "one" });
    edges.push({ x1: 165, y1: 108, x2: 170, y2: 148, label: "2", active: groups === "two" });
    edges.push({ x1: 165, y1: 108, x2: 100, y2: 148, label: "3+", active: groups === "more" });
  }

  if (dataType === "categorical") {
    nodes.push({ id: "csmall", x: 356, y: 148, w: 110, h: 28, label: "Small (<5 exp.)", isQuestion: false, highlight: catSize === "small" });
    nodes.push({ id: "cnorm", x: 480, y: 148, w: 110, h: 28, label: "Normal (≥5 exp.)", isQuestion: false, highlight: catSize === "normal" });
    edges.push({ x1: 475, y1: 108, x2: 411, y2: 148, label: "tiny cells", active: catSize === "small" });
    edges.push({ x1: 475, y1: 108, x2: 535, y2: 148, label: "large cells", active: catSize === "normal" });
  }

  return (
    <VizFrame
      title="Choosing a Statistical Test"
      hint="answer the questions to find your test"
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Q1 — What type of data?</p>
            <div className="flex gap-2 flex-wrap">
              <SegButton active={dataType === "continuous"} onClick={() => { setDataType("continuous"); setGroups(null); setPaired(null); setNormal(null); }}>Continuous (numeric)</SegButton>
              <SegButton active={dataType === "categorical"} onClick={() => { setDataType("categorical"); setGroups(null); setPaired(null); setNormal(null); setCatSize(null); }}>Categorical (counts)</SegButton>
            </div>
          </div>

          {dataType === "continuous" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Q2 — How many groups?</p>
              <div className="flex gap-2 flex-wrap">
                <SegButton active={groups === "one"} onClick={() => { setGroups("one"); setPaired(null); setNormal(null); }}>1 group vs. known value</SegButton>
                <SegButton active={groups === "two"} onClick={() => { setGroups("two"); setNormal(null); }}>2 groups</SegButton>
                <SegButton active={groups === "more"} onClick={() => { setGroups("more"); setPaired(null); setNormal(null); }}>3 or more groups</SegButton>
              </div>
            </div>
          )}

          {dataType === "continuous" && groups === "two" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Q3 — Are observations paired?</p>
              <div className="flex gap-2">
                <SegButton active={paired === "yes"} onClick={() => { setPaired("yes"); setNormal(null); }}>Paired (same subjects)</SegButton>
                <SegButton active={paired === "no"} onClick={() => { setPaired("no"); setNormal(null); }}>Independent</SegButton>
              </div>
            </div>
          )}

          {dataType === "continuous" && (groups === "one" || groups === "more" || (groups === "two" && paired !== null)) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{groups === "two" && paired !== null ? "Q4" : "Q3"} — Is the data roughly normal?</p>
              <div className="flex gap-2">
                <SegButton active={normal === "yes"} onClick={() => setNormal("yes")}>Yes (or n &gt; 30)</SegButton>
                <SegButton active={normal === "no"} onClick={() => setNormal("no")}>No / Skewed / Small n</SegButton>
              </div>
            </div>
          )}

          {dataType === "categorical" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Q2 — Expected cell counts?</p>
              <div className="flex gap-2">
                <SegButton active={catSize === "normal"} onClick={() => setCatSize("normal")}>All cells ≥ 5</SegButton>
                <SegButton active={catSize === "small"} onClick={() => setCatSize("small")}>Any cell &lt; 5</SegButton>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border-2 p-3" style={{ borderColor: result.color, background: `color-mix(in srgb, ${result.color} 8%, var(--card))` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: result.color }}>{result.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{result.formula}</p>
                  <p className="mt-1 text-xs text-foreground/80">{result.use}</p>
                </div>
                <div className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: result.color, color: "var(--background)" }}>
                  {stepNum}/{maxSteps} ✓
                </div>
              </div>
            </div>
          )}

          <VizButton onClick={reset}><RotateCcw size={12} /> Reset</VizButton>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Edges */}
        {edges.map((e, i) => (
          <g key={i}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={e.active ? "var(--brand-violet)" : "var(--border)"}
              strokeWidth={e.active ? 2.5 : 1.5}
              strokeDasharray={e.active ? undefined : "4 3"}
              opacity={e.active ? 1 : 0.5}
            />
            <text x={(e.x1 + e.x2) / 2 + 4} y={(e.y1 + e.y2) / 2 - 4}
              textAnchor="middle" fontSize="9"
              fill={e.active ? "var(--brand-violet)" : "var(--muted-foreground)"}
              fontWeight={e.active ? "700" : "400"}
            >{e.label}</text>
          </g>
        ))}

        {/* Root node */}
        <rect x={nodes[0].x} y={nodes[0].y} width={nodes[0].w} height={nodes[0].h} rx="8"
          fill={nodes[0].highlight ? "var(--brand-violet)" : "var(--card)"}
          stroke={nodes[0].highlight ? "var(--brand-violet)" : "var(--border)"}
          strokeWidth={nodes[0].highlight ? 2.5 : 1.5}
        />
        <text x={nodes[0].x + nodes[0].w / 2} y={nodes[0].y + 19} textAnchor="middle" fontSize="11"
          fill={nodes[0].highlight ? "var(--background)" : "var(--foreground)"} fontWeight="600"
        >{nodes[0].label}</text>

        {/* Data type nodes */}
        {nodes.slice(1).map((n) => {
          const isResult = !!n.testKey;
          const tc = isResult ? (TESTS[n.testKey!]?.color ?? "var(--border)") : (n.highlight ? "var(--brand-violet)" : "var(--border)");
          return (
            <g key={n.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="7"
                fill={n.highlight ? (isResult ? `color-mix(in srgb, ${tc} 15%, var(--card))` : "var(--brand-violet)") : "var(--card)"}
                stroke={n.highlight ? tc : "var(--border)"}
                strokeWidth={n.highlight ? 2 : 1.5}
                opacity={!dataType && !n.highlight ? 0.5 : 1}
              />
              <text x={n.x + n.w / 2} y={n.y + (n.sub ? 12 : 17)} textAnchor="middle" fontSize="10"
                fill={n.highlight ? (isResult ? tc : "var(--background)") : "var(--foreground)"} fontWeight={n.highlight ? "600" : "500"}
              >{n.label}</text>
              {n.sub && <text x={n.x + n.w / 2} y={n.y + 23} textAnchor="middle" fontSize="8.5" fill="var(--muted-foreground)">{n.sub}</text>}
            </g>
          );
        })}

        {/* Decision path summary at bottom */}
        {result && (
          <g>
            <rect x={140} y={H - 60} width={360} height={50} rx="10"
              fill={`color-mix(in srgb, ${result.color} 10%, var(--card))`}
              stroke={result.color} strokeWidth="2"
            />
            <text x={320} y={H - 42} textAnchor="middle" fontSize="12" fontWeight="700" fill={result.color}>{result.name}</text>
            <text x={320} y={H - 26} textAnchor="middle" fontSize="9.5" fill="var(--muted-foreground)">{result.use}</text>
            <text x={320} y={H - 13} textAnchor="middle" fontFamily="monospace" fontSize="9" fill="var(--foreground)" opacity="0.7">{result.formula}</text>
          </g>
        )}

        {!dataType && (
          <text x={W / 2} y={H - 20} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" opacity="0.7">
            Start by selecting your data type above ↓
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
