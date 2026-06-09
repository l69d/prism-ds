"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw, SkipForward } from "lucide-react";

const W = 640, H = 300, PAD = 36;

// Fit a depth-limited regression tree (greedy best-split) and return a predict fn
function fitStump(
  xs: number[],
  ys: number[],
  maxDepth: number
): (x: number) => number {
  type Node = { lo: number; hi: number; val: number; split?: number; left?: Node; right?: Node };

  function build(idxs: number[], depth: number, lo: number, hi: number): Node {
    const vals = idxs.map((i) => ys[i]);
    const val = mean(vals);
    if (depth === 0 || idxs.length < 3) return { lo, hi, val };
    let bestLoss = Infinity, bestSplit = -1;
    const xvals = idxs.map((i) => xs[i]);
    const sorted = [...new Set(xvals)].sort((a, b) => a - b);
    for (let s = 0; s < sorted.length - 1; s++) {
      const split = (sorted[s] + sorted[s + 1]) / 2;
      const left = idxs.filter((i) => xs[i] <= split).map((i) => ys[i]);
      const right = idxs.filter((i) => xs[i] > split).map((i) => ys[i]);
      if (!left.length || !right.length) continue;
      const ml = mean(left), mr = mean(right);
      const loss = left.reduce((a, v) => a + (v - ml) ** 2, 0) + right.reduce((a, v) => a + (v - mr) ** 2, 0);
      if (loss < bestLoss) { bestLoss = loss; bestSplit = split; }
    }
    if (bestSplit < 0) return { lo, hi, val };
    const leftIdxs = idxs.filter((i) => xs[i] <= bestSplit);
    const rightIdxs = idxs.filter((i) => xs[i] > bestSplit);
    return {
      lo, hi, val,
      split: bestSplit,
      left: build(leftIdxs, depth - 1, lo, bestSplit),
      right: build(rightIdxs, depth - 1, bestSplit, hi),
    };
  }

  const root = build(range(xs.length), maxDepth, Math.min(...xs), Math.max(...xs));

  function predict(node: Node, x: number): number {
    if (node.split === undefined || !node.left || !node.right) return node.val;
    return x <= node.split ? predict(node.left, x) : predict(node.right, x);
  }

  return (x: number) => predict(root, x);
}

const TRUE_F = (x: number) => Math.sin(x * Math.PI) * 0.8 + 0.1 * x;

