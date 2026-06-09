"use client";

import { useState, useMemo } from "react";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 300, PAD = 40;

type DimKey = "metric" | "scope" | "baseline" | "stakeholder" | "timeline";

interface Dim { label: string; desc: string; vague: string; structured: string }

const DIMS: Record<DimKey, Dim> = {
  metric:      { label: "Success Metric",  desc: "How will you measure done?",         vague: '"improve accuracy"',               structured: '"≥90% F1 on held-out test set"' },
  scope:       { label: "Scope",           desc: "What data / users are in bounds?",   vague: '"analyze customer data"',          structured: '"purchase events, last 12mo, EU only"' },
  baseline:    { label: "Baseline",        desc: "What does beating status-quo mean?", vague: '"better than before"',             structured: '"beats rule-based model at 74% precision"' },
  stakeholder: { label: "Stakeholder",     desc: "Who consumes the output and how?",   vague: '"the business"',                   structured: '"product team via Slack alert, daily"' },
  timeline:    { label: "Timeline",        desc: "What is the delivery deadline?",     vague: '"as soon as possible"',            structured: '"MVP 3 wks, production 6 wks"' },
};
const KEYS: DimKey[] = ["metric", "scope", "baseline", "stakeholder", "timeline"];

function rpt(angle: number, r: number, cx: number, cy: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}
function radarPath(vals: number[], maxR: number, cx: number, cy: number): string {
  const n = vals.length;
  return vals.map((v, i) => {
    const [x, y] = rpt((2 * Math.PI * i) / n, v * maxR, cx, cy);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ") + " Z";
}

export default function Viz() {
  const [active, setActive] = useState<Record<DimKey, boolean>>({ metric: false, scope: false, baseline: false, stakeholder: false, timeline: false });
  const [hovered, setHovered] = useState<DimKey | null>(null);

  const toggle = (k: DimKey) => setActive((p) => ({ ...p, [k]: !p[k] }));
  const reset  = () => setActive({ metric: false, scope: false, baseline: false, stakeholder: false, timeline: false });

  const scores   = useMemo(() => KEYS.map((k): number => (active[k] ? 1 : 0)), [active]);
  const total    = useMemo(() => scores.reduce((a, b) => a + b, 0) / KEYS.length, [scores]);
  const defined  = scores.filter((s) => s > 0).length;

  const scoreColor = total < 0.35 ? "var(--danger)" : total < 0.65 ? "var(--warning)" : "var(--success)";
  const label = total < 0.2 ? "Vague" : total < 0.45 ? "Fuzzy" : total < 0.7 ? "Taking Shape" : total < 0.95 ? "Well-Scoped" : "Production-Ready";

  const CX = W / 2, CY = H / 2 - 10, MAX_R = Math.min(W, H) / 2 - PAD - 10;
  const n = KEYS.length;

  return (
    <VizFrame
      title="Structuring DS Problems"
      hint="toggle each dimension — watch clarity score build"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {KEYS.map((k) => (
              <SegButton key={k} active={active[k]} onClick={() => toggle(k)}>
                {DIMS[k].label}
              </SegButton>
            ))}
            <VizButton onClick={reset} className="ml-auto"><RotateCcw size={12} /> Reset</VizButton>
          </div>
          <div className="min-h-[52px] rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
            {hovered ? (
              <div className="space-y-1">
                <div className="font-semibold text-foreground">{DIMS[hovered].label} — {DIMS[hovered].desc}</div>
                <div className="flex items-baseline gap-2 text-muted-foreground">
                  <span className="shrink-0 rounded px-1 text-[10px] font-mono" style={{ background: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" }}>vague</span>
                  {DIMS[hovered].vague}
                </div>
                <div className="flex items-baseline gap-2 text-muted-foreground">
                  <span className="shrink-0 rounded px-1 text-[10px] font-mono" style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }}>structured</span>
                  {DIMS[hovered].structured}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold" style={{ color: scoreColor }}>{label}</span>
                  <span className="ml-2 text-muted-foreground">{defined}/{KEYS.length} dimensions defined</span>
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: scoreColor }}>{Math.round(total * 100)}%</div>
              </div>
            )}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon key={r} fill="none" stroke="var(--border)" strokeWidth={r === 1 ? 1 : 0.5} opacity={r === 1 ? 0.8 : 0.4}
            points={KEYS.map((_, i) => { const [x, y] = rpt((2 * Math.PI * i) / n, r * MAX_R, CX, CY); return `${x.toFixed(2)},${y.toFixed(2)}`; }).join(" ")} />
        ))}
        {/* Spokes */}
        {KEYS.map((_, i) => { const [x, y] = rpt((2 * Math.PI * i) / n, MAX_R, CX, CY); return <line key={i} x1={CX} y1={CY} x2={x.toFixed(2)} y2={y.toFixed(2)} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />; })}
        {/* Vague baseline fill */}
        <path d={radarPath(KEYS.map(() => 0.12), MAX_R, CX, CY)} fill="var(--muted-foreground)" opacity="0.1" />
        {/* Active fill */}
        <path d={radarPath(scores, MAX_R, CX, CY)} fill="var(--brand-cyan)" opacity="0.18" />
        <path d={radarPath(scores, MAX_R, CX, CY)} fill="none" stroke="var(--brand-cyan)" strokeWidth="2" opacity="0.9" />

        {/* Axis labels */}
        {KEYS.map((k, i) => {
          const angle = (2 * Math.PI * i) / n;
          const [lx, ly] = rpt(angle, MAX_R + 24, CX, CY);
          const [dx, dy] = rpt(angle, MAX_R, CX, CY);
          const isOn = active[k], isHov = hovered === k;
          return (
            <g key={k} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)} onClick={() => toggle(k)}>
              <circle cx={lx.toFixed(2)} cy={ly.toFixed(2)} r="26" fill="transparent" />
              <circle cx={dx.toFixed(2)} cy={dy.toFixed(2)} r={isOn ? 5 : 3} fill={isOn ? "var(--brand-cyan)" : "var(--muted-foreground)"} opacity={isOn ? 1 : 0.5} stroke="var(--background)" strokeWidth="1.5" />
              <text x={lx.toFixed(2)} y={(ly - 3).toFixed(2)} textAnchor="middle" fontSize="10" fontWeight={isOn || isHov ? "600" : "400"}
                fill={isOn ? "var(--brand-cyan)" : isHov ? "var(--foreground)" : "var(--muted-foreground)"}>
                {DIMS[k].label}
              </text>
              {isOn && <text x={lx.toFixed(2)} y={(ly + 9).toFixed(2)} textAnchor="middle" fontSize="9" fill="var(--success)">✓ defined</text>}
            </g>
          );
        })}

        {/* Center score */}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill={scoreColor}>{Math.round(total * 100)}%</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">Clarity Score</text>

        {/* Bottom progress bar */}
        {(() => {
          const bY = H - 14, bW = W - 2 * PAD, bH = 6;
          const fill = clamp(total * bW, 0, bW);
          return (
            <g>
              <rect x={PAD} y={bY} width={bW} height={bH} rx="3" fill="var(--border)" />
              <rect x={PAD} y={bY} width={fill.toFixed(1)} height={bH} rx="3" fill={scoreColor} opacity="0.85" />
              {[0.4, 0.8].map((t) => (
                <g key={t}>
                  <line x1={(PAD + t * bW).toFixed(1)} y1={bY - 4} x2={(PAD + t * bW).toFixed(1)} y2={bY + bH + 4} stroke="var(--muted-foreground)" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
                  <text x={(PAD + t * bW).toFixed(1)} y={bY - 7} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)" opacity="0.6">{t === 0.4 ? "Fuzzy" : "Scoped"}</text>
                </g>
              ))}
            </g>
          );
        })()}
      </svg>
    </VizFrame>
  );
}
