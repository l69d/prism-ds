"use client";

import { useState, useRef, useEffect } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { range } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

const W = 640, H = 360;
const CX = 200, CY = 175, R = 130, RI = 68;

type Role = "analyst" | "engineer" | "researcher";

interface Phase {
  label: string;
  short: string;
  desc: string;
  preModel: boolean;
  times: Record<Role, number>;
}

const PHASES: Phase[] = [
  {
    label: "Business Understanding",
    short: "Business",
    desc: "Frame the question, define success metrics, align stakeholders.",
    preModel: true,
    times: { analyst: 22, engineer: 10, researcher: 18 },
  },
  {
    label: "Data Collection",
    short: "Collect",
    desc: "Source, access, and document raw data. Often the biggest time sink.",
    preModel: true,
    times: { analyst: 18, engineer: 20, researcher: 22 },
  },
  {
    label: "Data Cleaning",
    short: "Clean",
    desc: "Handle missing values, outliers, schema mismatches, deduplication.",
    preModel: true,
    times: { analyst: 25, engineer: 22, researcher: 16 },
  },
  {
    label: "Exploratory Analysis",
    short: "EDA",
    desc: "Visualize distributions, correlations, and spot data quality issues.",
    preModel: true,
    times: { analyst: 20, engineer: 12, researcher: 20 },
  },
  {
    label: "Modeling",
    short: "Model",
    desc: "Feature engineering, model selection, training, and tuning.",
    preModel: false,
    times: { analyst: 8, engineer: 22, researcher: 14 },
  },
  {
    label: "Evaluate & Deploy",
    short: "Deploy",
    desc: "Validate results, deploy to production, monitor drift.",
    preModel: false,
    times: { analyst: 7, engineer: 14, researcher: 10 },
  },
];

const ROLE_LABELS: Record<Role, string> = {
  analyst: "Data Analyst",
  engineer: "ML Engineer",
  researcher: "DS Researcher",
};

