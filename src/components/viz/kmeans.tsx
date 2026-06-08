"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, VizButton } from "./controls";
import { Play, Pause, RotateCcw, SkipForward, Shuffle } from "lucide-react";

const W = 520;
const H = 360;
const COLORS = ["var(--brand-violet)", "var(--brand-cyan)", "var(--brand-pink)", "var(--brand-indigo)", "var(--warning)"];

type Pt = { x: number; y: number };

function makePoints(seed: number): Pt[] {
  const r = rng(seed);
  const centers = [
    { x: 0.28, y: 0.3 }, { x: 0.72, y: 0.32 }, { x: 0.5, y: 0.74 },
  ];
  const pts: Pt[] = [];
  for (const c of centers) {
    for (let i = 0; i < 45; i++) {
      pts.push({ x: c.x + gaussian(r, 0, 0.08), y: c.y + gaussian(r, 0, 0.08) });
    }
  }
  return pts;
}

export function KMeansPlayground() {
  const [seed, setSeed] = useState(11);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<Pt[]>([]);
  const [assign, setAssign] = useState<number[]>([]);
  const [iter, setIter] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const points = useMemo(() => makePoints(seed), [seed]);

  const init = (kk: number, sd: number) => {
    const r = rng(sd * 31 + kk);
    setCentroids(Array.from({ length: kk }, () => ({ x: 0.15 + r() * 0.7, y: 0.15 + r() * 0.7 })));
    setAssign([]);
    setIter(0);
    setRunning(false);
  };

  useEffect(() => {
    init(k, seed);
  }, [k, seed]);

  const stepOnce = () => {
    if (!centroids.length) return;
    const a = points.map((p) => {
      let best = 0, bd = Infinity;
      centroids.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    });
    const next = centroids.map((c, i) => {
      const members = points.filter((_, j) => a[j] === i);
      if (!members.length) return c;
      return {
        x: members.reduce((s, p) => s + p.x, 0) / members.length,
        y: members.reduce((s, p) => s + p.y, 0) / members.length,
      };
    });
    setAssign(a);
    setCentroids(next);
    setIter((t) => t + 1);
  };

  useEffect(() => {
    if (!running) return;
    timer.current = setTimeout(stepOnce, 650);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, iter]);

  const sx = (x: number) => 20 + x * (W - 40);
  const sy = (y: number) => 20 + y * (H - 40);

  return (
    <VizFrame
      title="k-Means Clustering"
      hint="step through it"
      controls={
        <div className="space-y-4">
          <Slider label="Number of clusters k" min={2} max={5} step={1} value={k} onChange={setK} />
          <div className="flex flex-wrap items-center gap-2">
            <VizButton onClick={() => setRunning((r) => !r)}>
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Run</>}
            </VizButton>
            <VizButton onClick={() => { setRunning(false); stepOnce(); }}><SkipForward size={13} /> Step</VizButton>
            <VizButton onClick={() => init(k, seed)}><RotateCcw size={13} /> Re-init</VizButton>
            <VizButton onClick={() => setSeed((s) => s + 1)}><Shuffle size={13} /> New data</VizButton>
            <span className="ml-auto text-xs text-muted-foreground">iteration <span className="font-mono text-foreground">{iter}</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]">
        {assign.length > 0 &&
          points.map((p, i) => (
            <line key={"l" + i} x1={sx(p.x)} y1={sy(p.y)} x2={sx(centroids[assign[i]].x)} y2={sy(centroids[assign[i]].y)} stroke={COLORS[assign[i] % COLORS.length]} strokeWidth="0.5" opacity="0.18" />
          ))}
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4}
            fill={assign.length ? COLORS[assign[i] % COLORS.length] : "var(--muted-foreground)"}
            opacity={0.8} />
        ))}
        {centroids.map((c, i) => (
          <g key={"c" + i}>
            <circle cx={sx(c.x)} cy={sy(c.y)} r={11} fill={COLORS[i % COLORS.length]} opacity="0.25" />
            <path d={`M${sx(c.x) - 6},${sy(c.y)} L${sx(c.x) + 6},${sy(c.y)} M${sx(c.x)},${sy(c.y) - 6} L${sx(c.x)},${sy(c.y) + 6}`} stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" />
            <circle cx={sx(c.x)} cy={sy(c.y)} r={7} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" />
          </g>
        ))}
      </svg>
    </VizFrame>
  );
}
