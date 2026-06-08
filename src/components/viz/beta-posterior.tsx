"use client";

import { useMemo, useState } from "react";
import { betaPdfGrid } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider } from "./controls";

const W = 600, H = 280, PAD = { l: 16, r: 16, t: 16, b: 28 };

export function BetaPosteriorViz() {
  const [priorA, setPriorA] = useState(1);
  const [priorB, setPriorB] = useState(1);
  const [succ, setSucc] = useState(8);
  const [fail, setFail] = useState(4);

  const postA = priorA + succ, postB = priorB + fail;

  const prior = useMemo(() => betaPdfGrid(priorA, priorB), [priorA, priorB]);
  const post = useMemo(() => betaPdfGrid(postA, postB), [postA, postB]);

  const postMean = postA / (postA + postB);
  // 95% credible interval from the grid CDF
  const { lo, hi } = useMemo(() => {
    const dx = post.xs[1] - post.xs[0];
    let cum = 0, lo = 0, hi = 1;
    for (let i = 0; i < post.xs.length; i++) {
      cum += post.ys[i] * dx;
      if (lo === 0 && cum >= 0.025) lo = post.xs[i];
      if (cum >= 0.975) { hi = post.xs[i]; break; }
    }
    return { lo, hi };
  }, [post]);

  const yMax = Math.max(...post.ys, ...prior.ys) * 1.1;
  const sx = (x: number) => PAD.l + x * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);
  const pathOf = (g: { xs: number[]; ys: number[] }) => "M" + g.xs.map((x, i) => `${sx(x).toFixed(1)},${sy(g.ys[i]).toFixed(1)}`).join(" L");

  return (
    <VizFrame
      title="Bayesian Updating (Beta-Binomial)"
      hint="add data"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Prior pseudo-successes α" min={1} max={20} step={1} value={priorA} onChange={setPriorA} />
            <Slider label="Prior pseudo-failures β" min={1} max={20} step={1} value={priorB} onChange={setPriorB} />
            <Slider label="Observed successes" min={0} max={100} step={1} value={succ} onChange={setSucc} />
            <Slider label="Observed failures" min={0} max={100} step={1} value={fail} onChange={setFail} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>posterior mean <span className="font-mono text-foreground">{(postMean * 100).toFixed(1)}%</span></span>
            <span>95% credible interval <span className="font-mono text-foreground">[{(lo * 100).toFixed(1)}%, {(hi * 100).toFixed(1)}%]</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
        {/* credible interval shading */}
        <rect x={sx(lo)} y={PAD.t} width={sx(hi) - sx(lo)} height={H - PAD.t - PAD.b} fill="var(--brand-violet)" opacity="0.07" />
        <path d={pathOf(prior)} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
        <path d={pathOf(post)} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
        <line x1={sx(postMean)} y1={PAD.t} x2={sx(postMean)} y2={H - PAD.b} stroke="var(--brand-cyan)" strokeDasharray="3 3" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={sx(t)} y={H - 8} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">{t}</text>
        ))}
        <text x={W - PAD.r} y={PAD.t + 4} textAnchor="end" className="fill-[var(--muted-foreground)] text-[10px]">— posterior · ┄ prior</text>
      </svg>
    </VizFrame>
  );
}
