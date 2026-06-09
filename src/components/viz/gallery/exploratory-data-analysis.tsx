"use client";

import { useState, useMemo } from "react";
import { mean, std, pearson, polyfit, polyval } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 320, PAD = 40;

// Four datasets that share nearly identical summary stats (Anscombe-style).
// Same mean(x)≈9, mean(y)≈7.5, std(x)≈3.3, std(y)≈2.0, r≈0.816
const DATASETS: { label: string; desc: string; pts: [number, number][] }[] = [
  {
    label: "Linear",
    desc: "A clean linear trend — the model fits perfectly.",
    pts: [
      [10, 8.04], [8, 6.95], [13, 7.58], [9, 8.81], [11, 8.33],
      [14, 9.96], [6, 7.24], [4, 4.26], [12, 10.84], [7, 4.82], [5, 5.68],
    ],
  },
  {
    label: "Curved",
    desc: "Strong curve — the linear fit misses the shape entirely.",
    pts: [
      [10, 9.14], [8, 8.14], [13, 8.74], [9, 8.77], [11, 9.26],
      [14, 8.10], [6, 6.13], [4, 3.10], [12, 9.13], [7, 7.26], [5, 4.74],
    ],
  },
  {
    label: "Outlier",
    desc: "One outlier hijacks r and the regression line.",
    pts: [
      [10, 7.46], [8, 6.77], [13, 12.74], [9, 7.11], [11, 7.81],
      [14, 8.84], [6, 6.08], [4, 5.39], [12, 8.15], [7, 6.42], [5, 5.73],
    ],
  },
  {
    label: "Cluster",
    desc: "All x-values identical except one lever point — r is an illusion.",
    pts: [
      [8, 6.58], [8, 5.76], [8, 7.71], [8, 8.84], [8, 8.47],
      [8, 7.04], [8, 5.25], [8, 5.56], [8, 7.91], [8, 6.89], [19, 12.5],
    ],
  },
];

type DatasetKey = 0 | 1 | 2 | 3;

export default function Viz() {
  const [active, setActive] = useState<DatasetKey>(0);
  const [showLine, setShowLine] = useState(true);

  const ds = DATASETS[active];
  const xs = ds.pts.map((p) => p[0]);
  const ys = ds.pts.map((p) => p[1]);

  const mx = useMemo(() => mean(xs), [active]);
  const my = useMemo(() => mean(ys), [active]);
  const sx = useMemo(() => std(xs), [active]);
  const sy = useMemo(() => std(ys), [active]);
  const r = useMemo(() => pearson(xs, ys), [active]);

  const coeffs = useMemo(() => polyfit(xs, ys, 1), [active]);

  const xMin = 2, xMax = 21, yMin = 2, yMax = 14;
  const px = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const py = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const linePath = useMemo(() => {
    const x0 = xMin, x1 = xMax;
    const y0 = polyval(coeffs, x0);
    const y1 = polyval(coeffs, x1);
    return `M${px(x0).toFixed(1)},${py(y0).toFixed(1)} L${px(x1).toFixed(1)},${py(y1).toFixed(1)}`;
  }, [coeffs, active]);

  const statsMatch = active !== 0;

  return (
    <VizFrame
      title="When Summary Stats Lie — Anscombe's Quartet"
      hint="Switch datasets and watch identical stats hide very different pictures"
      controls={
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dataset</div>
          <div className="flex flex-wrap gap-1.5">
            {DATASETS.map((d, i) => (
              <SegButton key={d.label} active={active === i} onClick={() => setActive(i as DatasetKey)}>
                {d.label}
              </SegButton>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">mean(x)</span>
              <span className="text-foreground">{mx.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">mean(y)</span>
              <span className="text-foreground">{my.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">std(x)</span>
              <span className="text-foreground">{sx.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">std(y)</span>
              <span className="text-foreground">{sy.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">r (Pearson)</span>
              <span style={{ color: "var(--brand-cyan)" }} className="font-bold">{r.toFixed(3)}</span>
            </div>
          </div>
          {statsMatch && (
            <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning">
              Same stats as "Linear" — yet the picture is completely different!
            </div>
          )}
          <VizButton onClick={() => setShowLine((v) => !v)}>
            <RotateCcw size={13} />
            {showLine ? "Hide" : "Show"} fit line
          </VizButton>
          <p className="text-xs text-muted-foreground italic">{ds.desc}</p>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {[3, 5, 7, 9, 11, 13].map((v) => (
          <line
            key={`gy${v}`}
            x1={PAD} y1={py(v)} x2={W - PAD} y2={py(v)}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4"
          />
        ))}
        {[4, 8, 12, 16, 20].map((v) => (
          <line
            key={`gx${v}`}
            x1={px(v)} y1={PAD} x2={px(v)} y2={H - PAD}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4"
          />
        ))}

        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--muted-foreground)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--muted-foreground)" strokeWidth="1" />

        {/* Axis labels */}
        {[4, 8, 12, 16, 20].map((v) => (
          <text key={`lx${v}`} x={px(v)} y={H - PAD + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{v}</text>
        ))}
        {[4, 7, 10, 13].map((v) => (
          <text key={`ly${v}`} x={PAD - 8} y={py(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{v}</text>
        ))}

        {/* Regression line */}
        {showLine && (
          <path d={linePath} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" strokeDasharray="6 3" opacity="0.85" />
        )}

        {/* Data points */}
        {ds.pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={px(x)} cy={py(y)} r="5.5"
            fill="var(--brand-cyan)" fillOpacity="0.22"
            stroke="var(--brand-cyan)" strokeWidth="1.8"
          />
        ))}

        {/* Mean crosshair */}
        <line
          x1={px(mx)} y1={PAD + 4} x2={px(mx)} y2={H - PAD}
          stroke="var(--warning)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7"
        />
        <line
          x1={PAD} y1={py(my)} x2={W - PAD - 4} y2={py(my)}
          stroke="var(--warning)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7"
        />
        <text x={px(mx) + 4} y={PAD + 14} fontSize="9" fill="var(--warning)" opacity="0.9">x̄</text>
        <text x={W - PAD - 14} y={py(my) - 4} fontSize="9" fill="var(--warning)" opacity="0.9">ȳ</text>
      </svg>
    </VizFrame>
  );
}
