"use client";

import { useMemo, useState } from "react";
import { rng, gaussian, pearson, mean as avg, std } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, SegButton } from "./controls";

const W = 360, H = 300, PAD = 34;

const ANSCOMBE = {
  x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
  y1: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
  y2: [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74],
  y3: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73],
  x4: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8],
  y4: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89],
};

function Scatter({ xs, ys, domain }: { xs: number[]; ys: number[]; domain: [number, number, number, number] }) {
  const [xmin, xmax, ymin, ymax] = domain;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - ymin) / (ymax - ymin)) * (H - 2 * PAD);
  const r = pearson(xs, ys);
  // least squares line
  const mx = avg(xs), my = avg(ys);
  const b1 = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const b0 = my - b1 * mx;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        <line x1={sx(xmin)} y1={sy(b0 + b1 * xmin)} x2={sx(xmax)} y2={sy(b0 + b1 * xmax)} stroke="var(--brand-violet)" strokeWidth="2" opacity="0.8" />
        {xs.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={4.5} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1" />
        ))}
      </svg>
      <div className="mt-1 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>r = <span className="font-mono text-foreground">{r.toFixed(2)}</span></span>
        <span>μy = <span className="font-mono text-foreground">{avg(ys).toFixed(1)}</span></span>
        <span>σy = <span className="font-mono text-foreground">{std(ys).toFixed(1)}</span></span>
      </div>
    </div>
  );
}

export function CorrelationExplorer() {
  const [mode, setMode] = useState<"slider" | "anscombe">("slider");
  const [r, setR] = useState(0.6);

  const data = useMemo(() => {
    const rand = rng(99);
    const xs: number[] = [], ys: number[] = [];
    for (let i = 0; i < 80; i++) {
      const z1 = gaussian(rand), z2 = gaussian(rand);
      xs.push(z1);
      ys.push(r * z1 + Math.sqrt(1 - r * r) * z2);
    }
    return { xs, ys };
  }, [r]);

  return (
    <VizFrame
      title="Correlation & Why You Must Plot"
      hint={mode === "slider" ? "drag r" : "same stats!"}
      controls={
        mode === "slider" ? (
          <Slider label="Target correlation r" min={-1} max={1} step={0.01} value={r} onChange={setR} format={(v) => v.toFixed(2)} />
        ) : (
          <p className="text-xs text-muted-foreground">
            All four datasets share nearly the same mean, variance, correlation (r ≈ 0.82) and regression line — yet look completely different. Summary statistics alone will fool you.
          </p>
        )
      }
    >
      <div className="mb-3 flex gap-1.5">
        <SegButton active={mode === "slider"} onClick={() => setMode("slider")}>Correlation slider</SegButton>
        <SegButton active={mode === "anscombe"} onClick={() => setMode("anscombe")}>Anscombe&apos;s Quartet</SegButton>
      </div>
      {mode === "slider" ? (
        <div className="mx-auto max-w-[360px]">
          <Scatter xs={data.xs} ys={data.ys} domain={[-3.2, 3.2, -3.2, 3.2]} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Scatter xs={ANSCOMBE.x} ys={ANSCOMBE.y1} domain={[2, 20, 2, 14]} />
          <Scatter xs={ANSCOMBE.x} ys={ANSCOMBE.y2} domain={[2, 20, 2, 14]} />
          <Scatter xs={ANSCOMBE.x} ys={ANSCOMBE.y3} domain={[2, 20, 2, 14]} />
          <Scatter xs={ANSCOMBE.x4} ys={ANSCOMBE.y4} domain={[2, 20, 2, 14]} />
        </div>
      )}
    </VizFrame>
  );
}
