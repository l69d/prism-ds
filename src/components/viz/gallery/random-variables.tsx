"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 620, H = 320, PAD = 40;
const OUTCOMES = [1, 2, 3, 4, 5, 6];

type Mode = "custom" | "fair" | "loaded";

const PRESETS: Record<Exclude<Mode, "custom">, number[]> = {
  fair: [1, 1, 1, 1, 1, 1],
  loaded: [1, 1, 1, 1, 2, 6],
};

export default function Viz() {
  const [mode, setMode] = useState<Mode>("fair");
  const [weights, setWeights] = useState<number[]>([1, 1, 1, 1, 1, 1]);

  const activeWeights = mode === "custom" ? weights : PRESETS[mode];

  const { probs, expectation, variance, stddev } = useMemo(() => {
    const total = activeWeights.reduce((a, b) => a + b, 0);
    const probs = activeWeights.map((w) => w / total);
    const expectation = OUTCOMES.reduce((acc, x, i) => acc + x * probs[i], 0);
    const variance = OUTCOMES.reduce((acc, x, i) => acc + probs[i] * (x - expectation) ** 2, 0);
    return { probs, expectation, variance, stddev: Math.sqrt(variance) };
  }, [activeWeights]);

  const xMin = 0.5, xMax = 6.5, yMin = 0, yMax = 0.55;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - 28 - ((v - yMin) / (yMax - yMin)) * (H - PAD - 28 - 24);

  const beamY = H - PAD - 4;
  const fulcrumX = sx(expectation);

  // ±1σ region
  const sdLeft = Math.max(xMin, expectation - stddev);
  const sdRight = Math.min(xMax, expectation + stddev);

  return (
    <VizFrame
      title="Random Variables & Expectation"
      hint="Adjust outcome weights — watch the balance point shift"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {(["fair", "loaded", "custom"] as Mode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => {
                setMode(m);
                if (m !== "custom") setWeights([...PRESETS[m]]);
              }}>
                {m === "fair" ? "Fair Die" : m === "loaded" ? "Loaded Die" : "Custom"}
              </SegButton>
            ))}
          </div>
          {mode === "custom" && (
            <ControlGroup>
              {OUTCOMES.map((x, i) => (
                <Slider
                  key={x}
                  label={`P(X=${x}) weight`}
                  min={1}
                  max={10}
                  step={1}
                  value={weights[i]}
                  onChange={(v) => setWeights((prev) => prev.map((w, j) => (j === i ? v : w)))}
                  format={(v) => v.toFixed(0)}
                />
              ))}
            </ControlGroup>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1 border-t border-border/50 text-xs text-muted-foreground">
            <span>E[X] = <span className="font-mono font-semibold text-[var(--brand-violet)]">{expectation.toFixed(3)}</span></span>
            <span>Var[X] = <span className="font-mono font-semibold text-foreground">{variance.toFixed(3)}</span></span>
            <span>σ = <span className="font-mono font-semibold text-[var(--brand-cyan)]">{stddev.toFixed(3)}</span></span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="rv-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-violet)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--brand-violet)" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* ±1σ shaded band */}
        <rect
          x={sx(sdLeft)} y={24}
          width={sx(sdRight) - sx(sdLeft)}
          height={beamY - 24}
          fill="var(--brand-cyan)"
          opacity={0.07}
        />
        {/* σ bracket lines */}
        <line x1={sx(sdLeft)} y1={30} x2={sx(sdLeft)} y2={beamY - 2} stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <line x1={sx(sdRight)} y1={30} x2={sx(sdRight)} y2={beamY - 2} stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <text x={(sx(sdLeft) + sx(sdRight)) / 2} y={20} textAnchor="middle" fontSize="9" fill="var(--brand-cyan)" opacity="0.8">±1σ</text>

        {/* y-axis gridlines */}
        {[0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
          <line key={v} x1={PAD - 4} y1={sy(v)} x2={W - PAD} y2={sy(v)}
            stroke="var(--border)" strokeWidth="0.8" opacity="0.5" />
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
          <text key={v} x={PAD - 7} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{v.toFixed(1)}</text>
        ))}

        {/* bars */}
        {OUTCOMES.map((x, i) => {
          const bw = 46;
          const bx = sx(x) - bw / 2;
          const by = sy(probs[i]);
          const bh = beamY - by;
          return (
            <g key={x}>
              <rect x={bx} y={by} width={bw} height={Math.max(0, bh)} rx={4} fill="url(#rv-bar)" />
              <text x={sx(x)} y={by - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--brand-violet)">
                {probs[i].toFixed(2)}
              </text>
              <text x={sx(x)} y={beamY + 15} textAnchor="middle" fontSize="11" fill="var(--foreground)">{x}</text>
            </g>
          );
        })}

        {/* balance beam */}
        <rect x={PAD} y={beamY} width={W - 2 * PAD} height={5} rx={2.5} fill="var(--border)" />

        {/* fulcrum triangle at E[X] */}
        <polygon
          points={`${fulcrumX},${beamY + 5} ${fulcrumX - 12},${beamY + 22} ${fulcrumX + 12},${beamY + 22}`}
          fill="var(--brand-violet)"
        />
        {/* E[X] label on beam */}
        <text x={fulcrumX} y={beamY - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--brand-violet)">
          E[X]={expectation.toFixed(2)}
        </text>
        <line x1={fulcrumX} y1={beamY} x2={fulcrumX} y2={beamY - 6} stroke="var(--brand-violet)" strokeWidth="1.5" />

        {/* x-axis label */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          Outcome (x)
        </text>

        {/* E[X] = Σ x·P(X=x) formula */}
        <text x={W - PAD} y={44} textAnchor="end" fontSize="10" fill="var(--muted-foreground)" fontStyle="italic">
          E[X] = Σ x · P(X=x)
        </text>

        {/* weighted contribution lines (subtle) */}
        {OUTCOMES.map((x, i) => {
          const contribution = x * probs[i];
          const h = ((contribution / expectation) * 18);
          return (
            <rect
              key={`contrib-${x}`}
              x={sx(x) - 6}
              y={beamY - h}
              width={12}
              height={h}
              rx={2}
              fill="var(--brand-pink)"
              opacity={0.35}
            />
          );
        })}

        {/* legend for pink contribution bars */}
        <rect x={PAD} y={H - 48} width={10} height={8} rx={2} fill="var(--brand-pink)" opacity={0.5} />
        <text x={PAD + 14} y={H - 41} fontSize="9" fill="var(--muted-foreground)">x·P(X=x) contribution</text>
      </svg>
    </VizFrame>
  );
}
