"use client";

import { useMemo, useState } from "react";
import {
  binomialPmf,
  exponentialPdf,
  linspace,
  normalPdf,
  poissonPmf,
} from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, SegButton } from "./controls";

type Dist = "normal" | "binomial" | "poisson" | "exponential";

const W = 640;
const H = 300;
const PAD = { l: 40, r: 16, t: 16, b: 34 };

export function DistributionExplorer() {
  const [dist, setDist] = useState<Dist>("normal");
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [n, setN] = useState(20);
  const [p, setP] = useState(0.5);
  const [lambda, setLambda] = useState(4);
  const [rate, setRate] = useState(1);

  const { points, bars, xDomain, yMax, meanVal, varVal } = useMemo(() => {
    if (dist === "normal") {
      const xs = linspace(mu - 4 * sigma, mu + 4 * sigma, 160);
      const pts = xs.map((x) => ({ x, y: normalPdf(x, mu, sigma) }));
      return {
        points: pts,
        bars: null as null | { x: number; y: number }[],
        xDomain: [mu - 4 * sigma, mu + 4 * sigma] as [number, number],
        yMax: Math.max(...pts.map((d) => d.y)) * 1.1,
        meanVal: mu,
        varVal: sigma * sigma,
      };
    }
    if (dist === "exponential") {
      const hi = 6 / rate;
      const xs = linspace(0, hi, 160);
      const pts = xs.map((x) => ({ x, y: exponentialPdf(x, rate) }));
      return {
        points: pts,
        bars: null,
        xDomain: [0, hi] as [number, number],
        yMax: Math.max(...pts.map((d) => d.y)) * 1.1,
        meanVal: 1 / rate,
        varVal: 1 / (rate * rate),
      };
    }
    if (dist === "binomial") {
      const bs = Array.from({ length: n + 1 }, (_, k) => ({ x: k, y: binomialPmf(k, n, p) }));
      return {
        points: null as null | { x: number; y: number }[],
        bars: bs,
        xDomain: [-0.5, n + 0.5] as [number, number],
        yMax: Math.max(...bs.map((d) => d.y)) * 1.15,
        meanVal: n * p,
        varVal: n * p * (1 - p),
      };
    }
    // poisson
    const kmax = Math.max(10, Math.ceil(lambda + 4 * Math.sqrt(lambda)));
    const bs = Array.from({ length: kmax + 1 }, (_, k) => ({ x: k, y: poissonPmf(k, lambda) }));
    return {
      points: null,
      bars: bs,
      xDomain: [-0.5, kmax + 0.5] as [number, number],
      yMax: Math.max(...bs.map((d) => d.y)) * 1.15,
      meanVal: lambda,
      varVal: lambda,
    };
  }, [dist, mu, sigma, n, p, lambda, rate]);

  const sx = (x: number) =>
    PAD.l + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);

  const path = points
    ? "M" + points.map((d) => `${sx(d.x).toFixed(1)},${sy(d.y).toFixed(1)}`).join(" L")
    : "";
  const area = points
    ? `M${sx(points[0].x)},${sy(0)} ` +
      points.map((d) => `L${sx(d.x).toFixed(1)},${sy(d.y).toFixed(1)}`).join(" ") +
      ` L${sx(points[points.length - 1].x)},${sy(0)} Z`
    : "";

  const ticks = useMemo(() => {
    const out: number[] = [];
    const [a, b] = xDomain;
    const step = (b - a) / 6;
    for (let i = 0; i <= 6; i++) out.push(a + i * step);
    return out;
  }, [xDomain]);

  const tabs: { id: Dist; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "binomial", label: "Binomial" },
    { id: "poisson", label: "Poisson" },
    { id: "exponential", label: "Exponential" },
  ];

  return (
    <VizFrame
      title="Distribution Explorer"
      hint="drag the sliders"
      controls={
        <div className="space-y-4">
          {dist === "normal" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Mean μ" min={-5} max={5} step={0.1} value={mu} onChange={setMu} format={(v) => v.toFixed(1)} />
              <Slider label="Std dev σ" min={0.3} max={3} step={0.1} value={sigma} onChange={setSigma} format={(v) => v.toFixed(1)} />
            </div>
          )}
          {dist === "binomial" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Trials n" min={1} max={60} step={1} value={n} onChange={setN} />
              <Slider label="Success prob p" min={0.01} max={0.99} step={0.01} value={p} onChange={setP} format={(v) => v.toFixed(2)} />
            </div>
          )}
          {dist === "poisson" && (
            <Slider label="Rate λ" min={0.5} max={20} step={0.5} value={lambda} onChange={setLambda} format={(v) => v.toFixed(1)} />
          )}
          {dist === "exponential" && (
            <Slider label="Rate λ" min={0.2} max={3} step={0.1} value={rate} onChange={setRate} format={(v) => v.toFixed(1)} />
          )}
          <div className="flex flex-wrap gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>Mean = <span className="font-mono text-foreground">{meanVal.toFixed(2)}</span></span>
            <span>Variance = <span className="font-mono text-foreground">{varVal.toFixed(2)}</span></span>
            <span>Std dev = <span className="font-mono text-foreground">{Math.sqrt(varVal).toFixed(2)}</span></span>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <SegButton key={t.id} active={dist === t.id} onClick={() => setDist(t.id)}>
            {t.label}
          </SegButton>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${dist} distribution`}>
        <defs>
          <linearGradient id="dist-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-violet)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand-violet)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--border)" />
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={sx(t)} y1={H - PAD.b} x2={sx(t)} y2={H - PAD.b + 4} stroke="var(--border)" />
            <text x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">
              {Math.abs(t) < 100 ? t.toFixed(t % 1 === 0 ? 0 : 1) : t.toFixed(0)}
            </text>
          </g>
        ))}
        {/* mean line for continuous */}
        {points && (
          <line x1={sx(meanVal)} y1={PAD.t} x2={sx(meanVal)} y2={H - PAD.b} stroke="var(--brand-cyan)" strokeDasharray="4 4" opacity="0.7" />
        )}
        {/* curve / bars */}
        {points && <path d={area} fill="url(#dist-fill)" />}
        {points && <path d={path} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />}
        {bars &&
          bars.map((b, i) => {
            const bw = Math.max(2, ((W - PAD.l - PAD.r) / bars.length) * 0.72);
            return (
              <rect
                key={i}
                x={sx(b.x) - bw / 2}
                y={sy(b.y)}
                width={bw}
                height={Math.max(0, H - PAD.b - sy(b.y))}
                rx={2}
                fill="var(--brand-violet)"
                opacity={0.85}
              />
            );
          })}
      </svg>
    </VizFrame>
  );
}
