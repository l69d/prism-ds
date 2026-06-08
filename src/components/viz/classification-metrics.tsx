"use client";

import { useMemo, useState } from "react";
import { linspace, normalCdf, normalPdf } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider } from "./controls";

const W = 380, H = 220, PAD = { l: 12, r: 12, t: 12, b: 24 };
const nPos = 500, nNeg = 500;

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card-muted/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold" style={{ color: tone }}>{value.toFixed(3)}</div>
    </div>
  );
}

function Cell({ label, value, good }: { label: string; value: number; good: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border p-3 ${good ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10"}`}>
      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold text-foreground">{Math.round(value)}</span>
    </div>
  );
}

export function ClassificationMetricsExplorer() {
  const [thr, setThr] = useState(0);
  const [sep, setSep] = useState(2.2);

  const muN = -sep / 2, muP = sep / 2, s = 1;

  const tpr = 1 - normalCdf(thr, muP, s);
  const fpr = 1 - normalCdf(thr, muN, s);
  const TP = tpr * nPos, FN = nPos - TP, FP = fpr * nNeg, TN = nNeg - FP;
  const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
  const recall = tpr;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (TP + TN) / (nPos + nNeg);
  const specificity = 1 - fpr;

  const roc = useMemo(() => {
    const ts = linspace(muP + 4, muN - 4, 80);
    return ts.map((t) => ({ x: 1 - normalCdf(t, muN, s), y: 1 - normalCdf(t, muP, s) }));
  }, [muN, muP]);

  const auc = useMemo(() => {
    let a = 0;
    for (let i = 1; i < roc.length; i++) a += (roc[i].x - roc[i - 1].x) * (roc[i].y + roc[i - 1].y) / 2;
    return a;
  }, [roc]);

  const xMin = -5, xMax = 5;
  const peak = normalPdf(0, 0, s);
  const sx = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / (peak * 1.1)) * (H - PAD.t - PAD.b);
  const curve = (mu: number) =>
    "M" + linspace(xMin, xMax, 100).map((x) => `${sx(x).toFixed(1)},${sy(normalPdf(x, mu, s)).toFixed(1)}`).join(" L");

  const RW = 220, RP = 28;
  const rx = (v: number) => RP + v * (RW - RP - 10);
  const ry = (v: number) => RW - RP - v * (RW - RP - 10);

  return (
    <VizFrame
      title="Classification Metrics & Threshold"
      hint="move the threshold"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Decision threshold" min={-5} max={5} step={0.05} value={thr} onChange={setThr} format={(v) => v.toFixed(2)} />
            <Slider label="Class separation (signal)" min={0.4} max={4} step={0.05} value={sep} onChange={setSep} format={(v) => v.toFixed(2)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Precision" value={precision} tone="var(--brand-violet)" />
            <Metric label="Recall (TPR)" value={recall} tone="var(--brand-cyan)" />
            <Metric label="F1" value={f1} tone="var(--brand-pink)" />
            <Metric label="Accuracy" value={accuracy} tone="var(--success)" />
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Score distributions</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <path d={curve(muN) + ` L${sx(xMax)},${sy(0)} L${sx(xMin)},${sy(0)} Z`} fill="var(--brand-cyan)" opacity="0.18" />
            <path d={curve(muP) + ` L${sx(xMax)},${sy(0)} L${sx(xMin)},${sy(0)} Z`} fill="var(--brand-pink)" opacity="0.18" />
            <path d={curve(muN)} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" />
            <path d={curve(muP)} fill="none" stroke="var(--brand-pink)" strokeWidth="2" />
            <line x1={sx(thr)} y1={PAD.t} x2={sx(thr)} y2={H - PAD.b} stroke="var(--brand-violet)" strokeWidth="2" />
            <text x={sx(thr)} y={PAD.t + 2} textAnchor="middle" className="fill-[var(--brand-violet)] text-[9px]">threshold</text>
            <text x={sx(muN)} y={H - 6} textAnchor="middle" className="fill-[var(--brand-cyan)] text-[10px]">negatives</text>
            <text x={sx(muP)} y={H - 6} textAnchor="middle" className="fill-[var(--brand-pink)] text-[10px]">positives</text>
          </svg>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Cell label="True Pos" value={TP} good />
            <Cell label="False Pos" value={FP} good={false} />
            <Cell label="False Neg" value={FN} good={false} />
            <Cell label="True Neg" value={TN} good />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>ROC curve</span>
            <span>AUC = <span className="font-mono text-foreground">{auc.toFixed(3)}</span></span>
          </div>
          <svg viewBox={`0 0 ${RW} ${RW}`} className="mx-auto w-full max-w-[260px]">
            <line x1={RP} y1={RW - RP} x2={RW - 10} y2={RW - RP} stroke="var(--border)" />
            <line x1={RP} y1={10} x2={RP} y2={RW - RP} stroke="var(--border)" />
            <line x1={rx(0)} y1={ry(0)} x2={rx(1)} y2={ry(1)} stroke="var(--muted-foreground)" strokeDasharray="4 4" opacity="0.5" />
            <path d={"M" + roc.map((p) => `${rx(p.x).toFixed(1)},${ry(p.y).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
            <circle cx={rx(fpr)} cy={ry(tpr)} r={5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.5" />
            <text x={(RW + RP) / 2} y={RW - 4} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">False Positive Rate</text>
          </svg>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>Specificity <span className="font-mono text-foreground">{specificity.toFixed(3)}</span></span>
            <span>FPR <span className="font-mono text-foreground">{fpr.toFixed(3)}</span></span>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