export default function Viz() {
  const [learningRate, setLearningRate] = useState(0.3);
  const [treeDepth, setTreeDepth] = useState(2);
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"fit" | "residuals">("fit");

  const { xs, ys } = useMemo(() => {
    const r = rng(42);
    const xs = linspace(-1.5, 1.5, 20);
    const ys = xs.map((x) => TRUE_F(x) + gaussian(r, 0, 0.15));
    return { xs, ys };
  }, []);

  // Build boosting state up to `step` trees
  const { preds, residuals, mse, treeCurves } = useMemo(() => {
    const N = xs.length;
    const baseline = mean(ys);
    let current = new Array<number>(N).fill(baseline);
    const treeCurves: Array<(x: number) => number> = [];

    for (let t = 0; t < step; t++) {
      const res = current.map((p, i) => ys[i] - p);
      const stump = fitStump(xs, res, treeDepth);
      treeCurves.push(stump);
      current = current.map((p, i) => p + learningRate * stump(xs[i]));
    }

    const residuals = current.map((p, i) => ys[i] - p);
    const mse = mean(residuals.map((r) => r * r));
    return { preds: current, residuals, mse, treeCurves };
  }, [xs, ys, step, learningRate, treeDepth]);

  const maxStep = 12;
  const xMin = -1.7, xMax = 1.7, yMin = -1.4, yMax = 1.4;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const ensemblePath = "M" + linspace(xMin, xMax, 160).map((x) => {
    let y = mean(ys);
    treeCurves.forEach((f) => { y += learningRate * f(x); });
    return `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
  }).join(" L");

  const lastResidualPath = step > 0 ? "M" + linspace(xMin, xMax, 160).map((x) => {
    const f = treeCurves[treeCurves.length - 1];
    return `${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`;
  }).join(" L") : null;

  const truePath = "M" + linspace(xMin, xMax, 160).map((x) =>
    `${sx(x).toFixed(1)},${sy(TRUE_F(x)).toFixed(1)}`
  ).join(" L");

  const baseline = mean(ys);
  const totalMse0 = mean(ys.map((y) => (y - baseline) ** 2));
  const pctImproved = totalMse0 > 0 ? Math.max(0, (1 - mse / totalMse0) * 100) : 0;

  return (
    <VizFrame
      title="Gradient Boosting"
      hint="step through iterations to see residuals shrink"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setStep((s) => Math.min(s + 1, maxStep))}>
              <SkipForward size={13} /> Add tree
            </VizButton>
            <VizButton onClick={() => { setStep(0); }}>
              <RotateCcw size={13} /> Reset
            </VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              trees: <span className="font-mono text-foreground">{step}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>MSE: <span className="font-mono text-foreground">{mse.toFixed(4)}</span></span>
            <span>variance explained: <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{pctImproved.toFixed(1)}%</span></span>
          </div>
          <Slider label="Learning rate η" min={0.05} max={1} step={0.05} value={learningRate}
            onChange={(v) => { setLearningRate(v); setStep(0); }} format={(v) => v.toFixed(2)} />
          <Slider label="Tree depth" min={1} max={4} step={1} value={treeDepth}
            onChange={(v) => { setTreeDepth(v); setStep(0); }} />
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <SegButton active={view === "fit"} onClick={() => setView("fit")}>Ensemble fit</SegButton>
          <SegButton active={view === "residuals"} onClick={() => setView("residuals")}>Residuals</SegButton>
        </div>
        {step > 0 && view === "residuals" && (
          <span className="text-xs text-muted-foreground">
            dashed = tree {step} fitted to these residuals
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {view === "fit" && (
          <>
            {/* True function (dashed) */}
            <path d={truePath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />
            {/* Baseline */}
            {step === 0 && (
              <line x1={PAD} y1={sy(baseline)} x2={W - PAD} y2={sy(baseline)} stroke="var(--brand-cyan)" strokeWidth="2" strokeDasharray="4 3" />
            )}
            {/* Ensemble curve */}
            {step > 0 && <path d={ensemblePath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />}
            {/* Data points */}
            {xs.map((x, i) => (
              <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={4} fill="var(--brand-cyan)"
                stroke="var(--background)" strokeWidth="1.5" opacity="0.9" />
            ))}
            {/* Predictions */}
            {xs.map((x, i) => (
              <circle key={"p" + i} cx={sx(x)} cy={sy(preds[i])} r={3}
                fill="var(--brand-violet)" opacity="0.7" />
            ))}
            {/* Residual lines */}
            {xs.map((x, i) => (
              <line key={"r" + i} x1={sx(x)} y1={sy(ys[i])} x2={sx(x)} y2={sy(preds[i])}
                stroke="var(--brand-pink)" strokeWidth="1.2" opacity="0.6" />
            ))}
            {/* Legend */}
            <g transform={`translate(${W - PAD - 140}, ${PAD + 4})`}>
              <line x1={0} y1={6} x2={18} y2={6} stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.5" />
              <text x={22} y={10} fill="var(--muted-foreground)" fontSize="10">true f(x)</text>
              <circle cx={9} cy={24} r={4} fill="var(--brand-cyan)" />
              <text x={22} y={28} fill="var(--muted-foreground)" fontSize="10">data</text>
              {step > 0 && <>
                <line x1={0} y1={40} x2={18} y2={40} stroke="var(--brand-violet)" strokeWidth="2.5" />
                <text x={22} y={44} fill="var(--muted-foreground)" fontSize="10">ensemble</text>
                <line x1={0} y1={56} x2={18} y2={56} stroke="var(--brand-pink)" strokeWidth="1.5" opacity="0.7" />
                <text x={22} y={60} fill="var(--muted-foreground)" fontSize="10">residuals</text>
              </>}
            </g>
          </>
        )}

        {view === "residuals" && (
          <>
            {/* Zero line emphasis */}
            <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" />
            {/* Last tree fit to residuals */}
            {lastResidualPath && (
              <path d={lastResidualPath} fill="none" stroke="var(--brand-violet)"
                strokeWidth="2" strokeDasharray="6 3" opacity="0.8" />
            )}
            {/* Residual bars */}
            {xs.map((x, i) => (
              <g key={i}>
                <line x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(residuals[i])}
                  stroke={residuals[i] > 0 ? "var(--brand-cyan)" : "var(--brand-pink)"}
                  strokeWidth="3" strokeLinecap="round" />
                <circle cx={sx(x)} cy={sy(residuals[i])} r={4}
                  fill={residuals[i] > 0 ? "var(--brand-cyan)" : "var(--brand-pink)"}
                  stroke="var(--background)" strokeWidth="1.5" />
              </g>
            ))}
            <text x={PAD + 4} y={PAD + 12} fill="var(--muted-foreground)" fontSize="10">+ error</text>
            <text x={PAD + 4} y={H - PAD - 4} fill="var(--muted-foreground)" fontSize="10">− error</text>
          </>
        )}
      </svg>
    </VizFrame>
  );
}
