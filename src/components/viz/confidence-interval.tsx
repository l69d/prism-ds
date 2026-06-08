"use client";

import { useMemo, useState } from "react";
import { rng, gaussian, mean as avg, normalInv } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, VizButton } from "./controls";
import { RotateCcw } from "lucide-react";

const W = 600, H = 300, PAD = 30;
const TRUE_MU = 0, SIGMA = 1, M = 40;

export function ConfidenceIntervalSimulator() {
  const [n, setN] = useState(30);
  const [conf, setConf] = useState(0.95);
  const [seed, setSeed] = useState(1);

  const { intervals, coverage } = useMemo(() => {
    const r = rng(seed * 6271 + n);
    const z = normalInv(1 - (1 - conf) / 2);
    const se = SIGMA / Math.sqrt(n);
    let hit = 0;
    const intervals = Array.from({ length: M }, () => {
      const sample = Array.from({ length: n }, () => gaussian(r, TRUE_MU, SIGMA));
      const m = avg(sample);
      const lo = m - z * se, hi = m + z * se;
      const ok = lo <= TRUE_MU && TRUE_MU <= hi;
      if (ok) hit++;
      return { m, lo, hi, ok };
    });
    return { intervals, coverage: hit / M };
  }, [n, conf, seed]);

  const xMin = -1.2, xMax = 1.2;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const rowH = (H - 2 * PAD) / M;

  return (
    <VizFrame
      title="What '95% Confidence' Really Means"
      hint="resample"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Sample size n" min={5} max={200} step={5} value={n} onChange={setN} />
            <Slider label="Confidence level" min={0.8} max={0.99} step={0.01} value={conf} onChange={setConf} format={(v) => (v * 100).toFixed(0) + "%"} />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={13} /> Resample {M} studies</VizButton>
            <span className="text-muted-foreground">
              {Math.round(coverage * M)}/{M} intervals contain the true mean —{" "}
              <span className="font-mono text-foreground">{(coverage * 100).toFixed(0)}%</span> empirical coverage (nominal {(conf * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={sx(TRUE_MU)} y1={6} x2={sx(TRUE_MU)} y2={H - 6} stroke="var(--brand-cyan)" strokeWidth="1.5" strokeDasharray="4 4" />
        <text x={sx(TRUE_MU) + 4} y={14} className="fill-[var(--brand-cyan)] text-[10px]">true mean</text>
        {intervals.map((iv, i) => {
          const y = PAD + i * rowH + rowH / 2;
          const col = iv.ok ? "var(--brand-violet)" : "var(--danger)";
          return (
            <g key={i}>
              <line x1={sx(iv.lo)} y1={y} x2={sx(iv.hi)} y2={y} stroke={col} strokeWidth="1.5" opacity={iv.ok ? 0.6 : 1} />
              <circle cx={sx(iv.m)} cy={y} r={1.8} fill={col} />
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Each line is one study&apos;s interval. Red ones <span className="text-danger">miss</span> the true mean — over many studies, ~{(conf * 100).toFixed(0)}% should contain it.
      </p>
    </VizFrame>
  );
}
