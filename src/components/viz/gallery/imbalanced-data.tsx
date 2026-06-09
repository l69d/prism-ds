"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, normalCdf } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { clamp } from "@/lib/utils";

const W = 620, H = 300, PAD = 32;

type Strategy = "none" | "weights" | "oversample";

function metricColor(v: number): string {
  if (v >= 0.75) return "var(--success)";
  if (v >= 0.4) return "var(--warning)";
  return "var(--danger)";
}

function MetricBox({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className="font-mono text-lg font-semibold"
        style={{ color: bold ? "var(--brand-violet)" : metricColor(value) }}
      >
        {value.toFixed(2)}
      </div>
    </div>
  );
}

export default function Viz() {
  const [imbalanceRatio, setImbalanceRatio] = useState(50); // negatives per 1 positive
  const [threshold, setThreshold] = useState(0.5);
  const [strategy, setStrategy] = useState<Strategy>("none");

  const { TP, FP, FN, TN, accuracy, precision, recall, f1 } = useMemo(() => {
    const nPos = 100;
    const nNeg = imbalanceRatio * nPos;
    const total = nPos + nNeg;

    // Simulate a classifier trained on imbalanced data
    // "none" strategy: biased toward predicting negative
    // "weights" strategy: model compensates, shifts decision boundary
    // "oversample": effectively balances classes, similar to weights but stronger

    let posShift = 0;  // how much the model is shifted toward detecting positives
    if (strategy === "weights") posShift = 0.15;
    if (strategy === "oversample") posShift = 0.25;

    // Positive class scores: N(0.65 + posShift, 0.18)
    // Negative class scores: N(0.35 - posShift * 0.5, 0.15)
    const muPos = 0.65 + posShift;
    const muNeg = 0.35 - posShift * 0.5;
    const sdPos = 0.18, sdNeg = 0.15;

    const tpr = clamp(1 - normalCdf(threshold, muPos, sdPos), 0, 1);
    const fpr = clamp(1 - normalCdf(threshold, muNeg, sdNeg), 0, 1);

    const TP = tpr * nPos;
    const FN = nPos - TP;
    const FP = fpr * nNeg;
    const TN = nNeg - FP;

    const accuracy = (TP + TN) / total;
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = tpr;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { TP, FP, FN, TN, accuracy, precision, recall, f1 };
  }, [imbalanceRatio, threshold, strategy]);

  // "Naive all-negative" baseline accuracy
  const naiveAcc = useMemo(() => {
    const nPos = 100, nNeg = imbalanceRatio * 100;
    return nNeg / (nPos + nNeg);
  }, [imbalanceRatio]);

  // Dot layout: sample of dots colored by class + prediction
  const dots = useMemo(() => {
    const rand = rng(99);
    const result: { x: number; y: number; type: "TP" | "FP" | "FN" | "TN" }[] = [];
    const nPos = 100, nNeg = imbalanceRatio * 100;
    const total = nPos + nNeg;
    const sampleSize = Math.min(total, 300);
    const samplePos = Math.round(sampleSize * (nPos / total));
    const sampleNeg = sampleSize - samplePos;

    const tpr = clamp(1 - normalCdf(threshold, 0.65 + (strategy === "oversample" ? 0.25 : strategy === "weights" ? 0.15 : 0), 0.18), 0, 1);
    const fpr = clamp(1 - normalCdf(threshold, 0.35 - (strategy === "oversample" ? 0.125 : strategy === "weights" ? 0.075 : 0), 0.15), 0, 1);

    for (let i = 0; i < samplePos; i++) {
      const predicted = rand() < tpr;
      result.push({ x: gaussian(rand, 0.25, 0.09), y: gaussian(rand, 0.5, 0.18), type: predicted ? "TP" : "FN" });
    }
    for (let i = 0; i < sampleNeg; i++) {
      const predicted = rand() < fpr;
      result.push({ x: gaussian(rand, 0.75, 0.13), y: gaussian(rand, 0.5, 0.2), type: predicted ? "FP" : "TN" });
    }
    return result;
  }, [imbalanceRatio, threshold, strategy]);

  const dotColor: Record<string, string> = {
    TP: "var(--success)", FN: "var(--warning)", FP: "var(--danger)", TN: "var(--muted-foreground)"
  };

  // Confusion matrix cell layout
  const cmTotal = TP + FP + FN + TN;
  const cells = [
    { label: "TP", value: TP, color: "var(--success)" },
    { label: "FP", value: FP, color: "var(--danger)" },
    { label: "FN", value: FN, color: "var(--warning)" },
    { label: "TN", value: TN, color: "var(--muted-foreground)" },
  ];

  return (
    <VizFrame
      title="Imbalanced Classes"
      hint="crank up the imbalance ratio and watch accuracy lie"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="Imbalance ratio (neg : pos)"
              min={1} max={99} step={1}
              value={imbalanceRatio}
              onChange={setImbalanceRatio}
              format={(v) => `${v}:1`}
            />
            <Slider
              label="Decision threshold"
              min={0.05} max={0.95} step={0.01}
              value={threshold}
              onChange={setThreshold}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>

          <div className="flex flex-wrap gap-1.5">
            <SegButton active={strategy === "none"} onClick={() => setStrategy("none")}>No fix</SegButton>
            <SegButton active={strategy === "weights"} onClick={() => setStrategy("weights")}>Class weights</SegButton>
            <SegButton active={strategy === "oversample"} onClick={() => setStrategy("oversample")}>Oversample</SegButton>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricBox label="Accuracy" value={accuracy} bold />
            <MetricBox label="Precision" value={precision} />
            <MetricBox label="Recall" value={recall} />
            <MetricBox label="F1" value={f1} />
          </div>

          <div className="rounded-lg border border-warning/40 bg-warning/8 px-3 py-2 text-xs text-muted-foreground">
            "Predict all negative" gives accuracy{" "}
            <span className="font-mono font-semibold text-warning">{(naiveAcc * 100).toFixed(1)}%</span>
            {" "}— high accuracy but zero recall.
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">
            Sample predictions (positives left · negatives right)
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1={W / 2} y1={PAD} x2={W / 2} y2={H - PAD} stroke="var(--border)" strokeDasharray="5 4" />
            <text x={W / 4} y={PAD - 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">Actual positive</text>
            <text x={(3 * W) / 4} y={PAD - 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">Actual negative</text>
            {dots.map((d, i) => {
              const cx = clamp(PAD + d.x * (W / 2 - PAD * 2) + (d.type === "TN" || d.type === "FP" ? W / 2 : 0), PAD, W - PAD);
              const cy = clamp(PAD + d.y * (H - PAD * 2), PAD, H - PAD);
              return (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={d.type === "FN" || d.type === "FP" ? 3.5 : 2.5}
                  fill={dotColor[d.type]}
                  opacity={d.type === "TN" ? 0.35 : 0.75}
                />
              );
            })}
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-medium text-muted-foreground">Confusion matrix</div>
          <div className="grid grid-cols-2 gap-1.5 w-[160px]">
            {cells.map((c) => (
              <div
                key={c.label}
                className="flex flex-col items-center justify-center rounded-lg border border-border p-2"
                style={{ borderColor: c.color + "55", background: c.color + "11" }}
              >
                <span className="text-[10px] font-medium" style={{ color: c.color }}>{c.label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">{Math.round(c.value)}</span>
                <span className="text-[9px] text-muted-foreground">{cmTotal > 0 ? ((c.value / cmTotal) * 100).toFixed(1) : "0.0"}%</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-success" />TP detected</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-warning" />FN missed</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-danger" />FP false alarm</span>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
