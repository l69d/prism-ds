"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 620, H = 320, PAD = 44;
const N = 90;

type Mechanism = "MCAR" | "MAR" | "MNAR";
type View = "all" | "observed" | "imputed";

function sx(v: number) { return PAD + ((v - 0) / 10) * (W - 2 * PAD); }
function sy(v: number) { return H - PAD - ((v - 20) / 80) * (H - 2 * PAD); }

export default function Viz() {
  const [mechanism, setMechanism] = useState<Mechanism>("MCAR");
  const [missRate, setMissRate] = useState(0.4);
  const [view, setView] = useState<View>("observed");
  const [seed, setSeed] = useState(42);

  const { points, trueMean, obsMean, impMean } = useMemo(() => {
    const rand = rng(seed);
    const pts: { x: number; y: number; missing: boolean }[] = [];

    for (let i = 0; i < N; i++) {
      const x = clamp(gaussian(rand, 5, 1.8), 0.5, 10);
      const y = clamp(10 + 7 * x + gaussian(rand, 0, 8), 22, 98);
      pts.push({ x, y, missing: false });
    }

    const r2 = rng(seed + 1000);
    pts.forEach((p) => {
      let probMiss: number;
      if (mechanism === "MCAR") {
        probMiss = missRate;
      } else if (mechanism === "MAR") {
        // Low study hours → more likely to have missing score
        const normX = clamp((10 - p.x) / 10, 0, 1);
        probMiss = missRate * (0.3 + 1.4 * normX);
      } else {
        // MNAR: low scores → more likely to be missing
        const normY = clamp((60 - p.y) / 40, 0, 1);
        probMiss = missRate * (0.2 + 1.6 * normY);
      }
      p.missing = r2() < clamp(probMiss, 0, 0.97);
    });

    const allY = pts.map((p) => p.y);
    const obsY = pts.filter((p) => !p.missing).map((p) => p.y);
    const tMean = mean(allY);
    const oMean = mean(obsY);
    const iMean = oMean; // mean imputation doesn't change mean of observed

    return { points: pts, trueMean: tMean, obsMean: oMean, impMean: iMean };
  }, [seed, mechanism, missRate]);

  const missingCount = points.filter((p) => p.missing).length;
  const bias = obsMean - trueMean;

  const mechanismDesc: Record<Mechanism, string> = {
    MCAR: "Missing Completely At Random — missingness is independent of any value. Safe to use complete-case analysis.",
    MAR: "Missing At Random — missingness depends on observed X (study hours), not on score itself. Imputation is valid.",
    MNAR: "Missing Not At Random — low scorers don't report. Any simple imputation will overestimate performance.",
  };

  return (
    <VizFrame
      title="Missing Data Mechanisms"
      hint="Switch mechanism to see which points vanish and how the mean shifts"
      controls={
        <div className="space-y-4">
          <Slider
            label="Missingness rate"
            min={0.05} max={0.7} step={0.05}
            value={missRate}
            onChange={setMissRate}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <ControlGroup>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">True mean score</div>
              <div className="font-mono text-sm text-foreground">{trueMean.toFixed(1)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Observed mean</div>
              <div
                className="font-mono text-sm"
                style={{ color: Math.abs(bias) < 1.5 ? "var(--success)" : Math.abs(bias) < 4 ? "var(--warning)" : "var(--danger)" }}
              >
                {obsMean.toFixed(1)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Bias (obs − true)</div>
              <div
                className="font-mono text-sm font-bold"
                style={{ color: Math.abs(bias) < 1.5 ? "var(--success)" : Math.abs(bias) < 4 ? "var(--warning)" : "var(--danger)" }}
              >
                {bias > 0 ? "+" : ""}{bias.toFixed(1)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Missing</div>
              <div className="font-mono text-sm text-foreground">{missingCount}/{N}</div>
            </div>
          </ControlGroup>
          <p className="text-xs text-muted-foreground leading-relaxed">{mechanismDesc[mechanism]}</p>
          <VizButton onClick={() => setSeed((s) => s + 1)}><RotateCcw size={12} /> New sample</VizButton>
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {(["MCAR", "MAR", "MNAR"] as Mechanism[]).map((m) => (
          <SegButton key={m} active={mechanism === m} onClick={() => setMechanism(m)}>{m}</SegButton>
        ))}
        <div className="flex-1" />
        {(["all", "observed", "imputed"] as View[]).map((v) => (
          <SegButton key={v} active={view === v} onClick={() => setView(v)}>
            {v === "all" ? "All data" : v === "observed" ? "Observed" : "Mean imputed"}
          </SegButton>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* Axis labels */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">Study Hours</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90,10,${H / 2})`}>Score</text>

        {/* X tick marks */}
        {[0, 2, 4, 6, 8, 10].map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={H - PAD} x2={sx(v)} y2={H - PAD + 4} stroke="var(--border)" />
            <text x={sx(v)} y={H - PAD + 13} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}

        {/* Y tick marks */}
        {[20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={PAD - 4} y1={sy(v)} x2={PAD} y2={sy(v)} stroke="var(--border)" />
            <text x={PAD - 8} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}

        {/* True mean line */}
        <line
          x1={PAD} y1={sy(trueMean)} x2={W - PAD} y2={sy(trueMean)}
          stroke="var(--success)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8"
        />
        <text x={W - PAD + 4} y={sy(trueMean) + 4} fontSize="9" fill="var(--success)">true μ</text>

        {/* Observed / imputed mean line */}
        {view !== "all" && (
          <>
            <line
              x1={PAD} y1={sy(obsMean)} x2={W - PAD} y2={sy(obsMean)}
              stroke="var(--brand-cyan)" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.9"
            />
            <text x={W - PAD + 4} y={sy(obsMean) + 4} fontSize="9" fill="var(--brand-cyan)">obs μ</text>
          </>
        )}

        {/* Data points */}
        {points.map((p, i) => {
          if (view === "observed" && p.missing) return null;
          const cx = sx(p.x);
          const cy = view === "imputed" && p.missing ? sy(impMean) : sy(p.y);
          const isImputedPt = view === "imputed" && p.missing;
          const fill = p.missing
            ? isImputedPt ? "var(--brand-cyan)" : "none"
            : "var(--brand-cyan)";
          const stroke = p.missing
            ? isImputedPt ? "var(--background)" : "var(--muted-foreground)"
            : "var(--background)";
          const opacity = p.missing ? (isImputedPt ? 0.75 : 0.18) : 0.85;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={isImputedPt ? 3.5 : 4}
              fill={fill} stroke={stroke} strokeWidth="1"
              opacity={opacity}
            />
          );
        })}

        {/* Ghost points in "all" mode */}
        {view === "all" && points.filter((p) => p.missing).map((p, i) => (
          <circle
            key={`ghost-${i}`}
            cx={sx(p.x)} cy={sy(p.y)} r={4}
            fill="none" stroke="var(--brand-pink)" strokeWidth="1.5"
            opacity={0.55}
          />
        ))}

        {/* Legend for all mode */}
        {view === "all" && (
          <g>
            <circle cx={PAD + 8} cy={PAD / 2 - 2} r={4} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1" opacity="0.85" />
            <text x={PAD + 16} y={PAD / 2 + 2} fontSize="9" fill="var(--muted-foreground)">observed</text>
            <circle cx={PAD + 80} cy={PAD / 2 - 2} r={4} fill="none" stroke="var(--brand-pink)" strokeWidth="1.5" opacity="0.8" />
            <text x={PAD + 88} y={PAD / 2 + 2} fontSize="9" fill="var(--muted-foreground)">missing</text>
          </g>
        )}
      </svg>
    </VizFrame>
  );
}
