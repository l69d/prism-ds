"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, normalCdf } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range } from "@/lib/utils";

const W = 620, H = 300, PAD = 40;
const N_EACH = 280;

type FairnessMode = "none" | "demo" | "eqodds";

function buildGroup(seed: number, meanScore: number, truePositiveRate: number) {
  const rand = rng(seed);
  return range(N_EACH).map(() => {
    const positive = rand() < truePositiveRate;
    const score = positive
      ? gaussian(rand, meanScore + 0.18, 0.22)
      : gaussian(rand, meanScore - 0.18, 0.22);
    return { score: Math.max(0, Math.min(1, score)), positive };
  });
}

type Person = { score: number; positive: boolean };

function computeMetrics(group: Person[], threshold: number) {
  const approved = group.filter((p) => p.score >= threshold);
  const approvalRate = approved.length / group.length;
  const tp = approved.filter((p) => p.positive).length;
  const fn = group.filter((p) => p.positive && p.score < threshold).length;
  const fp = approved.filter((p) => !p.positive).length;
  const tn = group.filter((p) => !p.positive && p.score < threshold).length;
  const tpr = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
  return { approvalRate, tpr, fpr };
}

export default function Viz() {
  const [seed, setSeed] = useState(42);
  const [thresholdA, setThresholdA] = useState(0.5);
  const [thresholdB, setThresholdB] = useState(0.5);
  const [mode, setMode] = useState<FairnessMode>("none");
  const [baseDiff, setBaseDiff] = useState(0.12);

  const { groupA, groupB } = useMemo(() => {
    return {
      groupA: buildGroup(seed * 3 + 1, 0.55, 0.45),
      groupB: buildGroup(seed * 7 + 2, 0.55 - baseDiff, 0.45),
    };
  }, [seed, baseDiff]);

  const metricsA = useMemo(() => computeMetrics(groupA, thresholdA), [groupA, thresholdA]);
  const metricsB = useMemo(() => computeMetrics(groupB, thresholdB), [groupB, thresholdB]);

  const demoParity = Math.abs(metricsA.approvalRate - metricsB.approvalRate);
  const eqOddsTpr = Math.abs(metricsA.tpr - metricsB.tpr);
  const eqOddsFpr = Math.abs(metricsA.fpr - metricsB.fpr);

  function applyFairnessMode(m: FairnessMode) {
    setMode(m);
    if (m === "none") {
      setThresholdA(0.5);
      setThresholdB(0.5);
    } else if (m === "demo") {
      // lower threshold B until approval rates match
      const targetRate = metricsA.approvalRate;
      const sorted = [...groupB].map((p) => p.score).sort((a, b) => a - b);
      const approvedNeed = Math.round(targetRate * sorted.length);
      const idx = sorted.length - approvedNeed;
      const newT = idx >= 0 && idx < sorted.length ? sorted[idx] : 0.5;
      setThresholdA(0.5);
      setThresholdB(Math.max(0.05, Math.min(0.95, newT)));
    } else if (m === "eqodds") {
      // find threshold for B that matches TPR of A at threshold 0.5
      const targetTpr = metricsA.tpr;
      const positives = groupB.filter((p) => p.positive).map((p) => p.score).sort((a, b) => a - b);
      const need = Math.round(targetTpr * positives.length);
      const idx = positives.length - need;
      const newT = idx >= 0 && idx < positives.length ? positives[idx] : 0.5;
      setThresholdA(0.5);
      setThresholdB(Math.max(0.05, Math.min(0.95, newT)));
    }
  }

  // SVG score distribution curves (kernel density style via summed Gaussians sampled)
  const xs = linspace(0, 1, 120);
  const kde = (pts: number[], x: number) => pts.reduce((s, p) => s + normalCdf((x - p + 0.015) / 0.04) - normalCdf((x - p - 0.015) / 0.04), 0) / pts.length / 0.03;

  const scoresA_pos = groupA.filter((p) => p.positive).map((p) => p.score);
  const scoresA_neg = groupA.filter((p) => !p.positive).map((p) => p.score);
  const scoresB_pos = groupB.filter((p) => p.positive).map((p) => p.score);
  const scoresB_neg = groupB.filter((p) => !p.positive).map((p) => p.score);

  const densityA = xs.map((x) => kde(scoresA_pos, x) * 0.45 + kde(scoresA_neg, x) * 0.55);
  const densityB = xs.map((x) => kde(scoresB_pos, x) * 0.45 + kde(scoresB_neg, x) * 0.55);
  const yMax = Math.max(...densityA, ...densityB) * 1.1 || 1;

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const syA = (v: number) => H / 2 - 8 - (v / yMax) * (H / 2 - PAD - 8);
  const syB = (v: number) => H / 2 + 8 + (v / yMax) * (H / 2 - PAD - 8);

  const pathOf = (ys: number[], sy: (v: number) => number) =>
    "M" + xs.map((x, i) => `${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(" L");

  const badgeColor = (v: number) =>
    v < 0.03 ? "var(--success)" : v < 0.08 ? "var(--warning)" : "var(--danger)";

  return (
    <VizFrame
      title="Fairness Trade-off Simulator"
      hint="adjust thresholds — watch metrics conflict"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Group A threshold" min={0.1} max={0.9} step={0.01} value={thresholdA} onChange={(v) => { setMode("none"); setThresholdA(v); }} format={(v) => v.toFixed(2)} />
            <Slider label="Group B threshold" min={0.1} max={0.9} step={0.01} value={thresholdB} onChange={(v) => { setMode("none"); setThresholdB(v); }} format={(v) => v.toFixed(2)} />
          </ControlGroup>
          <Slider label="Score gap between groups" min={0} max={0.3} step={0.01} value={baseDiff} onChange={(v) => { setBaseDiff(v); setSeed((s) => s); }} format={(v) => v.toFixed(2)} />
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span>Demographic parity gap <span className="font-mono font-semibold" style={{ color: badgeColor(demoParity) }}>{(demoParity * 100).toFixed(1)} pp</span></span>
            <span>Eq. odds TPR gap <span className="font-mono font-semibold" style={{ color: badgeColor(eqOddsTpr) }}>{(eqOddsTpr * 100).toFixed(1)} pp</span></span>
            <span>FPR gap <span className="font-mono font-semibold" style={{ color: badgeColor(eqOddsFpr) }}>{(eqOddsFpr * 100).toFixed(1)} pp</span></span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Auto-correct for:</span>
        <SegButton active={mode === "none"} onClick={() => applyFairnessMode("none")}>None</SegButton>
        <SegButton active={mode === "demo"} onClick={() => applyFairnessMode("demo")}>Demographic Parity</SegButton>
        <SegButton active={mode === "eqodds"} onClick={() => applyFairnessMode("eqodds")}>Equalized Odds</SegButton>
        <VizButton onClick={() => { setSeed((s) => s + 1); setMode("none"); setThresholdA(0.5); setThresholdB(0.5); }} className="ml-auto"><RotateCcw size={12} /> Resample</VizButton>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Labels */}
        <text x={8} y={H / 4} textAnchor="start" dominantBaseline="middle" fontSize={11} fill="var(--brand-indigo)" fontWeight="600">Group A</text>
        <text x={8} y={(3 * H) / 4} textAnchor="start" dominantBaseline="middle" fontSize={11} fill="var(--brand-cyan)" fontWeight="600">Group B</text>

        {/* Divider */}
        <line x1={PAD - 10} y1={H / 2} x2={W - PAD + 10} y2={H / 2} stroke="var(--border)" strokeDasharray="3 3" />

        {/* Approval rate bars (background fill area right of threshold) */}
        <rect x={sx(thresholdA)} y={12} width={sx(1) - sx(thresholdA)} height={H / 2 - 20} fill="var(--brand-indigo)" opacity={0.08} />
        <rect x={sx(thresholdB)} y={H / 2 + 8} width={sx(1) - sx(thresholdB)} height={H / 2 - 20} fill="var(--brand-cyan)" opacity={0.08} />

        {/* KDE curves */}
        <path d={pathOf(densityA, syA)} fill="none" stroke="var(--brand-indigo)" strokeWidth={2} />
        <path d={pathOf(densityB, syB)} fill="none" stroke="var(--brand-cyan)" strokeWidth={2} />

        {/* Threshold lines */}
        <line x1={sx(thresholdA)} y1={10} x2={sx(thresholdA)} y2={H / 2 - 8} stroke="var(--brand-indigo)" strokeWidth={2} strokeDasharray="4 3" />
        <line x1={sx(thresholdB)} y1={H / 2 + 8} x2={sx(thresholdB)} y2={H - 10} stroke="var(--brand-cyan)" strokeWidth={2} strokeDasharray="4 3" />

        {/* Threshold handles */}
        <circle cx={sx(thresholdA)} cy={10} r={5} fill="var(--brand-indigo)" />
        <circle cx={sx(thresholdB)} cy={H - 10} r={5} fill="var(--brand-cyan)" />

        {/* Approval rate readouts */}
        <text x={sx(thresholdA) + 6} y={30} fontSize={11} fill="var(--brand-indigo)">Approved: {(metricsA.approvalRate * 100).toFixed(1)}%</text>
        <text x={sx(thresholdB) + 6} y={H / 2 + 26} fontSize={11} fill="var(--brand-cyan)">Approved: {(metricsB.approvalRate * 100).toFixed(1)}%</text>

        {/* X axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={H / 2 - 3} x2={sx(v)} y2={H / 2 + 3} stroke="var(--border)" />
            <text x={sx(v)} y={H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">model score →</text>
      </svg>

      {/* Fairness impossibility hint */}
      {mode !== "none" && demoParity > 0.02 && eqOddsTpr > 0.02 && (
        <p className="mt-2 rounded-lg border border-border bg-card-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Impossibility theorem:</span>{" "}
          {mode === "demo"
            ? "Demographic parity is satisfied, but equalized odds (TPR gap) is still "
            : "Equalized odds is improved, but demographic parity gap is still "}
          <span className="font-mono" style={{ color: badgeColor(mode === "demo" ? eqOddsTpr : demoParity) }}>
            {((mode === "demo" ? eqOddsTpr : demoParity) * 100).toFixed(1)} pp
          </span>{" "}— you can't satisfy both simultaneously when base rates differ.
        </p>
      )}
    </VizFrame>
  );
}
