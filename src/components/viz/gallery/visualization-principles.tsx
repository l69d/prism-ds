"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range, mapRange } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton, Slider } from "@/components/viz/controls";

const W = 620, H = 300, PAD = 44;
const CATS = ["A", "B", "C", "D", "E", "F"];

type Encoding = "position" | "color" | "size" | "angle";
type ChartMode = "clean" | "junk";

const SEED_VALUES: Record<number, number[]> = {};
function getValues(seed: number): number[] {
  if (!SEED_VALUES[seed]) {
    const r = rng(seed);
    SEED_VALUES[seed] = CATS.map(() => 20 + Math.floor(r() * 70));
  }
  return SEED_VALUES[seed];
}

export default function Viz() {
  const [encoding, setEncoding] = useState<Encoding>("position");
  const [chartMode, setChartMode] = useState<ChartMode>("junk");
  const [seed, setSeed] = useState(42);

  const values = useMemo(() => getValues(seed), [seed]);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  const barW = (W - 2 * PAD) / CATS.length;
  const plotH = H - PAD - 30;

  const sy = (v: number) => PAD + plotH - mapRange(v, 0, 100, 0, plotH);
  const catColors = [
    "var(--brand-pink)", "var(--brand-violet)", "var(--brand-cyan)",
    "var(--brand-indigo)", "var(--warning)", "var(--success)",
  ];

  function reseed() {
    let next = seed + 1;
    while (next === seed) next++;
    setSeed(next < 200 ? next : 10);
  }

  const cleanBar = (i: number, v: number) => {
    const x = PAD + i * barW + barW * 0.15;
    const bw = barW * 0.7;
    const top = sy(v);
    const bot = sy(0);
    return (
      <g key={i}>
        <rect x={x} y={top} width={bw} height={bot - top}
          fill="var(--brand-pink)" rx={2} opacity={0.85} />
        <text x={x + bw / 2} y={top - 5} textAnchor="middle"
          fontSize={10} fill="var(--foreground)">{v}</text>
        <text x={x + bw / 2} y={H - 10} textAnchor="middle"
          fontSize={10} fill="var(--muted-foreground)">{CATS[i]}</text>
      </g>
    );
  };

  const junkBar = (i: number, v: number) => {
    const x = PAD + i * barW + barW * 0.1;
    const bw = barW * 0.8;
    const top = sy(v);
    const bot = sy(0);
    const stripes = range(Math.floor(plotH / 8)).map((j) => {
      const yy = bot - j * 8;
      return <line key={j} x1={x} y1={yy} x2={x + bw} y2={yy}
        stroke="var(--background)" strokeWidth={1} opacity={0.4} />;
    });
    const shadow = 5;
    return (
      <g key={i}>
        <rect x={x + shadow} y={top + shadow} width={bw} height={bot - top}
          fill="var(--foreground)" opacity={0.08} rx={2} />
        <rect x={x} y={top} width={bw} height={bot - top}
          fill={catColors[i]} rx={2} />
        {stripes}
        <rect x={x} y={top} width={bw} height={12}
          fill="var(--background)" opacity={0.25} rx={2} />
        <text x={x + bw / 2} y={top - 5} textAnchor="middle"
          fontSize={9} fill={catColors[i]} fontWeight="bold">{v}%</text>
        <text x={x + bw / 2} y={H - 10} textAnchor="middle"
          fontSize={9} fill="var(--muted-foreground)">{CATS[i]}</text>
        {range(4).map((j) => (
          <line key={j} x1={x + bw * 0.1 + j * bw * 0.25} y1={top}
            x2={x + bw * 0.1 + j * bw * 0.25} y2={bot}
            stroke="var(--background)" strokeWidth={0.8} opacity={0.5} />
        ))}
      </g>
    );
  };

  const encDot = (i: number, v: number) => {
    const cx = PAD + i * barW + barW / 2;
    if (encoding === "position") {
      return (
        <g key={i}>
          <circle cx={cx} cy={sy(v)} r={6} fill="var(--brand-pink)" />
          <line x1={cx} y1={sy(v)} x2={cx} y2={sy(0)}
            stroke="var(--brand-pink)" strokeWidth={1.5} opacity={0.35} />
          <text x={cx} y={H - 10} textAnchor="middle"
            fontSize={10} fill="var(--muted-foreground)">{CATS[i]}</text>
        </g>
      );
    }
    if (encoding === "color") {
      const t = (v - minVal) / Math.max(maxVal - minVal, 1);
      const pink = `color-mix(in srgb, var(--brand-pink) ${Math.round(t * 100)}%, var(--muted-foreground))`;
      return (
        <g key={i}>
          <rect x={PAD + i * barW + barW * 0.1} y={PAD + 20} width={barW * 0.8} height={plotH - 20}
            fill={pink} rx={3} />
          <text x={cx} y={H - 10} textAnchor="middle"
            fontSize={10} fill="var(--muted-foreground)">{CATS[i]}</text>
          <text x={cx} y={PAD + 14} textAnchor="middle"
            fontSize={9} fill="var(--foreground)" opacity={0.7}>{v}</text>
        </g>
      );
    }
    if (encoding === "size") {
      const r = mapRange(v, 0, 100, 8, 30);
      return (
        <g key={i}>
          <circle cx={cx} cy={H / 2 - 10} r={r}
            fill="var(--brand-pink)" opacity={0.75} />
          <text x={cx} y={H - 10} textAnchor="middle"
            fontSize={10} fill="var(--muted-foreground)">{CATS[i]}</text>
        </g>
      );
    }
    // angle (pie-slice style wedges)
    const sweep = (v / 100) * 150;
    const cx2 = cx, cy2 = H / 2 + 10, r2 = 26;
    const startA = -105 * (Math.PI / 180);
    const endA = startA + sweep * (Math.PI / 180);
    const x1 = cx2 + r2 * Math.cos(startA);
    const y1 = cy2 + r2 * Math.sin(startA);
    const x2 = cx2 + r2 * Math.cos(endA);
    const y2 = cy2 + r2 * Math.sin(endA);
    const largeArc = sweep > 180 ? 1 : 0;
    return (
      <g key={i}>
        <circle cx={cx2} cy={cy2} r={r2} fill="var(--muted-foreground)" opacity={0.12} />
        <path d={`M ${cx2} ${cy2} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r2} ${r2} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
          fill="var(--brand-pink)" opacity={0.85} />
        <text x={cx2} y={H - 10} textAnchor="middle"
          fontSize={10} fill="var(--muted-foreground)">{CATS[i]}</text>
      </g>
    );
  };

  const rankByEncoding = (() => {
    if (encoding === "position") return "Easiest to rank — length from common baseline";
    if (encoding === "color") return "Hard — hue encodes category, not quantity";
    if (encoding === "size") return "Moderate — area perception is non-linear (~x^0.87)";
    if (encoding === "angle") return "Hard — small angles feel similar";
    return "";
  })();

  const dataInkRatio = chartMode === "clean"
    ? "High — only ink that encodes data"
    : "Low — shadows, gradients, stripes add zero information";

  return (
    <VizFrame
      title="Visualization Principles"
      hint="toggle encoding & data-ink to feel the difference"
      controls={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">Encoding:</span>
            {(["position", "color", "size", "angle"] as Encoding[]).map((e) => (
              <SegButton key={e} active={encoding === e} onClick={() => setEncoding(e)}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </SegButton>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex gap-2">
              <SegButton active={chartMode === "junk"} onClick={() => setChartMode("junk")}>Chartjunk</SegButton>
              <SegButton active={chartMode === "clean"} onClick={() => setChartMode("clean")}>Clean</SegButton>
            </div>
            <VizButton onClick={reseed}>New data</VizButton>
            <div className="ml-auto text-xs text-muted-foreground space-y-0.5">
              <div>Rank accuracy: <span className="font-mono" style={{ color: "var(--brand-pink)" }}>{rankByEncoding}</span></div>
              <div>Data-ink: <span className="font-mono text-foreground">{dataInkRatio}</span></div>
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={sy(0)} x2={W - PAD + 10} y2={sy(0)}
          stroke="var(--border)" strokeWidth={1} />
        {chartMode === "clean" && [25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD} y1={sy(v)} x2={W - PAD + 10} y2={sy(v)}
              stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.5} />
            <text x={PAD - 4} y={sy(v) + 4} textAnchor="end"
              fontSize={9} fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}
        {chartMode === "junk" && (
          <>
            <rect x={PAD} y={PAD} width={W - 2 * PAD + 10} height={plotH}
              fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} rx={4} />
            {range(8).map((j) => (
              <line key={j} x1={PAD} y1={PAD + j * (plotH / 7)} x2={W - PAD + 10} y2={PAD + j * (plotH / 7)}
                stroke="var(--border)" strokeWidth={1} opacity={0.6} />
            ))}
            <text x={W / 2} y={22} textAnchor="middle"
              fontSize={11} fontWeight="bold" fill="var(--foreground)">SALES REPORT Q4</text>
          </>
        )}
        {encoding === "position" && chartMode === "junk"
          ? values.map((v, i) => junkBar(i, v))
          : encoding === "position" && chartMode === "clean"
            ? values.map((v, i) => cleanBar(i, v))
            : values.map((v, i) => encDot(i, v))
        }
      </svg>
    </VizFrame>
  );
}
