"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range, clamp } from "@/lib/utils";

const W = 640, H = 320, PAD = 40;

type SearchMode = "grid" | "random" | "bayesian";

// True loss surface: U-shaped train, higher validation with overfit region
function trainLoss(logC: number): number {
  // Decreases monotonically with complexity
  return 0.55 * Math.exp(-0.7 * logC) + 0.05;
}

function valLoss(logC: number, noise: number): number {
  // U-shaped: underfitting left, overfitting right
  const optimal = 0.0;
  const d = logC - optimal;
  return 0.18 + 0.14 * d * d + 0.022 * d * d * d * d + noise;
}

function generateSearchPoints(
  mode: SearchMode,
  nTrials: number,
  seed: number
): number[] {
  const rand = rng(seed);
  if (mode === "grid") {
    return linspace(-2.5, 2.5, nTrials);
  }
  if (mode === "random") {
    return range(nTrials).map(() => rand() * 5 - 2.5);
  }
  // Bayesian: start random, then concentrate near best
  const pts: number[] = [];
  for (let i = 0; i < nTrials; i++) {
    if (i < 3) {
      pts.push(rand() * 5 - 2.5);
    } else {
      // Find current best
      let best = pts[0];
      let bestV = valLoss(pts[0], 0);
      for (const p of pts) {
        const v = valLoss(p, 0);
        if (v < bestV) { bestV = v; best = p; }
      }
      // Sample near best with exploration noise
      const explore = gaussian(rand, best, 0.6 + 0.4 * (1 - i / nTrials));
      pts.push(clamp(explore, -2.8, 2.8));
    }
  }
  return pts;
}

