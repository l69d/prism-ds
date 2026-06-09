"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, std } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { range } from "@/lib/utils";

const W = 620, H = 340, PAD = 40;

type Pt = { x: number; y: number };

function makeData(seed: number, corr: number): Pt[] {
  const r = rng(seed);
  return range(60).map(() => {
    const x = gaussian(r, 0, 1);
    const noise = gaussian(r, 0, 1);
    const y = corr * x + Math.sqrt(1 - corr * corr) * noise;
    return { x, y };
  });
}

function projectOntoAxis(pts: Pt[], angleDeg: number): number[] {
  const rad = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);
  return pts.map((p) => p.x * ux + p.y * uy);
}

function varianceOf(vals: number[]): number {
  const m = mean(vals);
  return vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
}

export default function Viz() {
  const [seed, setSeed] = useState(42);
  const [corr, setCorr] = useState(0.8);
  const [angleDeg, setAngleDeg] = useState(40);
  const [mode, setMode] = useState<"proj" | "recon">("proj");

  const pts = useMemo(() => makeData(seed, corr), [seed, corr]);

  // Standardize for display
  const normed = useMemo((): Pt[] => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const mx = mean(xs), sx2 = std(xs) || 1;
    const my = mean(ys), sy2 = std(ys) || 1;
    return pts.map((p) => ({ x: (p.x - mx) / sx2, y: (p.y - my) / sy2 }));
  }, [pts]);

  const projScalars = useMemo(() => projectOntoAxis(normed, angleDeg), [normed, angleDeg]);
  const varExplained = useMemo(() => {
    const totalVar = varianceOf(normed.map((p) => p.x)) + varianceOf(normed.map((p) => p.y));
    return totalVar > 0 ? (varianceOf(projScalars) / totalVar) * 100 : 0;
  }, [normed, projScalars]);

  const rad = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(rad), uy = Math.sin(rad);

  const xRange = 2.8, yRange = 2.8;
  const sx = (v: number) => PAD + ((v + xRange) / (2 * xRange)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v + yRange) / (2 * yRange)) * (H - 2 * PAD);

  // Axis line endpoints in data space
  const axisLen = 2.5;
  const ax1 = sx(-ux * axisLen), ay1 = sy(-uy * axisLen);
  const ax2 = sx(ux * axisLen), ay2 = sy(uy * axisLen);

  // Perpendicular (PC2) direction
  const px2 = sx(ux * axisLen * 0.7 - uy * axisLen * 0.7);
  const py2 = sy(uy * axisLen * 0.7 + ux * axisLen * 0.7);

  // Projected points (reconstruction in 2D)
  const projPts: Pt[] = projScalars.map((s) => ({ x: s * ux, y: s * uy }));

  return (
    <VizFrame
      title="Dimensionality Reduction (PCA)"
      hint="Rotate the PC1 axis to maximise variance captured"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider
              label="PC1 angle"
              min={0}
              max={179}
              step={1}
              value={angleDeg}
              onChange={setAngleDeg}
              format={(v) => `${v}°`}
            />
            <Slider
              label="Data correlation"
              min={0}
              max={0.99}
              step={0.01}
              value={corr}
              onChange={setCorr}
              format={(v) => v.toFixed(2)}
            />
          </ControlGroup>
          <div className="flex items-center gap-2 flex-wrap">
            <SegButton active={mode === "proj"} onClick={() => setMode("proj")}>Projections</SegButton>
            <SegButton active={mode === "recon"} onClick={() => setMode("recon")}>Reconstruction</SegButton>
            <VizButton onClick={() => setSeed((s) => s + 1)} className="ml-auto">
              <RotateCcw size={12} /> New data
            </VizButton>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Variance captured: <span className="font-mono font-semibold" style={{ color: "var(--brand-violet)" }}>{varExplained.toFixed(1)}%</span></span>
            <span>Lost: <span className="font-mono font-semibold" style={{ color: "var(--brand-pink)" }}>{(100 - varExplained).toFixed(1)}%</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        <line x1={sx(-xRange)} y1={sy(0)} x2={sx(xRange)} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
        <line x1={sx(0)} y1={sy(-yRange)} x2={sx(0)} y2={sy(yRange)} stroke="var(--border)" strokeWidth="1" />

        {/* PC2 (dropped dimension) hint */}
        <line x1={sx(0)} y1={sy(0)} x2={px2} y2={py2} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x={px2 + 6} y={py2 - 4} fontSize="10" fill="var(--muted-foreground)" opacity="0.7">PC2 (dropped)</text>

        {/* PC1 axis */}
        <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke="var(--brand-violet)" strokeWidth="2" />
        <text x={ax2 + 5} y={ay2 + 4} fontSize="11" fill="var(--brand-violet)" fontWeight="600">PC1</text>

        {/* Reconstruction errors (residuals perpendicular to PC1) */}
        {mode === "recon" &&
          normed.map((p, i) => (
            <line
              key={"e" + i}
              x1={sx(p.x)}
              y1={sy(p.y)}
              x2={sx(projPts[i].x)}
              y2={sy(projPts[i].y)}
              stroke="var(--brand-pink)"
              strokeWidth="1"
              opacity="0.55"
              strokeDasharray="3 2"
            />
          ))}

        {/* Projected points on PC1 axis */}
        {mode === "proj" &&
          projPts.map((pp, i) => (
            <g key={"pp" + i}>
              <line
                x1={sx(normed[i].x)}
                y1={sy(normed[i].y)}
                x2={sx(pp.x)}
                y2={sy(pp.y)}
                stroke="var(--brand-cyan)"
                strokeWidth="0.8"
                opacity="0.35"
              />
              <circle cx={sx(pp.x)} cy={sy(pp.y)} r={3} fill="var(--brand-cyan)" opacity="0.7" />
            </g>
          ))}

        {/* Original data points */}
        {normed.map((p, i) => (
          <circle
            key={"pt" + i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={3.5}
            fill="var(--brand-violet)"
            opacity="0.72"
          />
        ))}

        {/* Variance bar at bottom */}
        <rect x={PAD} y={H - 14} width={W - 2 * PAD} height={6} rx="3" fill="var(--border)" />
        <rect
          x={PAD}
          y={H - 14}
          width={((W - 2 * PAD) * varExplained) / 100}
          height={6}
          rx="3"
          fill="var(--brand-violet)"
          opacity="0.85"
        />
        <text x={PAD} y={H - 18} fontSize="9" fill="var(--muted-foreground)">0%</text>
        <text x={W - PAD - 16} y={H - 18} fontSize="9" fill="var(--muted-foreground)">100%</text>
        <text x={W / 2} y={H - 18} fontSize="9" fill="var(--brand-violet)" textAnchor="middle" fontWeight="600">
          {varExplained.toFixed(1)}% variance
        </text>
      </svg>
    </VizFrame>
  );
}
