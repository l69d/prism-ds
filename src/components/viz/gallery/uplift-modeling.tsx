"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp, range } from "@/lib/utils";

const W = 640, H = 340, PAD = 44;

type Segment = "persuadables" | "sure_things" | "lost_causes" | "sleeping_dogs";

const SEGMENTS: { id: Segment; label: string; desc: string; quadrant: [number, number] }[] = [
  { id: "persuadables",   label: "Persuadables",   desc: "Low base → high treated → target!",   quadrant: [0, 1] },
  { id: "sure_things",    label: "Sure Things",     desc: "Buy anyway — treatment wastes budget", quadrant: [1, 1] },
  { id: "lost_causes",    label: "Lost Causes",     desc: "Won't convert regardless",             quadrant: [0, 0] },
  { id: "sleeping_dogs",  label: "Sleeping Dogs",   desc: "Treatment backfires — avoid!",         quadrant: [1, 0] },
];

const SEG_COLORS: Record<Segment, string> = {
  persuadables:  "var(--brand-violet)",
  sure_things:   "var(--brand-cyan)",
  lost_causes:   "var(--muted-foreground)",
  sleeping_dogs: "var(--danger)",
};

function makePoints(seg: Segment, n: number, treatEffect: number, noiseLevel: number, seed: number) {
  const r = rng(seed * 104729 + SEGMENTS.findIndex((s) => s.id === seg) * 7919);
  const [qx, qy] = SEGMENTS.find((s) => s.id === seg)!.quadrant;
  const baseControl = qx === 1 ? 0.72 : 0.18;
  const baseTreated = seg === "persuadables"
    ? clamp(baseControl + treatEffect, 0.05, 0.97)
    : seg === "sleeping_dogs"
    ? clamp(baseControl - treatEffect * 0.8, 0.03, 0.95)
    : baseControl + (qy === 1 ? 0.02 : -0.01);

  return range(n).map(() => {
    const noise = noiseLevel * 0.18;
    const pc = clamp(baseControl + gaussian(r, 0, noise), 0.02, 0.98);
    const pt = clamp(baseTreated + gaussian(r, 0, noise), 0.02, 0.98);
    return { pc, pt, uplift: pt - pc };
  });
}

