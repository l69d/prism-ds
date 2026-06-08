"use client";

import { useState } from "react";
import { VizFrame } from "./viz-frame";
import { Slider } from "./controls";

const W = 360, H = 300;

export function BayesGridViz() {
  const [prev, setPrev] = useState(0.01);
  const [sens, setSens] = useState(0.95);
  const [spec, setSpec] = useState(0.9);

  const tp = prev * sens;
  const fn = prev * (1 - sens);
  const fp = (1 - prev) * (1 - spec);
  const tn = (1 - prev) * spec;
  const pPos = tp + fp;
  const posterior = pPos > 0 ? tp / pPos : 0;

  const split = prev * W; // diseased column width

  return (
    <VizFrame
      title="Bayes & the Base Rate"
      hint="lower the prevalence"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider label="Prevalence (base rate)" min={0.001} max={0.5} step={0.001} value={prev} onChange={setPrev} format={(v) => (v * 100).toFixed(1) + "%"} />
            <Slider label="Sensitivity (true +)" min={0.5} max={0.999} step={0.001} value={sens} onChange={setSens} format={(v) => (v * 100).toFixed(1) + "%"} />
            <Slider label="Specificity (true −)" min={0.5} max={0.999} step={0.001} value={spec} onChange={setSpec} format={(v) => (v * 100).toFixed(1) + "%"} />
          </div>
          <div className="rounded-xl border border-brand-violet/30 bg-brand-violet/8 p-3 text-sm">
            If the test is positive, the chance you actually have it is{" "}
            <span className="font-mono text-lg font-bold text-brand-violet">{(posterior * 100).toFixed(1)}%</span>
            <span className="text-muted-foreground"> — P(disease | positive)</span>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[360px_1fr] sm:items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[360px]">
          {/* diseased column: TP (top) + FN (bottom) */}
          <rect x={0} y={0} width={split} height={sens * H} fill="var(--brand-violet)" opacity="0.9" />
          <rect x={0} y={sens * H} width={split} height={(1 - sens) * H} fill="var(--brand-violet)" opacity="0.25" />
          {/* healthy column: FP (top) + TN (bottom) */}
          <rect x={split} y={0} width={W - split} height={(1 - spec) * H} fill="var(--brand-pink)" opacity="0.85" />
          <rect x={split} y={(1 - spec) * H} width={W - split} height={spec * H} fill="var(--muted)" opacity="0.6" />
          {/* labels */}
          {split > 34 && <text x={split / 2} y={Math.min(sens * H / 2, H - 6)} textAnchor="middle" className="fill-white text-[10px] font-semibold">TP</text>}
          {(W - split) > 30 && (1 - spec) * H > 12 && <text x={split + (W - split) / 2} y={Math.max(10, (1 - spec) * H / 2)} textAnchor="middle" className="fill-white text-[10px] font-semibold">FP</text>}
          <line x1={split} y1={0} x2={split} y2={H} stroke="var(--background)" strokeWidth="2" />
        </svg>
        <div className="space-y-2 text-xs">
          <Row c="var(--brand-violet)" label="True positives (sick, test +)" v={tp} />
          <Row c="var(--brand-pink)" label="False positives (well, test +)" v={fp} />
          <Row c="var(--brand-violet)" faint label="False negatives (sick, test −)" v={fn} />
          <Row c="var(--muted-foreground)" label="True negatives (well, test −)" v={tn} />
          <div className="border-t border-border/60 pt-2 text-muted-foreground">
            Of everyone who tests positive ({(pPos * 100).toFixed(1)}% of people), only the violet slice is truly sick.
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

function Row({ c, label, v, faint }: { c: string; label: string; v: number; faint?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded" style={{ background: c, opacity: faint ? 0.3 : 0.9 }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono text-foreground">{(v * 100).toFixed(2)}%</span>
    </div>
  );
}
