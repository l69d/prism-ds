"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace, mean, polyfit, polyval } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, VizButton, SegButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 310, PAD = 38;
const N_POINTS = 22;
const trueF = (x: number) => Math.sin(x * 2.4) * 0.7 + x * 0.15;

const sx = (v: number) => PAD + ((v + 1) / 2) * (W - 2 * PAD);
const sy = (v: number) => H - PAD - ((v + 1.2) / 2.4) * (H - 2 * PAD);

function bootstrapFit(xs: number[], ys: number[], rand: () => number, deg: number): number[] {
  const n = xs.length;
  const bxs: number[] = [], bys: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rand() * n);
    bxs.push(xs[idx]);
    bys.push(ys[idx]);
  }
  return polyfit(bxs, bys, deg);
}

export default function Viz() {
  const [nTrees, setNTrees] = useState(10);
  const [noise, setNoise] = useState(0.3);
  const [seed, setSeed] = useState(42);
  const [view, setView] = useState<"overlay" | "variance">("overlay");

  const data = useMemo(() => {
    const r = rng(seed);
    const xs = linspace(-1, 1, N_POINTS);
    const ys = xs.map((x) => trueF(x) + gaussian(r, 0, noise));
    return { xs, ys };
  }, [seed, noise]);

  const trees = useMemo(() => {
    const r = rng(seed + 999);
    return range(50).map(() => bootstrapFit(data.xs, data.ys, r, 4));
  }, [data, seed]);

  const evalXs = useMemo(() => linspace(-1, 1, 100), []);

  const ensemblePreds = useMemo(() => {
    const subset = trees.slice(0, nTrees);
    return evalXs.map((x) => mean(subset.map((c) => polyval(c, x))));
  }, [trees, nTrees, evalXs]);

  const singlePreds = useMemo(() => evalXs.map((x) => polyval(trees[0], x)), [trees, evalXs]);

  const truePreds = useMemo(() => evalXs.map((x) => trueF(x)), [evalXs]);

  const ensembleMSE = useMemo(
    () => mean(data.xs.map((x, i) => (mean(trees.slice(0, nTrees).map((c) => polyval(c, x))) - trueF(x)) ** 2)),
    [trees, nTrees, data.xs]
  );

  const singleMSE = useMemo(
    () => mean(data.xs.map((x) => (polyval(trees[0], x) - trueF(x)) ** 2)),
    [trees, data.xs]
  );

  const variancePerX = useMemo(() => {
    const subset = trees.slice(0, nTrees);
    return evalXs.map((x) => {
      const preds = subset.map((c) => polyval(c, x));
      const m = mean(preds);
      return mean(preds.map((p) => (p - m) ** 2));
    });
  }, [trees, nTrees, evalXs]);

  const maxVar = Math.max(...variancePerX) || 1;

  const singlePath = "M" + evalXs.map((x, i) => `${sx(x).toFixed(1)},${sy(singlePreds[i]).toFixed(1)}`).join(" L");
  const ensPath = "M" + evalXs.map((x, i) => `${sx(x).toFixed(1)},${sy(ensemblePreds[i]).toFixed(1)}`).join(" L");
  const truePath = "M" + evalXs.map((x, i) => `${sx(x).toFixed(1)},${sy(truePreds[i]).toFixed(1)}`).join(" L");

  const improvement = singleMSE > 0 ? ((singleMSE - ensembleMSE) / singleMSE) * 100 : 0;

  return (
    <VizFrame
      title="Bagging & Random Forests"
      hint="add more trees and watch the variance shrink"
      controls={
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider
              label="Number of trees"
              min={1} max={50} step={1} value={nTrees}
              onChange={setNTrees}
              format={(v) => String(v)}
            />
            <Slider
              label="Data noise"
              min={0.05} max={0.6} step={0.05} value={noise}
              onChange={setNoise}
              format={(v) => v.toFixed(2)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>single tree MSE <span className="font-mono" style={{ color: "var(--brand-pink)" }}>{singleMSE.toFixed(3)}</span></span>
            <span>ensemble MSE <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{ensembleMSE.toFixed(3)}</span></span>
            <span className="font-semibold" style={{ color: improvement > 0 ? "var(--success)" : "var(--muted-foreground)" }}>
              {improvement > 0 ? `${improvement.toFixed(0)}% better` : "same"}
            </span>
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={12} /> new data</VizButton>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <SegButton active={view === "overlay"} onClick={() => setView("overlay")}>Prediction overlay</SegButton>
        <SegButton active={view === "variance"} onClick={() => setView("variance")}>Variance heatmap</SegButton>
      </div>

      {view === "overlay" ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
          <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

          {/* Individual tree predictions (faint) */}
          {trees.slice(0, nTrees).map((c, i) => {
            const p = "M" + evalXs.map((x) => `${sx(x).toFixed(1)},${sy(polyval(c, x)).toFixed(1)}`).join(" L");
            return <path key={i} d={p} fill="none" stroke="var(--brand-indigo)" strokeWidth="1" opacity={0.18} />;
          })}

          {/* True function */}
          <path d={truePath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />

          {/* Single tree */}
          <path d={singlePath} fill="none" stroke="var(--brand-pink)" strokeWidth="2" opacity="0.85" />

          {/* Ensemble average */}
          <path d={ensPath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.8" />

          {/* Data points */}
          {data.xs.map((x, i) => (
            <circle key={i} cx={sx(x)} cy={sy(data.ys[i])} r={3.5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.2" />
          ))}

          {/* Legend */}
          <g transform={`translate(${W - PAD - 140}, ${PAD})`}>
            <rect x={0} y={0} width={138} height={72} rx={6} fill="var(--card)" stroke="var(--border)" opacity="0.92" />
            <line x1={8} y1={16} x2={26} y2={16} stroke="var(--brand-indigo)" strokeWidth="1.5" opacity="0.5" />
            <text x={30} y={20} fontSize={10} fill="var(--muted-foreground)">{nTrees} bootstrapped tree{nTrees !== 1 ? "s" : ""}</text>
            <line x1={8} y1={34} x2={26} y2={34} stroke="var(--brand-pink)" strokeWidth="2" />
            <text x={30} y={38} fontSize={10} fill="var(--muted-foreground)">single tree (tree 1)</text>
            <line x1={8} y1={52} x2={26} y2={52} stroke="var(--brand-violet)" strokeWidth="2.5" />
            <text x={30} y={56} fontSize={10} fill="var(--muted-foreground)">ensemble avg</text>
            <line x1={8} y1={66} x2={26} y2={66} stroke="var(--muted-foreground)" strokeDasharray="5 3" strokeWidth="1.5" />
            <text x={30} y={70} fontSize={10} fill="var(--muted-foreground)">true signal</text>
          </g>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Variance heatmap bars */}
          {evalXs.map((x, i) => {
            const barW = (W - 2 * PAD) / evalXs.length + 1;
            const varNorm = variancePerX[i] / maxVar;
            const barH = varNorm * (H - 2 * PAD);
            return (
              <rect
                key={i}
                x={sx(x) - barW / 2}
                y={H - PAD - barH}
                width={barW}
                height={barH}
                fill="var(--brand-violet)"
                opacity={0.15 + varNorm * 0.65}
              />
            );
          })}

          <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />

          {/* Ensemble ± std band */}
          {(() => {
            const upper = evalXs.map((x, i) => sy(ensemblePreds[i] + Math.sqrt(variancePerX[i])));
            const lower = evalXs.map((x, i) => sy(ensemblePreds[i] - Math.sqrt(variancePerX[i])));
            const band =
              "M" + evalXs.map((x, i) => `${sx(x).toFixed(1)},${upper[i].toFixed(1)}`).join(" L") +
              " L" + [...evalXs].reverse().map((x, i) => `${sx(x).toFixed(1)},${lower[evalXs.length - 1 - i].toFixed(1)}`).join(" L") + " Z";
            return <path d={band} fill="var(--brand-violet)" opacity="0.15" />;
          })()}

          <path d={truePath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
          <path d={ensPath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.8" />

          {data.xs.map((x, i) => (
            <circle key={i} cx={sx(x)} cy={sy(data.ys[i])} r={3.5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.2" />
          ))}

          <text x={PAD + 4} y={PAD + 14} fontSize={10} fill="var(--muted-foreground)">Bar height = prediction variance across {nTrees} tree{nTrees !== 1 ? "s" : ""}</text>
        </svg>
      )}
    </VizFrame>
  );
}
