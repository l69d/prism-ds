"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, pearson } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 620, H = 310, PAD = 44;
const N = 100;

const TIER_COLORS = ["var(--brand-indigo)", "var(--brand-cyan)", "var(--brand-pink)"];
const TIER_LABELS = ["Low", "Mid", "High"];

function scaleX(v: number, lo: number, hi: number) {
  return PAD + ((v - lo) / (hi - lo)) * (W - 2 * PAD);
}
function scaleY(v: number, lo: number, hi: number) {
  return H - PAD - ((v - lo) / (hi - lo)) * (H - 2 * PAD);
}
function regLine(xs: number[], ys: number[]): [number, number] {
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const denom = xs.reduce((s, x) => s + (x - mx) ** 2, 0) || 1e-9;
  const b1 = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / denom;
  return [my - b1 * mx, b1];
}

export default function Viz() {
  const [mode, setMode] = useState<"confounder" | "collider">("confounder");
  const [confStrength, setConfStrength] = useState(2.0);
  const [showGroups, setShowGroups] = useState(false);
  const [conditioned, setConditioned] = useState(false);
  const [seed, setSeed] = useState(17);

  // ── Confounder data ──────────────────────────────────────────────────────────
  const confData = useMemo(() => {
    const rand = rng(seed);
    return range(N).map((i) => {
      const tier = Math.floor(i / (N / 3));
      const z = -2 + tier * 2 + gaussian(rand, 0, 0.5); // confounder Z
      const x = z * confStrength + gaussian(rand, 0, 1);
      const y = z * confStrength + gaussian(rand, 0, 1);
      return { x, y, tier };
    });
  }, [seed, confStrength]);

  const confRAll = pearson(confData.map((p) => p.x), confData.map((p) => p.y));
  const confRWithin = [0, 1, 2].map((t) => {
    const sub = confData.filter((p) => p.tier === t);
    return pearson(sub.map((p) => p.x), sub.map((p) => p.y));
  });
  const confAvgWithin = confRWithin.reduce((a, b) => a + b, 0) / 3;

  // ── Collider data ────────────────────────────────────────────────────────────
  // X and Y are independent. Collider C = X + Y + noise.
  // Conditioning on "high C" (top 40%) makes X and Y negatively correlated.
  const collData = useMemo(() => {
    const rand = rng(seed + 500);
    return range(N).map(() => {
      const x = gaussian(rand, 0, 1);
      const y = gaussian(rand, 0, 1);
      const c = x + y + gaussian(rand, 0, 0.6);
      return { x, y, c };
    });
  }, [seed]);

  const threshold = useMemo(() => {
    const sorted = [...collData.map((p) => p.c)].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.6)]; // top 40%
  }, [collData]);

  const visible = conditioned ? collData.filter((p) => p.c >= threshold) : collData;
  const collR = pearson(visible.map((p) => p.x), visible.map((p) => p.y));

  // Axis bounds
  const allX = mode === "confounder" ? confData.map((p) => p.x) : collData.map((p) => p.x);
  const allY = mode === "confounder" ? confData.map((p) => p.y) : collData.map((p) => p.y);
  const xLo = Math.min(...allX) - 0.5, xHi = Math.max(...allX) + 0.5;
  const yLo = Math.min(...allY) - 0.5, yHi = Math.max(...allY) + 0.5;
  const sx = (v: number) => scaleX(v, xLo, xHi);
  const sy = (v: number) => scaleY(v, yLo, yHi);

  return (
    <VizFrame
      title="Confounding & Bias"
      hint={mode === "confounder" ? "reveal groups to see the confounder collapse r" : "condition on the collider to create a fake negative r"}
      controls={
        <div className="space-y-3">
          {mode === "confounder" ? (
            <Slider
              label="Confounder strength"
              min={0.5} max={3.5} step={0.1}
              value={confStrength}
              onChange={setConfStrength}
              format={(v) => v.toFixed(1)}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              X and Y are generated independently. A collider C absorbs both.
              Select on C (top 40%) to induce a spurious correlation.
            </p>
          )}
          <ControlGroup>
            {mode === "confounder" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">View</span>
                <div className="flex gap-1.5">
                  <SegButton active={!showGroups} onClick={() => setShowGroups(false)}>Marginal</SegButton>
                  <SegButton active={showGroups} onClick={() => setShowGroups(true)}>Stratified</SegButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Sample</span>
                <div className="flex gap-1.5">
                  <SegButton active={!conditioned} onClick={() => setConditioned(false)}>All data</SegButton>
                  <SegButton active={conditioned} onClick={() => setConditioned(true)}>High C only</SegButton>
                </div>
              </div>
            )}
            <div className="flex items-end">
              <VizButton onClick={() => setSeed((s) => s + 1)}>
                <RotateCcw size={12} /> Resample
              </VizButton>
            </div>
          </ControlGroup>

          {/* Live readouts */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {mode === "confounder" ? (
              <>
                <span>
                  Overall r ={" "}
                  <span className="font-mono font-semibold" style={{ color: "var(--brand-cyan)" }}>
                    {confRAll.toFixed(2)}
                  </span>
                </span>
                {showGroups && (
                  <span>
                    Avg within-group r ={" "}
                    <span
                      className="font-mono font-semibold"
                      style={{ color: Math.abs(confAvgWithin) < 0.3 ? "var(--success)" : "var(--warning)" }}
                    >
                      {confAvgWithin.toFixed(2)}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span>
                r ({conditioned ? "selected" : "all"}) ={" "}
                <span
                  className="font-mono font-semibold"
                  style={{ color: conditioned ? "var(--brand-pink)" : "var(--brand-cyan)" }}
                >
                  {collR.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        </div>
      }
    >
      {/* Mode toggle */}
      <div className="mb-3 flex gap-1.5">
        <SegButton active={mode === "confounder"} onClick={() => { setMode("confounder"); setShowGroups(false); }}>
          Confounder
        </SegButton>
        <SegButton active={mode === "collider"} onClick={() => { setMode("collider"); setConditioned(false); }}>
          Collider bias
        </SegButton>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        {/* Grid lines */}
        {[-2, 0, 2].map((v) => (
          <g key={v}>
            {v >= xLo && v <= xHi && <line x1={sx(v)} y1={PAD} x2={sx(v)} y2={H - PAD} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="3,3" />}
            {v >= yLo && v <= yHi && <line x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="3,3" />}
          </g>
        ))}
        {/* Axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">X</text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" transform={`rotate(-90,12,${H / 2})`}>Y</text>

        {mode === "confounder" ? (
          <>
            {/* Overall trend line */}
            {(() => {
              const xs = confData.map((p) => p.x), ys = confData.map((p) => p.y);
              const [b0, b1] = regLine(xs, ys);
              return (
                <line
                  x1={sx(xLo)} y1={sy(b0 + b1 * xLo)}
                  x2={sx(xHi)} y2={sy(b0 + b1 * xHi)}
                  stroke={showGroups ? "var(--border)" : "var(--brand-violet)"}
                  strokeWidth={showGroups ? 1 : 2.5}
                  strokeDasharray={showGroups ? "5,4" : undefined}
                  opacity="0.85"
                />
              );
            })()}
            {/* Per-group trend lines */}
            {showGroups && [0, 1, 2].map((t) => {
              const sub = confData.filter((p) => p.tier === t);
              const xs = sub.map((p) => p.x), ys = sub.map((p) => p.y);
              const [b0, b1] = regLine(xs, ys);
              const gxLo = Math.min(...xs) - 0.2, gxHi = Math.max(...xs) + 0.2;
              return (
                <line key={t}
                  x1={sx(gxLo)} y1={sy(b0 + b1 * gxLo)}
                  x2={sx(gxHi)} y2={sy(b0 + b1 * gxHi)}
                  stroke={TIER_COLORS[t]} strokeWidth="2" opacity="0.9"
                />
              );
            })}
            {/* Dots */}
            {confData.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.5}
                fill={showGroups ? TIER_COLORS[p.tier] : "var(--brand-violet)"}
                stroke="var(--background)" strokeWidth="0.8" opacity="0.82"
              />
            ))}
            {/* Legend */}
            {showGroups && TIER_LABELS.map((lbl, i) => (
              <g key={i} transform={`translate(${W - PAD - 80},${PAD + i * 18})`}>
                <circle cx={6} cy={5} r={5} fill={TIER_COLORS[i]} />
                <text x={15} y={9} fontSize="10" fill="var(--muted-foreground)">{lbl} Z</text>
              </g>
            ))}
          </>
        ) : (
          <>
            {/* Collider regime: show faded dim points when conditioned */}
            {conditioned && collData.filter((p) => p.c < threshold).map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3}
                fill="var(--muted-foreground)" stroke="none" opacity="0.18"
              />
            ))}
            {/* Trend line */}
            {(() => {
              const xs = visible.map((p) => p.x), ys = visible.map((p) => p.y);
              const [b0, b1] = regLine(xs, ys);
              return (
                <line
                  x1={sx(xLo)} y1={sy(b0 + b1 * xLo)}
                  x2={sx(xHi)} y2={sy(b0 + b1 * xHi)}
                  stroke={conditioned ? "var(--brand-pink)" : "var(--brand-violet)"}
                  strokeWidth="2.5" opacity="0.85"
                />
              );
            })()}
            {/* Active points */}
            {visible.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3.5}
                fill={conditioned ? "var(--brand-pink)" : "var(--brand-violet)"}
                stroke="var(--background)" strokeWidth="0.8" opacity="0.85"
              />
            ))}
            {/* Collider label */}
            <text x={W - PAD - 4} y={PAD + 12} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {conditioned ? `n = ${visible.length} (high C selected)` : `n = ${visible.length}`}
            </text>
          </>
        )}
      </svg>

      <p className="mt-2 text-xs text-muted-foreground">
        {mode === "confounder"
          ? showGroups
            ? `Stratifying by confounder Z collapses r to ≈ ${confAvgWithin.toFixed(2)}. The marginal r = ${confRAll.toFixed(2)} was driven entirely by Z — not a causal link.`
            : `Marginal r = ${confRAll.toFixed(2)}. Looks causal — but Z drives both X and Y. Switch to Stratified view to see the confounder at work.`
          : conditioned
          ? `Conditioning on high-C induces r = ${collR.toFixed(2)}. X and Y are independent — you created a spurious correlation by selecting on their common effect.`
          : `X and Y are independent: r ≈ ${collR.toFixed(2)}. Select only high-C observations (a collider) to see a fake correlation appear.`}
      </p>
    </VizFrame>
  );
}
