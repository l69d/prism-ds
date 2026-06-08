"use client";

import { useMemo, useState } from "react";
import { linspace, normalCdf, normalPdf } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider } from "./controls";

const W = 640, H = 280, PAD = { l: 16, r: 16, t: 16, b: 28 };

export function HypothesisTestViz() {
  const [effect, setEffect] = useState(0.12);
  const [n, setN] = useState(60);
  const alpha = 0.05;

  const se = 1 / Math.sqrt(n);
  const z = effect / se;
  const p = 2 * (1 - normalCdf(Math.abs(z))); // two-tailed
  const crit = 1.96 * se;
  const reject = p < alpha;

  const dom = 0.7;
  const peak = normalPdf(0, 0, se);
  const sx = (x: number) => PAD.l + ((x + dom) / (2 * dom)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / (peak * 1.1)) * (H - PAD.t - PAD.b);
  const xs = useMemo(() => linspace(-dom, dom, 200), []);
  const nullCurve = "M" + xs.map((x) => `${sx(x).toFixed(1)},${sy(normalPdf(x, 0, se)).toFixed(1)}`).join(" L");

  const tail = (from: number, dir: 1 | -1) => {
    const seg = xs.filter((x) => (dir === 1 ? x >= from : x <= from));
    if (!seg.length) return "";
    return (
      `M${sx(seg[0])},${sy(0)} ` +
      seg.map((x) => `L${sx(x).toFixed(1)},${sy(normalPdf(x, 0, se)).toFixed(1)}`).join(" ") +
      ` L${sx(seg[seg.length - 1])},${sy(0)} Z`
    );
  };

  return (
    <VizFrame
      title="Null Distribution & p-value"
      hint="raise n"
      controls={
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Observed effect (mean difference)" min={0} max={0.5} step={0.005} value={effect} onChange={setEffect} format={(v) => v.toFixed(3)} />
            <Slider label="Sample size n" min={5} max={400} step={1} value={n} onChange={setN} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>z = <span className="font-mono text-foreground">{z.toFixed(2)}</span></span>
            <span>p-value = <span className="font-mono text-foreground">{p < 0.0001 ? "<0.0001" : p.toFixed(4)}</span></span>
            <span className="ml-auto font-semibold" style={{ color: reject ? "var(--success)" : "var(--warning)" }}>
              {reject ? "Reject H₀ (significant at 0.05)" : "Fail to reject H₀"}
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* shaded p-value tails */}
        <path d={tail(Math.abs(effect), 1)} fill="var(--danger)" opacity="0.3" />
        <path d={tail(-Math.abs(effect), -1)} fill="var(--danger)" opacity="0.3" />
        <path d={nullCurve} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
        <line x1={PAD.l} y1={sy(0)} x2={W - PAD.r} y2={sy(0)} stroke="var(--border)" />
        {/* critical values */}
        <line x1={sx(crit)} y1={PAD.t} x2={sx(crit)} y2={H - PAD.b} stroke="var(--warning)" strokeDasharray="4 4" opacity="0.7" />
        <line x1={sx(-crit)} y1={PAD.t} x2={sx(-crit)} y2={H - PAD.b} stroke="var(--warning)" strokeDasharray="4 4" opacity="0.7" />
        {/* observed */}
        <line x1={sx(effect)} y1={PAD.t} x2={sx(effect)} y2={H - PAD.b} stroke="var(--brand-cyan)" strokeWidth="2" />
        <text x={sx(effect)} y={PAD.t + 2} textAnchor="middle" className="fill-[var(--brand-cyan)] text-[10px]">observed</text>
        <text x={sx(crit)} y={H - 6} textAnchor="middle" className="fill-[var(--warning)] text-[9px]">+1.96·SE</text>
        <text x={sx(0)} y={H - 6} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">H₀: no effect</text>
      </svg>
    </VizFrame>
  );
}
