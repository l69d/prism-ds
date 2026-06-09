"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, pearson } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 320, PAD = 44;
const N = 120;

// 3 temperature tiers — confounder
const TIERS = [
  { label: "Cold", color: "var(--brand-indigo)" },
  { label: "Warm", color: "var(--brand-cyan)" },
  { label: "Hot",  color: "var(--brand-pink)" },
];

function sx(v: number) { return PAD + ((v - 0) / 10) * (W - 2 * PAD); }
function sy(v: number) { return H - PAD - ((v - 0) / 10) * (H - 2 * PAD); }

export default function Viz() {
  const [noise, setNoise]           = useState(1.2);
  const [showConfounder, setShow]   = useState(false);
  const [seed, setSeed]             = useState(42);

  const { pts, rAll, rWithin } = useMemo(() => {
    const rand = rng(seed);
    const pts = range(N).map((i) => {
      const tier = Math.floor(i / (N / 3));        // 0=cold 1=warm 2=hot
      const temp = 2 + tier * 3 + gaussian(rand, 0, 0.5); // underlying confounder
      // Both outcomes driven by temperature + noise
      const iceCream = temp * 0.8 + gaussian(rand, 0, noise);
      const drowning  = temp * 0.7 + gaussian(rand, 0, noise);
      return { x: Math.max(0.2, Math.min(9.8, iceCream)), y: Math.max(0.2, Math.min(9.8, drowning)), tier };
    });
    const rAll = pearson(pts.map(p => p.x), pts.map(p => p.y));
    // Within-tier correlations (controls for confounder)
    const rWithin = [0, 1, 2].map(t => {
      const sub = pts.filter(p => p.tier === t);
      return pearson(sub.map(p => p.x), sub.map(p => p.y));
    });
    return { pts, rAll, rWithin };
  }, [noise, seed]);

  const avgWithin = rWithin.reduce((a, b) => a + b, 0) / 3;

  return (
    <VizFrame
      title="Correlation vs Causation"
      hint="reveal the confounder to see the illusion collapse"
      controls={
        <ControlGroup>
          <Slider
            label="Noise"
            min={0.3} max={2.5} step={0.1}
            value={noise}
            onChange={setNoise}
            format={(v) => v.toFixed(1)}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Confounder</span>
            <div className="flex gap-1.5">
              <SegButton active={!showConfounder} onClick={() => setShow(false)}>Hidden</SegButton>
              <SegButton active={showConfounder}  onClick={() => setShow(true)}>Revealed</SegButton>
              <VizButton onClick={() => setSeed(s => s + 1)} className="ml-auto">
                <RotateCcw size={12} /> Resample
              </VizButton>
            </div>
          </div>
        </ControlGroup>
      }
    >
      {/* Live readout */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>
          Overall r ={" "}
          <span
            className="font-mono font-semibold"
            style={{ color: "var(--brand-cyan)" }}
          >
            {rAll.toFixed(2)}
          </span>
        </span>
        {showConfounder && (
          <>
            {rWithin.map((r, i) => (
              <span key={i}>
                r<sub>{TIERS[i].label.toLowerCase()}</sub> ={" "}
                <span className="font-mono font-semibold" style={{ color: TIERS[i].color }}>
                  {r.toFixed(2)}
                </span>
              </span>
            ))}
            <span>
              avg within-group r ={" "}
              <span
                className="font-mono font-semibold"
                style={{ color: Math.abs(avgWithin) < 0.25 ? "var(--success)" : "var(--warning)" }}
              >
                {avgWithin.toFixed(2)}
              </span>
            </span>
          </>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD}     x2={PAD}     y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* Grid */}
        {[2, 4, 6, 8].map(v => (
          <g key={v}>
            <line x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
          </g>
        ))}

        {/* Axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Ice Cream Sales</text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90,12,${H/2})`}>Drowning Rate</text>

        {/* Trend line (overall) — shown always */}
        {(() => {
          const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
          const mx = xs.reduce((a,b)=>a+b,0)/xs.length;
          const my = ys.reduce((a,b)=>a+b,0)/ys.length;
          const b1 = xs.reduce((s,x,i) => s+(x-mx)*(ys[i]-my), 0) / xs.reduce((s,x) => s+(x-mx)**2, 0);
          const b0 = my - b1 * mx;
          return (
            <line
              x1={sx(0.5)} y1={sy(b0 + b1 * 0.5)}
              x2={sx(9.5)} y2={sy(b0 + b1 * 9.5)}
              stroke={showConfounder ? "var(--border)" : "var(--brand-cyan)"}
              strokeWidth={showConfounder ? 1 : 2}
              strokeDasharray={showConfounder ? "4,4" : undefined}
              opacity="0.8"
            />
          );
        })()}

        {/* Per-tier regression lines when confounder revealed */}
        {showConfounder && [0, 1, 2].map(t => {
          const sub = pts.filter(p => p.tier === t);
          const xs = sub.map(p => p.x), ys = sub.map(p => p.y);
          const mx = xs.reduce((a,b)=>a+b,0)/xs.length;
          const my = ys.reduce((a,b)=>a+b,0)/ys.length;
          const denom = xs.reduce((s,x) => s+(x-mx)**2, 0) || 1;
          const b1 = xs.reduce((s,x,i) => s+(x-mx)*(ys[i]-my), 0) / denom;
          const b0 = my - b1 * mx;
          const xlo = Math.min(...xs) - 0.2, xhi = Math.max(...xs) + 0.2;
          return (
            <line key={t}
              x1={sx(xlo)} y1={sy(b0 + b1 * xlo)}
              x2={sx(xhi)} y2={sy(b0 + b1 * xhi)}
              stroke={TIERS[t].color}
              strokeWidth="2"
              opacity="0.9"
            />
          );
        })}

        {/* Scatter points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={4}
            fill={showConfounder ? TIERS[p.tier].color : "var(--brand-cyan)"}
            stroke="var(--background)"
            strokeWidth="0.8"
            opacity="0.82"
          />
        ))}

        {/* Legend when revealed */}
        {showConfounder && TIERS.map((t, i) => (
          <g key={i} transform={`translate(${W - PAD - 90},${PAD + i * 18})`}>
            <circle cx={6} cy={6} r={5} fill={t.color} />
            <text x={15} y={10} fontSize="10" fill="var(--muted-foreground)">{t.label} season</text>
          </g>
        ))}
      </svg>

      {/* Insight callout */}
      <p className="mt-2 text-xs text-muted-foreground">
        {showConfounder
          ? "The confounder (season/temperature) drives both variables. Within each group the correlation shrinks toward zero — ice cream does not cause drownings."
          : "High overall correlation r ≈ " + rAll.toFixed(2) + ". Looks causal. Reveal the confounder to see why it's not."}
      </p>
    </VizFrame>
  );
}
