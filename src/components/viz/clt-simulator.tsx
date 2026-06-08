"use client";

import { useMemo, useRef, useState } from "react";
import { histogram, linspace, mean as avg, normalPdf, rng, std } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, SegButton, VizButton } from "./controls";
import { Dices, RotateCcw, Zap } from "lucide-react";

type Pop = "uniform" | "skewed" | "bimodal";

const W = 640;
const H = 180;
const PAD = { l: 34, r: 12, t: 12, b: 26 };

function sampleFrom(pop: Pop, rand: () => number): number {
  if (pop === "uniform") return rand();
  if (pop === "skewed") return Math.min(1, -Math.log(1 - rand()) / 4); // exp-ish on [0,1]
  // bimodal: two clusters
  const u = rand();
  const base = rand() * 0.18;
  return u < 0.5 ? 0.2 + base : 0.7 + base;
}

function popStats(pop: Pop) {
  const r = rng(99);
  const pool = Array.from({ length: 20000 }, () => sampleFrom(pop, r));
  return { mu: avg(pool), sd: std(pool), pool };
}

function MiniHist({
  counts,
  color,
  overlay,
}: {
  counts: number[];
  color: string;
  overlay?: { x: number[]; y: number[] };
}) {
  const maxC = Math.max(1, ...counts);
  const innerW = W - PAD.l - PAD.r;
  const bw = innerW / counts.length;
  const sy = (v: number) => H - PAD.b - (v / maxC) * (H - PAD.t - PAD.b);
  const overMax = overlay ? Math.max(...overlay.y) : 1;
  const oy = (v: number) => H - PAD.b - (v / overMax) * (H - PAD.t - PAD.b) * 0.95;
  const ox = (i: number) => PAD.l + (i / (overlay!.x.length - 1)) * innerW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
      {counts.map((c, i) => (
        <rect
          key={i}
          x={PAD.l + i * bw + bw * 0.08}
          y={sy(c)}
          width={bw * 0.84}
          height={Math.max(0, H - PAD.b - sy(c))}
          fill={color}
          opacity={0.8}
          rx={1.5}
        />
      ))}
      {overlay && (
        <path
          d={"M" + overlay.x.map((_, i) => `${ox(i).toFixed(1)},${oy(overlay.y[i]).toFixed(1)}`).join(" L")}
          fill="none"
          stroke="var(--brand-cyan)"
          strokeWidth="2.5"
        />
      )}
    </svg>
  );
}

export function CLTSimulator() {
  const [pop, setPop] = useState<Pop>("skewed");
  const [n, setN] = useState(5);
  const [means, setMeans] = useState<number[]>([]);
  const seed = useRef(1234);

  const { mu, sd } = useMemo(() => popStats(pop), [pop]);

  const draw = (times: number) => {
    const r = rng((seed.current += 7919));
    const next: number[] = [];
    for (let t = 0; t < times; t++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += sampleFrom(pop, r);
      next.push(s / n);
    }
    setMeans((prev) => [...prev, ...next].slice(-4000));
  };

  const reset = () => setMeans([]);

  const popHist = useMemo(() => {
    const r = rng(7);
    const pool = Array.from({ length: 4000 }, () => sampleFrom(pop, r));
    return histogram(pool, 40, 0, 1).counts;
  }, [pop]);

  const meanHist = useMemo(() => histogram(means.length ? means : [0.5], 40, 0, 1).counts, [means]);

  const theoretical = useMemo(() => {
    const se = sd / Math.sqrt(n);
    const xs = linspace(0, 1, 80);
    return { x: xs, y: xs.map((x) => normalPdf(x, mu, se)) };
  }, [mu, sd, n]);

  const pops: { id: Pop; label: string }[] = [
    { id: "uniform", label: "Uniform" },
    { id: "skewed", label: "Skewed" },
    { id: "bimodal", label: "Bimodal" },
  ];

  return (
    <VizFrame
      title="Central Limit Theorem"
      hint="draw samples"
      controls={
        <div className="space-y-4">
          <Slider label="Sample size n (each mean averages n draws)" min={1} max={50} step={1} value={n} onChange={(v) => { setN(v); reset(); }} />
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => draw(1)}><Dices size={13} /> Draw 1</VizButton>
            <VizButton onClick={() => draw(200)}><Zap size={13} /> Draw 200</VizButton>
            <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              {means.length.toLocaleString()} sample means · SE ≈ <span className="font-mono text-foreground">{(sd / Math.sqrt(n)).toFixed(3)}</span>
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Population (sample one value)</span>
          <div className="flex gap-1.5">
            {pops.map((p) => (
              <SegButton key={p.id} active={pop === p.id} onClick={() => { setPop(p.id); reset(); }}>
                {p.label}
              </SegButton>
            ))}
          </div>
        </div>
        <MiniHist counts={popHist} color="var(--brand-pink)" />
        <div className="pt-1 text-xs font-medium text-muted-foreground">
          Distribution of the sample mean (with theoretical normal)
        </div>
        <MiniHist counts={meanHist} color="var(--brand-violet)" overlay={theoretical} />
      </div>
    </VizFrame>
  );
}
