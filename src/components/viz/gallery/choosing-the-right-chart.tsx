"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, histogram, linspace, normalPdf } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 580, H = 300, PAD = 38;

type Question = "comparison" | "distribution" | "relationship" | "trend";

const CATEGORIES = ["A", "B", "C", "D", "E"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BarChart({ vals, labels }: { vals: number[]; labels: string[] }) {
  const maxV = Math.max(...vals, 1);
  const barW = (W - 2 * PAD) / vals.length;
  const sy = (v: number) => H - PAD - (v / maxV) * (H - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <line x1={PAD} y1={H - PAD} x2={W - PAD / 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      {vals.map((v, i) => {
        const x = PAD + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        return (
          <g key={i}>
            <rect x={x} y={sy(v)} width={bw} height={H - PAD - sy(v)} fill="var(--brand-pink)" rx="3" opacity="0.85" />
            <text x={x + bw / 2} y={H - PAD + 14} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{labels[i]}</text>
            <text x={x + bw / 2} y={sy(v) - 5} textAnchor="middle" fontSize="10" fill="var(--foreground)">{v.toFixed(0)}</text>
          </g>
        );
      })}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Category</text>
    </svg>
  );
}

function HistChart({ data }: { data: number[] }) {
  const { counts, min, width } = histogram(data, 14);
  const maxC = Math.max(...counts, 1);
  const xMin = min, xMax = min + width * 14;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - (v / maxC) * (H - 2 * PAD);
  const curve = linspace(xMin, xMax, 120).map((x) => ({
    x: sx(x), y: sy(normalPdf(x, 0, 1) * data.length * width * (maxC / (maxC || 1)))
  }));
  const curvePath = "M" + curve.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <line x1={PAD} y1={H - PAD} x2={W - PAD / 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      {counts.map((c, i) => {
        const x0 = sx(min + i * width);
        const x1 = sx(min + (i + 1) * width);
        return <rect key={i} x={x0 + 1} y={sy(c)} width={x1 - x0 - 2} height={H - PAD - sy(c)} fill="var(--brand-pink)" opacity="0.75" />;
      })}
      <path d={curvePath} fill="none" stroke="var(--brand-violet)" strokeWidth="2" opacity="0.9" />
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Value</text>
      <text x={PAD - 10} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90,${PAD - 22},${H / 2})`}>Count</text>
    </svg>
  );
}

function ScatterChart({ xs, ys }: { xs: number[]; ys: number[] }) {
  const xMin = -3.2, xMax = 3.2, yMin = -3.2, yMax = 3.2;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
  const my = ys.reduce((s, y) => s + y, 0) / ys.length;
  const b1 = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1);
  const b0 = my - b1 * mx;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD} y1={H - PAD} x2={W - PAD / 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <line x1={sx(xMin)} y1={sy(b0 + b1 * xMin)} x2={sx(xMax)} y2={sy(b0 + b1 * xMax)} stroke="var(--brand-violet)" strokeWidth="2" opacity="0.8" />
      {xs.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={3.5} fill="var(--brand-pink)" opacity="0.7" />
      ))}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">X variable</text>
      <text x={PAD - 10} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90,${PAD - 22},${H / 2})`}>Y variable</text>
    </svg>
  );
}

function LineChart({ vals, labels }: { vals: number[]; labels: string[] }) {
  const yMin = Math.min(...vals) * 0.9, yMax = Math.max(...vals) * 1.1;
  const sx = (i: number) => PAD + (i / (vals.length - 1)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);
  const linePath = "M" + vals.map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");
  const step = Math.ceil(vals.length / 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <line x1={PAD} y1={H - PAD} x2={W - PAD / 2} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
      <path d={linePath} fill="none" stroke="var(--brand-pink)" strokeWidth="2.5" />
      {vals.map((v, i) => (
        <circle key={i} cx={sx(i)} cy={sy(v)} r={3.5} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="1.5" />
      ))}
      {vals.map((v, i) => i % step === 0 ? (
        <text key={i} x={sx(i)} y={H - PAD + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{labels[i]}</text>
      ) : null)}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Time</text>
    </svg>
  );
}

const CHART_META: Record<Question, { name: string; when: string; notWhen: string }> = {
  comparison: { name: "Bar Chart", when: "Comparing magnitudes across categories", notWhen: "Don't use for continuous data or time series" },
  distribution: { name: "Histogram", when: "Showing how values spread across a range", notWhen: "Don't use for categorical data or comparisons" },
  relationship: { name: "Scatter Plot", when: "Exploring correlation between two numeric variables", notWhen: "Don't use when one axis is categorical" },
  trend: { name: "Line Chart", when: "Tracking change over ordered time points", notWhen: "Don't use for unordered categories" },
};

export default function Viz() {
  const [question, setQuestion] = useState<Question>("comparison");
  const [noise, setNoise] = useState(0.3);

  const data = useMemo(() => {
    const rand = rng(42 + Math.round(noise * 100));
    const barVals = CATEGORIES.map((_, i) => 20 + i * 12 + gaussian(rand, 0, noise * 20));
    const distData = range(200).map(() => gaussian(rand, 0, 1 + noise * 1.5));
    const r = 0.75 - noise * 0.6;
    const scXs: number[] = [], scYs: number[] = [];
    for (let i = 0; i < 80; i++) {
      const z1 = gaussian(rand), z2 = gaussian(rand);
      scXs.push(z1);
      scYs.push(r * z1 + Math.sqrt(Math.max(0, 1 - r * r)) * z2);
    }
    const base = 50;
    const trendVals = MONTHS.map((_, i) => base + i * 4 + gaussian(rand, 0, noise * 15));
    return { barVals, distData, scXs, scYs, trendVals };
  }, [noise]);

  const meta = CHART_META[question];

  return (
    <VizFrame
      title="Choosing the Right Chart"
      hint="pick a question, adjust noise"
      controls={
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">What question are you answering?</p>
            <div className="flex flex-wrap gap-1.5">
              {(["comparison", "distribution", "relationship", "trend"] as Question[]).map((q) => (
                <SegButton key={q} active={question === q} onClick={() => setQuestion(q)}>
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </SegButton>
              ))}
            </div>
          </div>
          <div>
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Data noise</span>
                <span className="font-mono text-foreground">{noise.toFixed(2)}</span>
              </span>
              <input type="range" min={0} max={1} step={0.01} value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border outline-none"
                style={{ accentColor: "var(--brand-pink)" }}
              />
            </label>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1">
            <p className="text-xs font-semibold" style={{ color: "var(--brand-pink)" }}>{meta.name}</p>
            <p className="text-xs text-foreground">{meta.when}</p>
            <p className="text-xs text-muted-foreground">{meta.notWhen}</p>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        {question === "comparison" && <BarChart vals={data.barVals} labels={CATEGORIES} />}
        {question === "distribution" && <HistChart data={data.distData} />}
        {question === "relationship" && <ScatterChart xs={data.scXs} ys={data.scYs} />}
        {question === "trend" && <LineChart vals={data.trendVals} labels={MONTHS} />}
      </div>
    </VizFrame>
  );
}
