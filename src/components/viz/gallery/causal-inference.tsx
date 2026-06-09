"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { range, clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

// ─── Layout ──────────────────────────────────────────────────────────────────
const W = 640, H = 340, PAD = 40;
const N = 80;

// Node positions for DAG: U (confounder), X (treatment), Y (outcome)
const NODES = {
  U: { x: W / 2, y: 55,  label: "U", desc: "Confounder" },
  X: { x: 160,  y: 195, label: "X", desc: "Treatment" },
  Y: { x: W - 160, y: 195, label: "Y", desc: "Outcome" },
};

// Arrow helpers
function arrowPath(
  x1: number, y1: number, x2: number, y2: number, r = 26
): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * r, sy = y1 + uy * r;
  const ex = x2 - ux * r, ey = y2 - uy * r;
  return `M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`;
}

// Scatter axes (bottom half of svg)
const SY = 215, SH = 105;
const sx = (v: number) => PAD + clamp((v - 0) / 10, 0, 1) * (W - 2 * PAD);
const sy = (v: number) => SY + SH - clamp((v - 0) / 10, 0, 1) * SH;

// ─── Types ────────────────────────────────────────────────────────────────────
type Rung = "association" | "intervention" | "counterfactual";

interface Point { x: number; y: number; xCF: number; tier: number }