const ROLE_COLORS: Record<Role, string> = {
  analyst: "var(--brand-cyan)",
  engineer: "var(--brand-violet)",
  researcher: "var(--brand-pink)",
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const a = toRad(deg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function pieSlicePath(cx: number, cy: number, r: number, ri: number, startDeg: number, endDeg: number) {
  const o = arcPoint(cx, cy, r, startDeg);
  const i = arcPoint(cx, cy, r, endDeg);
  const oi = arcPoint(cx, cy, ri, startDeg);
  const ii = arcPoint(cx, cy, ri, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${oi.x.toFixed(1)} ${oi.y.toFixed(1)}`,
    `L ${o.x.toFixed(1)} ${o.y.toFixed(1)}`,
    `A ${r} ${r} 0 ${large} 1 ${i.x.toFixed(1)} ${i.y.toFixed(1)}`,
    `L ${ii.x.toFixed(1)} ${ii.y.toFixed(1)}`,
    `A ${ri} ${ri} 0 ${large} 0 ${oi.x.toFixed(1)} ${oi.y.toFixed(1)}`,
    "Z",
  ].join(" ");
}

export default function Viz() {
  const [role, setRole] = useState<Role>("analyst");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [spin, setSpin] = useState(false);
  const [spinStep, setSpinStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const total = PHASES.reduce((s, p) => s + p.times[role], 0);
  const preTotal = PHASES.filter((p) => p.preModel).reduce((s, p) => s + p.times[role], 0);
  const prePct = Math.round((preTotal / total) * 100);

  const sliceAngles: { start: number; end: number }[] = [];
  let cursor = -90;
  for (const p of PHASES) {
    const sweep = (p.times[role] / total) * 360;
    sliceAngles.push({ start: cursor, end: cursor + sweep });
    cursor += sweep;
  }

  const activePhase = activeIdx !== null ? PHASES[activeIdx] : null;
  const accentColor = ROLE_COLORS[role];

  return (
    <VizFrame
      title="The Data Science Lifecycle"
      hint="Click a phase to explore; switch roles to see how time shifts"
      controls={
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Role</div>
            <div className="flex flex-col gap-1.5">
              {(["analyst", "engineer", "researcher"] as Role[]).map((r) => (
                <SegButton key={r} active={role === r} onClick={() => setRole(r)}>
                  {ROLE_LABELS[r]}
                </SegButton>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Time before modeling</div>
            <div className="text-2xl font-bold" style={{ color: accentColor }}>
              {prePct}%
            </div>
            <div className="text-xs text-muted-foreground">
              {activePhase
                ? `${activePhase.label}: ${activePhase.times[role]}% of time`
                : "Click a phase to inspect"}
            </div>
          </div>

          {activePhase && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1">
              <div className="text-xs font-semibold text-foreground">{activePhase.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{activePhase.desc}</div>
            </div>
          )}

          <VizButton
            onClick={() => {
              timers.current.forEach(clearTimeout);
              timers.current = [];
              setSpin(true);
              setSpinStep(0);
              range(PHASES.length).forEach((i) => {
                timers.current.push(
                  setTimeout(() => {
                    setSpinStep(i);
                    setActiveIdx(i);
                    if (i === PHASES.length - 1) setSpin(false);
                  }, i * 500),
                );
              });
            }}
          >
            <RotateCcw size={13} />
            {spin ? "Running…" : "Walk the loop"}
          </VizButton>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* pre-model background arc */}
        <circle cx={CX} cy={CY} r={RI - 6} fill="var(--card)" />

        {/* donut slices */}
        {PHASES.map((phase, i) => {
          const { start, end } = sliceAngles[i];
          const isActive = activeIdx === i;
          const isAnimating = spin && spinStep === i;
          const rOuter = isActive || isAnimating ? R + 10 : R;
          const d = pieSlicePath(CX, CY, rOuter, RI, start, end);
          const mid = (start + end) / 2;
          const labelR = R + 20;
          const lp = arcPoint(CX, CY, labelR, mid);
          const textAnchor = lp.x > CX + 10 ? "start" : lp.x < CX - 10 ? "end" : "middle";
          return (
            <g key={phase.short} style={{ cursor: "pointer" }} onClick={() => setActiveIdx(isActive ? null : i)}>
              <path
                d={d}
                fill={phase.preModel ? accentColor : "var(--brand-indigo)"}
                opacity={activeIdx === null || isActive ? (phase.preModel ? 0.85 : 0.6) : 0.3}
                stroke="var(--background)"
                strokeWidth="2"
                style={{ transition: "opacity 0.2s, d 0.2s" }}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="9.5"
                fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
                fontWeight={isActive ? "700" : "400"}
              >
                {phase.short}
              </text>
            </g>
          );
        })}

        {/* center label */}
        <text x={CX} y={CY - 10} textAnchor="middle" fontSize="22" fontWeight="800" fill={accentColor}>
          {prePct}%
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          pre-model
        </text>
        <text x={CX} y={CY + 23} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          work
        </text>

        {/* legend */}
        <rect x={CX - 52} y={CY + 48} width={10} height={10} rx="2" fill={accentColor} opacity="0.85" />
        <text x={CX - 38} y={CY + 57} fontSize="9" fill="var(--muted-foreground)">Pre-model phases</text>
        <rect x={CX - 52} y={CY + 64} width={10} height={10} rx="2" fill="var(--brand-indigo)" opacity="0.6" />
        <text x={CX - 38} y={CY + 73} fontSize="9" fill="var(--muted-foreground)">Model + deploy</text>

        {/* right panel: time bar chart */}
        {(() => {
          const BX = 350, BY = 30, BW = 260, BROW = 36;
          return (
            <g>
              <text x={BX} y={BY - 10} fontSize="10" fontWeight="600" fill="var(--foreground)">
                Time per phase — {ROLE_LABELS[role]}
              </text>
              {PHASES.map((phase, i) => {
                const pct = phase.times[role];
                const bw = (pct / 28) * BW;
                const isActive = activeIdx === i;
                const fy = BY + i * BROW;
                return (
                  <g key={phase.short} style={{ cursor: "pointer" }} onClick={() => setActiveIdx(isActive ? null : i)}>
                    <text
                      x={BX}
                      y={fy + 11}
                      fontSize="9.5"
                      fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
                      fontWeight={isActive ? "700" : "400"}
                    >
                      {phase.short}
                    </text>
                    <rect
                      x={BX + 62}
                      y={fy}
                      width={Math.max(bw, 3)}
                      height={16}
                      rx="3"
                      fill={phase.preModel ? accentColor : "var(--brand-indigo)"}
                      opacity={isActive ? 1 : 0.55}
                      style={{ transition: "width 0.4s ease" }}
                    />
                    <text
                      x={BX + 62 + Math.max(bw, 3) + 4}
                      y={fy + 11}
                      fontSize="9"
                      fill="var(--muted-foreground)"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}
              {/* 80% annotation line */}
              <line
                x1={BX + 62 + (80 / 28) * BW * 0.35}
                y1={BY - 4}
                x2={BX + 62 + (80 / 28) * BW * 0.35}
                y2={BY + PHASES.length * BROW - 4}
                stroke="var(--warning)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.5"
              />
            </g>
          );
        })()}
      </svg>
    </VizFrame>
  );
}