export default function Viz() {
  const [treatEffect, setTreatEffect] = useState(0.38);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [focus, setFocus] = useState<Segment | null>(null);
  const [seed, setSeed] = useState(42);

  const pts = useMemo(() => {
    const out = {} as Record<Segment, { pc: number; pt: number; uplift: number }[]>;
    for (const s of SEGMENTS) out[s.id] = makePoints(s.id, 28, treatEffect, noiseLevel, seed);
    return out;
  }, [treatEffect, noiseLevel, seed]);

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - v * (H - 2 * PAD);

  const meanUplift = (seg: Segment) => {
    const ps = pts[seg];
    return ps.reduce((a, p) => a + p.uplift, 0) / ps.length;
  };

  const persuadableUplift = meanUplift("persuadables");
  const sleepingUplift = meanUplift("sleeping_dogs");

  return (
    <VizFrame
      title="Uplift Modeling"
      hint="adjust treatment effect · click a segment"
      controls={
        <div className="space-y-3">
          <Slider
            label="Treatment effect (on persuadables)"
            min={0.05} max={0.65} step={0.01} value={treatEffect}
            onChange={setTreatEffect}
            format={(v) => "+" + (v * 100).toFixed(0) + " pp"}
          />
          <Slider
            label="Individual noise"
            min={0.1} max={1.0} step={0.05} value={noiseLevel}
            onChange={setNoiseLevel}
            format={(v) => v.toFixed(2)}
          />
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span>Persuadable uplift <span className="font-mono font-bold" style={{ color: "var(--brand-violet)" }}>{persuadableUplift >= 0 ? "+" : ""}{(persuadableUplift * 100).toFixed(1)} pp</span></span>
            <span>Sleeping dog uplift <span className="font-mono font-bold" style={{ color: "var(--danger)" }}>{(sleepingUplift * 100).toFixed(1)} pp</span></span>
            <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={12} /> Resample</VizButton>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SEGMENTS.map((s) => (
              <SegButton key={s.id} active={focus === s.id} onClick={() => setFocus(focus === s.id ? null : s.id)}>
                <span style={{ color: focus === s.id ? undefined : SEG_COLORS[s.id] }}>{s.label}</span>
              </SegButton>
            ))}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* Diagonal — outcome-only model always predicts along here */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--border)" strokeWidth="1" strokeDasharray="5 4" />
        <text x={sx(0.53)} y={sy(0.56)} fill="var(--muted-foreground)" fontSize="9" transform={`rotate(-45,${sx(0.53)},${sy(0.56)})`}>outcome model (no uplift)</text>

        {/* Quadrant shading */}
        <rect x={PAD} y={PAD} width={(W - 2 * PAD) / 2} height={(H - 2 * PAD) / 2} fill="var(--brand-violet)" opacity="0.04" />
        <rect x={PAD + (W - 2 * PAD) / 2} y={PAD} width={(W - 2 * PAD) / 2} height={(H - 2 * PAD) / 2} fill="var(--brand-cyan)" opacity="0.04" />
        <rect x={PAD} y={PAD + (H - 2 * PAD) / 2} width={(W - 2 * PAD) / 2} height={(H - 2 * PAD) / 2} fill="var(--muted-foreground)" opacity="0.04" />
        <rect x={PAD + (W - 2 * PAD) / 2} y={PAD + (H - 2 * PAD) / 2} width={(W - 2 * PAD) / 2} height={(H - 2 * PAD) / 2} fill="var(--danger)" opacity="0.05" />

        {/* Quadrant labels */}
        {SEGMENTS.map((s) => {
          const qx = s.quadrant[0], qy = s.quadrant[1];
          const lx = PAD + (qx === 0 ? 0.13 : 0.63) * (W - 2 * PAD);
          const ly = PAD + (qy === 1 ? 0.08 : 0.58) * (H - 2 * PAD);
          const dim = focus !== null && focus !== s.id;
          return (
            <text key={s.id} x={lx} y={ly} fill={SEG_COLORS[s.id]} fontSize="10" fontWeight="600" opacity={dim ? 0.25 : 0.9}>
              {s.label}
            </text>
          );
        })}

        {/* Scatter points */}
        {SEGMENTS.map((s) =>
          pts[s.id].map((p, i) => {
            const dim = focus !== null && focus !== s.id;
            return (
              <circle
                key={`${s.id}-${i}`}
                cx={sx(p.pc)} cy={sy(p.pt)}
                r={focus === s.id ? 4.5 : 3.5}
                fill={SEG_COLORS[s.id]}
                opacity={dim ? 0.1 : focus === s.id ? 0.85 : 0.55}
                style={{ transition: "opacity 0.2s, r 0.2s" }}
              />
            );
          })
        )}

        {/* Axis labels */}
        <text x={(W) / 2} y={H - 6} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
          P(outcome | control)  →
        </text>
        <text x={12} y={(H) / 2} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10" transform={`rotate(-90,12,${H / 2})`}>
          P(outcome | treated)  →
        </text>

        {/* Mid-lines */}
        <line x1={sx(0.5)} y1={PAD} x2={sx(0.5)} y2={H - PAD} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 3" />
        <line x1={PAD} y1={sy(0.5)} x2={W - PAD} y2={sy(0.5)} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3 3" />

        {/* Tick labels */}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <text x={sx(v)} y={H - PAD + 13} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">{(v * 100).toFixed(0)}%</text>
            <text x={PAD - 5} y={sy(v) + 3} textAnchor="end" fill="var(--muted-foreground)" fontSize="9">{(v * 100).toFixed(0)}%</text>
          </g>
        ))}

        {/* Focused segment: mean uplift arrow */}
        {focus && (() => {
          const mu = pts[focus].reduce((a, p) => a + p.pc, 0) / pts[focus].length;
          const mct = pts[focus].reduce((a, p) => a + p.pt, 0) / pts[focus].length;
          const x1 = sx(mu), y1 = sy(mu), x2 = sx(mu), y2 = sy(mct);
          const col = SEG_COLORS[focus];
          const up = meanUplift(focus);
          return (
            <g>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="2.5" markerEnd={`url(#arr-${focus})`} />
              <defs>
                <marker id={`arr-${focus}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L8,4 Z" fill={col} />
                </marker>
              </defs>
              <text x={x2 + 6} y={(y1 + y2) / 2 + 4} fill={col} fontSize="10" fontWeight="700">
                uplift {up >= 0 ? "+" : ""}{(up * 100).toFixed(1)} pp
              </text>
            </g>
          );
        })()}
      </svg>

      {focus && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold" style={{ color: SEG_COLORS[focus] }}>{SEGMENTS.find((s) => s.id === focus)!.label}: </span>
          {SEGMENTS.find((s) => s.id === focus)!.desc}
        </p>
      )}
    </VizFrame>
  );
}