// ─── Component ────────────────────────────────────────────────────────────────
export default function Viz() {
  const [rung, setRung]           = useState<Rung>("association");
  const [causalEffect, setCausal] = useState(3.5);
  const [confoundStr, setConf]    = useState(2.5);
  const [seed, setSeed]           = useState(42);

  const pts: Point[] = useMemo(() => {
    const rand = rng(seed);
    return range(N).map((i) => {
      const tier = Math.floor(i / (N / 3)); // 0/1/2 for colouring
      const u  = gaussian(rand, 4, 1.2);          // confounder
      // X is influenced by confounder
      const x  = clamp(u * (confoundStr / 5) * 2.2 + gaussian(rand, 2, 1.0), 0.5, 9.5);
      // Y is influenced by X (causal) + confounder
      const y  = clamp(
        causalEffect * (x / 10) * 3
          + confoundStr * (u / 5) * 2
          + gaussian(rand, 1, 0.7),
        0.2, 9.8
      );
      // Counterfactual: what if X had been the mean (5)?
      const xCF = clamp(
        causalEffect * (5 / 10) * 3
          + confoundStr * (u / 5) * 2
          + gaussian(rand, 1, 0.7),
        0.2, 9.8
      );
      return { x, y, xCF, tier };
    });
  }, [seed, causalEffect, confoundStr]);

  // Observational: raw correlation ≈ causal + confound signal
  // Interventional: do(X=5) → mean Y under do-operator (blocks backdoor)
  const obsSlope = useMemo(() => {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const mx = xs.reduce((a,b)=>a+b,0)/N, my = ys.reduce((a,b)=>a+b,0)/N;
    const num = xs.reduce((s,x,i) => s+(x-mx)*(ys[i]-my), 0);
    const den = xs.reduce((s,x) => s+(x-mx)**2, 0) || 1;
    return num/den;
  }, [pts]);

  const doMeanY  = useMemo(() => pts.map(p => p.xCF).reduce((a,b)=>a+b,0)/N, [pts]);
  const obsMeanY = useMemo(() => pts.map(p => p.y).reduce((a,b)=>a+b,0)/N, [pts]);
  const cfDelta  = (doMeanY - obsMeanY).toFixed(2);

  const cutEdgeUX = rung === "intervention" || rung === "counterfactual";

  const nodeColors: Record<string, string> = {
    U: "var(--brand-indigo)",
    X: rung === "counterfactual" ? "var(--brand-pink)" : "var(--brand-violet)",
    Y: "var(--success)",
  };

  const RUNG_LABELS: Record<Rung, string> = {
    association:    "Observe (P(Y|X))",
    intervention:   "Intervene (P(Y|do(X)))",
    counterfactual: "Counterfactual (P(Yₓ))",
  };

  return (
    <VizFrame
      title="Causal Inference"
      hint="switch rungs of the ladder to see causation vs. correlation"
      controls={
        <ControlGroup>
          <Slider
            label="Causal effect X→Y"
            min={0} max={6} step={0.1}
            value={causalEffect}
            onChange={setCausal}
            format={(v) => v.toFixed(1)}
          />
          <Slider
            label="Confounder strength U"
            min={0} max={5} step={0.1}
            value={confoundStr}
            onChange={setConf}
            format={(v) => v.toFixed(1)}
          />
        </ControlGroup>
      }
    >
      {/* Rung selector */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(["association","intervention","counterfactual"] as Rung[]).map((r) => (
          <SegButton key={r} active={rung === r} onClick={() => setRung(r)}>
            {r === "association" ? "① Observe" : r === "intervention" ? "② Intervene" : "③ Counterfactual"}
          </SegButton>
        ))}
        <VizButton onClick={() => setSeed(s => s + 1)} className="ml-auto">
          <RotateCcw size={12}/> Resample
        </VizButton>
      </div>

      {/* Live readout */}
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          obs slope ={" "}
          <span className="font-mono font-semibold" style={{ color: "var(--brand-cyan)" }}>
            {obsSlope.toFixed(2)}
          </span>
        </span>
        <span>
          {RUNG_LABELS[rung]}
        </span>
        {rung === "counterfactual" && (
          <span>
            E[Y<sub>x=5</sub> − Y] ={" "}
            <span className="font-mono font-semibold" style={{ color: parseFloat(cfDelta) > 0 ? "var(--brand-pink)" : "var(--success)" }}>
              {cfDelta}
            </span>
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="var(--muted-foreground)" />
          </marker>
          <marker id="arr-cut" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="var(--border)" />
          </marker>
          <marker id="arr-cf" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="var(--brand-pink)" />
          </marker>
        </defs>

        {/* ── DAG edges ── */}
        {/* U→X (backdoor path — cut when intervening) */}
        <path
          d={arrowPath(NODES.U.x, NODES.U.y, NODES.X.x, NODES.X.y)}
          stroke={cutEdgeUX ? "var(--border)" : "var(--muted-foreground)"}
          strokeWidth={cutEdgeUX ? 1.5 : 2.5}
          strokeDasharray={cutEdgeUX ? "5,4" : undefined}
          fill="none"
          markerEnd={cutEdgeUX ? "url(#arr-cut)" : "url(#arr)"}
          opacity={cutEdgeUX ? 0.35 : 0.85}
        />

        {/* U→Y (always present) */}
        <path
          d={arrowPath(NODES.U.x, NODES.U.y, NODES.Y.x, NODES.Y.y)}
          stroke="var(--muted-foreground)"
          strokeWidth="2.5"
          fill="none"
          markerEnd="url(#arr)"
          opacity="0.85"
        />

        {/* X→Y (causal edge) */}
        <path
          d={arrowPath(NODES.X.x, NODES.X.y, NODES.Y.x, NODES.Y.y)}
          stroke={rung === "counterfactual" ? "var(--brand-pink)" : "var(--brand-violet)"}
          strokeWidth="3"
          fill="none"
          markerEnd={rung === "counterfactual" ? "url(#arr-cf)" : "url(#arr)"}
          opacity="0.9"
        />

        {/* Cut mark on U→X when intervening */}
        {cutEdgeUX && (() => {
          const mx = (NODES.U.x + NODES.X.x) / 2 + 4;
          const my = (NODES.U.y + NODES.X.y) / 2 - 4;
          return (
            <g transform={`translate(${mx},${my}) rotate(-35)`}>
              <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--brand-pink)" strokeWidth="2.5"/>
              <line x1="-8" y1="-6" x2="8" y2="6" stroke="var(--brand-pink)" strokeWidth="2.5"/>
            </g>
          );
        })()}

        {/* ── DAG Nodes ── */}
        {(["U","X","Y"] as const).map((k) => {
          const n = NODES[k];
          return (
            <g key={k}>
              <circle cx={n.x} cy={n.y} r={26} fill={nodeColors[k]} opacity="0.18"/>
              <circle cx={n.x} cy={n.y} r={26} fill="none" stroke={nodeColors[k]} strokeWidth="2.2"/>
              <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="15" fontWeight="700" fill={nodeColors[k]}>{n.label}</text>
              <text x={n.x} y={n.y + 36} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
                {n.desc}
              </text>
            </g>
          );
        })}

        {/* ── Separator ── */}
        <line x1={PAD} y1={SY - 10} x2={W - PAD} y2={SY - 10} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4,4"/>

        {/* ── Scatter ── */}
        {/* Axes */}
        <line x1={PAD} y1={SY + SH} x2={W - PAD} y2={SY + SH} stroke="var(--border)" strokeWidth="1"/>
        <line x1={PAD} y1={SY} x2={PAD} y2={SY + SH} stroke="var(--border)" strokeWidth="1"/>

        {/* Axis labels */}
        <text x={W/2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">Treatment X</text>
        <text x={14} y={SY + SH/2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90,14,${SY + SH/2})`}>Outcome Y</text>

        {/* Points */}
        {pts.map((p, i) => {
          const yVal = rung === "counterfactual" ? p.xCF : p.y;
          const xVal = rung === "intervention" ? 5 : p.x;
          return (
            <circle key={i}
              cx={sx(xVal)} cy={sy(yVal)}
              r={rung === "intervention" ? 3.5 : 3}
              fill={rung === "counterfactual" ? "var(--brand-pink)" : rung === "intervention" ? "var(--brand-violet)" : "var(--brand-cyan)"}
              stroke="var(--background)" strokeWidth="0.6"
              opacity="0.72"
            />
          );
        })}

        {/* OLS trend line (observational) */}
        {rung === "association" && (() => {
          const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
          const mx = xs.reduce((a,b)=>a+b,0)/N, my = ys.reduce((a,b)=>a+b,0)/N;
          const b1 = obsSlope, b0 = my - b1 * mx;
          return (
            <line
              x1={sx(0.5)} y1={sy(b0 + b1 * 0.5)}
              x2={sx(9.5)} y2={sy(b0 + b1 * 9.5)}
              stroke="var(--brand-cyan)" strokeWidth="2" opacity="0.8"
            />
          );
        })()}

        {/* Intervention: vertical line at X=5 */}
        {rung === "intervention" && (
          <line
            x1={sx(5)} y1={SY} x2={sx(5)} y2={SY + SH}
            stroke="var(--brand-violet)" strokeWidth="2" strokeDasharray="5,3" opacity="0.85"
          />
        )}

        {/* Counterfactual: horizontal mean line */}
        {rung === "counterfactual" && (
          <line
            x1={PAD} y1={sy(doMeanY)} x2={W - PAD} y2={sy(doMeanY)}
            stroke="var(--brand-pink)" strokeWidth="2" strokeDasharray="5,3" opacity="0.85"
          />
        )}
      </svg>

      <p className="mt-2 text-xs text-muted-foreground">
        {rung === "association"
          ? `Rung 1: observing. Slope ${obsSlope.toFixed(2)} mixes causal effect + confounding from U. High U→X and U→Y means X and Y co-move even if X doesn't cause Y.`
          : rung === "intervention"
          ? "Rung 2: do(X=5) — Pearl's do-operator cuts the backdoor path U→X, isolating the true causal effect. Points stack at X=5."
          : `Rung 3: counterfactual — 'What would Y have been if X had been 5 instead?' Shift ΔY = ${cfDelta}. Requires a structural model, not just data.`}
      </p>
    </VizFrame>
  );
}