export default function Viz() {
  const [mode, setMode] = useState<SearchMode>("grid");
  const [nTrials, setNTrials] = useState(8);
  const [seed, setSeed] = useState(42);
  const [selected, setSelected] = useState<number | null>(null);

  const xMin = -3, xMax = 3, yMin = 0, yMax = 0.75;

  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const trainPath = "M" + linspace(xMin, xMax, 160)
    .map((v) => `${sx(v).toFixed(1)},${sy(trainLoss(v)).toFixed(1)}`).join(" L");
  const valPath = "M" + linspace(xMin, xMax, 160)
    .map((v) => `${sx(v).toFixed(1)},${sy(valLoss(v, 0)).toFixed(1)}`).join(" L");

  const searchPts = useMemo(
    () => generateSearchPoints(mode, nTrials, seed),
    [mode, nTrials, seed]
  );

  const trialResults = useMemo(() => {
    const noiseRand = rng(seed + 1000);
    return searchPts.map((x) => ({
      x,
      val: valLoss(x, gaussian(noiseRand, 0, 0.015)),
      train: trainLoss(x),
    }));
  }, [searchPts, seed]);

  const bestIdx = useMemo(() => {
    let bi = 0;
    for (let i = 1; i < trialResults.length; i++) {
      if (trialResults[i].val < trialResults[bi].val) bi = i;
    }
    return bi;
  }, [trialResults]);

  const sel = selected !== null ? trialResults[selected] : trialResults[bestIdx];
  const selIdx = selected !== null ? selected : bestIdx;

  const logCToLabel = (v: number) => {
    if (v < -1.5) return "very low C";
    if (v < -0.5) return "low C";
    if (v < 0.5) return "optimal";
    if (v < 1.5) return "high C";
    return "very high C";
  };

  const modeColors: Record<SearchMode, string> = {
    grid: "var(--brand-violet)",
    random: "var(--brand-cyan)",
    bayesian: "var(--brand-pink)",
  };
  const dotColor = modeColors[mode];

  return (
    <VizFrame
      title="Hyperparameter Tuning"
      hint="Click a trial point to inspect it"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider
              label="# trials"
              value={nTrials}
              min={4}
              max={16}
              step={1}
              onChange={setNTrials}
              format={(v) => String(v)}
            />
            <Slider
              label="Random seed"
              value={seed}
              min={1}
              max={99}
              step={1}
              onChange={(v) => { setSeed(v); setSelected(null); }}
              format={(v) => String(v)}
            />
          </ControlGroup>
          <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
            <div className="font-medium text-foreground">
              Trial {selIdx + 1} · {logCToLabel(sel.x)}
            </div>
            <div className="flex gap-4 text-muted-foreground">
              <span>log C = <span className="font-mono text-foreground">{sel.x.toFixed(2)}</span></span>
              <span>val loss = <span className="font-mono" style={{ color: "var(--brand-violet)" }}>{sel.val.toFixed(3)}</span></span>
              <span>train = <span className="font-mono text-foreground">{sel.train.toFixed(3)}</span></span>
            </div>
            {sel.val - sel.train > 0.12 && (
              <div style={{ color: "var(--danger)" }} className="font-medium">overfit — val &gt;&gt; train</div>
            )}
            {sel.x < -1.8 && (
              <div style={{ color: "var(--warning)" }} className="font-medium">underfit — both losses high</div>
            )}
            {Math.abs(sel.x) < 0.7 && (
              <div style={{ color: "var(--success)" }} className="font-medium">sweet spot</div>
            )}
          </div>
          <VizButton onClick={() => { setSeed(rng(seed + 7)() * 98 + 1 | 0); setSelected(null); }}>
            <RotateCcw size={13} /> Reshuffle
          </VizButton>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5 items-center">
        <SegButton active={mode === "grid"} onClick={() => { setMode("grid"); setSelected(null); }}>Grid</SegButton>
        <SegButton active={mode === "random"} onClick={() => { setMode("random"); setSelected(null); }}>Random</SegButton>
        <SegButton active={mode === "bayesian"} onClick={() => { setMode("bayesian"); setSelected(null); }}>Bayesian</SegButton>
        <span className="ml-auto text-xs text-muted-foreground">
          best val loss <span className="font-mono text-foreground">{trialResults[bestIdx].val.toFixed(3)}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ cursor: "default" }}>
        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        {/* y axis ticks */}
        {[0.1, 0.3, 0.5, 0.7].map((v) => (
          <g key={v}>
            <line x1={PAD - 4} y1={sy(v)} x2={PAD} y2={sy(v)} stroke="var(--border)" />
            <text x={PAD - 7} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}
        {/* x axis ticks */}
        {[-2, -1, 0, 1, 2].map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={H - PAD} x2={sx(v)} y2={H - PAD + 4} stroke="var(--border)" />
            <text x={sx(v)} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}
        {/* underfit / overfit zones */}
        <rect x={PAD} y={PAD} width={sx(-0.7) - PAD} height={H - 2 * PAD} fill="var(--warning)" opacity="0.05" />
        <rect x={sx(0.7)} y={PAD} width={W - PAD - sx(0.7)} height={H - 2 * PAD} fill="var(--danger)" opacity="0.05" />
        <text x={sx(-2)} y={PAD + 12} fontSize="9" fill="var(--warning)" opacity="0.8">underfit</text>
        <text x={sx(1.8)} y={PAD + 12} fontSize="9" fill="var(--danger)" opacity="0.8" textAnchor="middle">overfit</text>
        {/* curves */}
        <path d={trainPath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 3" />
        <path d={valPath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
        {/* legend */}
        <line x1={W - PAD - 90} y1={PAD + 8} x2={W - PAD - 76} y2={PAD + 8} stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x={W - PAD - 72} y={PAD + 12} fontSize="9" fill="var(--muted-foreground)">train</text>
        <line x1={W - PAD - 90} y1={PAD + 22} x2={W - PAD - 76} y2={PAD + 22} stroke="var(--brand-violet)" strokeWidth="2.5" />
        <text x={W - PAD - 72} y={PAD + 26} fontSize="9" fill="var(--muted-foreground)">val</text>
        {/* search points */}
        {trialResults.map((t, i) => (
          <g key={i} onClick={() => setSelected(i === selected ? null : i)} style={{ cursor: "pointer" }}>
            <circle
              cx={sx(t.x)}
              cy={sy(t.val)}
              r={i === bestIdx ? 7 : 5}
              fill={i === selIdx ? dotColor : "var(--card)"}
              stroke={dotColor}
              strokeWidth={i === bestIdx ? 2.5 : 1.5}
              opacity={i === selIdx ? 1 : 0.75}
            />
            {i === bestIdx && (
              <text x={sx(t.x)} y={sy(t.val) - 11} textAnchor="middle" fontSize="9" fill={dotColor} fontWeight="600">best</text>
            )}
          </g>
        ))}
        {/* vertical line at selected */}
        <line
          x1={sx(sel.x)} y1={sy(sel.train)}
          x2={sx(sel.x)} y2={sy(sel.val)}
          stroke="var(--brand-pink)" strokeWidth="1" strokeDasharray="3 2" opacity="0.7"
        />
        {/* axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">log(C) — model complexity →</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90, 10, ${H / 2})`}>loss</text>
      </svg>
    </VizFrame>
  );
}
