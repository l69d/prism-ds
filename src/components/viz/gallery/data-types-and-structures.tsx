"use client";

import { useState, useMemo } from "react";
import { rng, histogram, mean, std } from "@/lib/mathx";
import { range, mapRange, clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 310, PAD = 40;
type DType = "numeric" | "categorical" | "ordinal";

const META: Record<DType, { label: string; desc: string; color: string; chartLabel: string }> = {
  numeric:     { label: "Numeric",     color: "var(--brand-cyan)",   desc: "Continuous → histogram, mean, std", chartLabel: "Histogram (distribution shape)" },
  categorical: { label: "Categorical", color: "var(--brand-violet)", desc: "Unordered labels → bar chart, mode only", chartLabel: "Bar Chart (frequency counts)" },
  ordinal:     { label: "Ordinal",     color: "var(--brand-pink)",   desc: "Ordered labels → ranked bars, median valid", chartLabel: "Ranked Bar (order matters)" },
};

const CATS = ["A", "B", "C", "D", "E"];
const ORDS = ["Low", "Med", "High", "V-High", "Extreme"];

function genData(seed: number, n: number): number[] {
  const rand = rng(seed);
  return range(n).map(() => {
    const u = Math.max(rand(), 1e-9), v = rand();
    const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return clamp(Math.round(g * 15 + 50), 0, 99);
  });
}

export default function Viz() {
  const [dtype, setDtype] = useState<DType>("numeric");
  const [seed, setSeed] = useState(42);
  const N = 80;
  const raw = useMemo(() => genData(seed, N), [seed]);
  const meta = META[dtype];

  const bars = useMemo(() => {
    if (dtype === "numeric") {
      const h = histogram(raw, 10, 0, 100);
      return { labels: range(10).map(i => String(Math.round(h.min + i * h.width))), counts: h.counts };
    }
    const labels = dtype === "categorical" ? CATS : ORDS;
    const counts = labels.map((_, i) => raw.filter(v => Math.floor(v / 20) === i).length);
    return { labels, counts };
  }, [raw, dtype]);

  const maxC = Math.max(...bars.counts, 1);

  const stats = useMemo(() => {
    if (dtype === "numeric") return { a: `mean = ${mean(raw).toFixed(1)}`, b: `std = ${std(raw).toFixed(1)}`, x: null };
    if (dtype === "categorical") {
      const mi = bars.counts.indexOf(Math.max(...bars.counts));
      return { a: `mode = "${bars.labels[mi]}"`, b: `${bars.counts[mi]} occurrences`, x: "mean / std undefined" };
    }
    let cum = 0, med = 0;
    const total = bars.counts.reduce((a, b) => a + b, 0);
    for (let i = 0; i < bars.counts.length; i++) { cum += bars.counts[i]; if (cum >= total / 2) { med = i; break; } }
    return { a: `median = "${bars.labels[med]}"`, b: `order: ${bars.labels.join(" < ")}`, x: "mean undefined (no numeric distance)" };
  }, [raw, dtype, bars]);

  const nBars = bars.labels.length;
  const bw = Math.floor((W - 2 * PAD) / nBars) - 3;

  return (
    <VizFrame
      title="Data Types & Structures"
      hint="Switch the type — the same column demands a different chart and different statistics"
      controls={
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Interpret column as</div>
            <div className="flex flex-wrap gap-1.5">
              {(["numeric", "categorical", "ordinal"] as DType[]).map(t => (
                <SegButton key={t} active={dtype === t} onClick={() => setDtype(t)}>{META[t].label}</SegButton>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2 space-y-1">
            <div className="text-xs font-mono" style={{ color: meta.color }}>{stats.a}</div>
            <div className="text-xs text-muted-foreground font-mono">{stats.b}</div>
            {stats.x && <div className="text-xs font-mono text-danger line-through opacity-60">{stats.x}</div>}
          </div>
          <div className="text-xs text-muted-foreground italic">{meta.desc}</div>
          <VizButton onClick={() => setSeed(s => s + 1)}><RotateCcw size={13} /> New sample</VizButton>
        </div>
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.chartLabel}</span>
        <span className="text-xs text-muted-foreground font-mono">n = {N}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD / 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1.0].map(f => {
          const y = mapRange(f, 0, 1, H - PAD, PAD / 2);
          return (
            <g key={f}>
              <line x1={PAD} y1={y} x2={W - PAD / 2} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{Math.round(f * maxC)}</text>
            </g>
          );
        })}
        {range(nBars).map(i => {
          const count = bars.counts[i];
          const bh = mapRange(count, 0, maxC, 0, H - PAD - PAD / 2);
          const x = PAD + i * ((W - 2 * PAD) / nBars) + 2;
          const y = H - PAD - bh;
          const op = dtype === "ordinal" ? mapRange(i, 0, nBars - 1, 0.28, 1.0) : 1;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={bh} fill={meta.color} opacity={op} rx="2" />
              <text x={x + bw / 2} y={H - PAD + 12} textAnchor="middle" fontSize={dtype === "numeric" && i % 2 !== 0 ? "0" : "10"}
                fill={dtype === "ordinal" ? meta.color : "var(--muted-foreground)"} fontWeight={dtype === "ordinal" ? "600" : "400"}>
                {bars.labels[i]}
              </text>
              {bh > 14 && (
                <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="9" fill={meta.color} fontWeight="600">{count}</text>
              )}
            </g>
          );
        })}
        {dtype === "ordinal" && (
          <g>
            <defs>
              <marker id="ord-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={meta.color} opacity="0.5" />
              </marker>
            </defs>
            <line x1={PAD + 6} y1={H - PAD + 23} x2={W - PAD - 6} y2={H - PAD + 23}
              stroke={meta.color} strokeWidth="1.5" markerEnd="url(#ord-arrow)" opacity="0.5" />
            <text x={W / 2} y={H - PAD + 33} textAnchor="middle" fontSize="9" fill={meta.color} opacity="0.6">ordered direction →</text>
          </g>
        )}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          {dtype === "numeric" ? "value bins (0–100)" : "category"}
        </text>
        <text x={11} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90,11,${H / 2})`}>count</text>
      </svg>
    </VizFrame>
  );
}
