"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { linspace, rng } from "@/lib/mathx";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 620, H = 300, PAD = 36;
const EPOCHS = 80;

type RegMode = "none" | "dropout" | "weightdecay" | "batchnorm";

function simulateLossCurves(
  mode: RegMode,
  strength: number,
  seed: number,
): { train: number[]; val: number[] } {
  const rand = rng(seed);
  const train: number[] = [];
  const val: number[] = [];

  // Hyperparams that shape the curve depending on regularization
  const overfit = mode === "none" ? 0.55 : mode === "dropout" ? 0.28 * (1 - strength * 0.7) :
    mode === "weightdecay" ? 0.3 * (1 - strength * 0.8) : 0.15;

  const trainFloor = mode === "dropout" ? 0.09 + strength * 0.06 :
    mode === "weightdecay" ? 0.10 + strength * 0.03 : 0.08;

  const valFloor = trainFloor + overfit * 0.35;

  const noiseScale = mode === "batchnorm" ? 0.012 : 0.022;

  for (let e = 0; e < EPOCHS; e++) {
    const t = (e + 1) / EPOCHS;
    // Train loss: fast early drop, then flattens
    const tBase = trainFloor + (0.95 - trainFloor) * Math.exp(-t * 4.5);
    train.push(clamp(tBase + (rand() - 0.5) * noiseScale, 0.04, 1.0));

    // Val loss: drops but diverges from train due to overfitting
    const gap = overfit * Math.max(0, t - 0.2) * (1 - Math.exp(-t * 3));
    const vBase = valFloor + (0.95 - valFloor) * Math.exp(-t * 3.5) + gap;
    val.push(clamp(vBase + (rand() - 0.5) * noiseScale * 1.3, 0.04, 1.2));
  }
  return { train, val };
}

export default function Viz() {
  const [mode, setMode] = useState<RegMode>("none");
  const [strength, setStrength] = useState(0.5);
  const [epoch, setEpoch] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seed] = useState(42);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { train, val } = useMemo(
    () => simulateLossCurves(mode, strength, seed),
    [mode, strength, seed],
  );

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setEpoch((e) => {
          if (e >= EPOCHS - 1) {
            setPlaying(false);
            return e;
          }
          return e + 1;
        });
      }, 60);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const reset = () => {
    setPlaying(false);
    setEpoch(0);
  };

  const togglePlay = () => {
    if (epoch >= EPOCHS - 1) {
      setEpoch(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const visEpochs = epoch + 1;
  const yMin = 0, yMax = 1.1;
  const sx = (e: number) => PAD + (e / (EPOCHS - 1)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const trainPath = "M" + train.slice(0, visEpochs).map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");
  const valPath = "M" + val.slice(0, visEpochs).map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L");

  // Early stopping suggestion: epoch where val was minimum
  const minValIdx = val.reduce((bi, v, i) => (v < val[bi] ? i : bi), 0);
  const gap = epoch > 0 ? Math.max(0, val[epoch] - train[epoch]) : 0;

  const modeLabel: Record<RegMode, string> = {
    none: "No Regularization",
    dropout: "Dropout",
    weightdecay: "Weight Decay (L2)",
    batchnorm: "Batch Normalization",
  };

  const gapColor = gap > 0.15 ? "var(--danger)" : gap > 0.07 ? "var(--warning)" : "var(--success)";

  const xTicks = linspace(0, EPOCHS - 1, 5).map((v) => Math.round(v));
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <VizFrame
      title="Regularization in Deep Nets"
      hint="play training and watch the val gap shrink"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(["none", "dropout", "weightdecay", "batchnorm"] as RegMode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => { setMode(m); reset(); }}>
                {modeLabel[m]}
              </SegButton>
            ))}
          </div>
          <ControlGroup>
            <Slider
              label={mode === "dropout" ? "Dropout rate" : mode === "weightdecay" ? "L2 λ strength" : "Regularization strength"}
              min={0.1} max={0.9} step={0.05}
              value={strength}
              onChange={(v) => { setStrength(v); reset(); }}
              format={(v) => v.toFixed(2)}
            />
            <div className="flex flex-col justify-end gap-2">
              <div className="flex items-center gap-2">
                <VizButton onClick={togglePlay}>
                  {playing ? <Pause size={13} /> : <Play size={13} />}
                  {playing ? "Pause" : epoch >= EPOCHS - 1 ? "Replay" : "Train"}
                </VizButton>
                <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
              </div>
            </div>
          </ControlGroup>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>epoch <span className="font-mono text-foreground">{epoch + 1}/{EPOCHS}</span></span>
            <span>train loss <span className="font-mono text-foreground">{train[epoch].toFixed(3)}</span></span>
            <span>val loss <span className="font-mono text-foreground">{val[epoch].toFixed(3)}</span></span>
            <span>gap <span className="font-mono font-semibold" style={{ color: gapColor }}>{gap.toFixed(3)}</span></span>
            {mode === "none" && epoch >= minValIdx && (
              <span style={{ color: "var(--brand-indigo)" }}>
                early stop @ epoch {minValIdx + 1}
              </span>
            )}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
            <text x={PAD - 4} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{v.toFixed(2)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={sx(t)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{t}</text>
        ))}

        {/* Axes */}
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" />

        {/* Axis labels */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">Epoch</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90, 10, ${H / 2})`}>Loss</text>

        {/* Early stopping line (visible when no regularization) */}
        {mode === "none" && epoch >= minValIdx && (
          <line
            x1={sx(minValIdx)} y1={PAD / 2}
            x2={sx(minValIdx)} y2={H - PAD}
            stroke="var(--brand-indigo)" strokeDasharray="5 3" strokeWidth="1.5" opacity="0.8"
          />
        )}

        {/* Overfitting fill */}
        {visEpochs > 1 && (
          <path
            d={
              "M" + train.slice(0, visEpochs).map((v, i) => `${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L") +
              " L" + val.slice(0, visEpochs).map((v, i) => `${sx(visEpochs - 1 - i).toFixed(1)},${sy(v).toFixed(1)}`).join(" L") + " Z"
            }
            fill="var(--danger)"
            opacity="0.06"
          />
        )}

        {/* Train curve */}
        {visEpochs > 1 && (
          <path d={trainPath} fill="none" stroke="var(--brand-indigo)" strokeWidth="2.5" />
        )}
        {/* Val curve */}
        {visEpochs > 1 && (
          <path d={valPath} fill="none" stroke="var(--brand-pink)" strokeWidth="2.5" />
        )}

        {/* Cursor dots */}
        {epoch > 0 && (
          <>
            <circle cx={sx(epoch)} cy={sy(train[epoch])} r={4} fill="var(--brand-indigo)" stroke="var(--background)" strokeWidth="1.5" />
            <circle cx={sx(epoch)} cy={sy(val[epoch])} r={4} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="1.5" />
          </>
        )}

        {/* Legend */}
        <rect x={W - PAD - 120} y={PAD / 2 - 4} width={118} height={36} rx="4" fill="var(--card)" opacity="0.85" />
        <line x1={W - PAD - 114} y1={PAD / 2 + 6} x2={W - PAD - 100} y2={PAD / 2 + 6} stroke="var(--brand-indigo)" strokeWidth="2.5" />
        <text x={W - PAD - 97} y={PAD / 2 + 10} fontSize="10" fill="var(--foreground)">Train loss</text>
        <line x1={W - PAD - 114} y1={PAD / 2 + 20} x2={W - PAD - 100} y2={PAD / 2 + 20} stroke="var(--brand-pink)" strokeWidth="2.5" />
        <text x={W - PAD - 97} y={PAD / 2 + 24} fontSize="10" fill="var(--foreground)">Val loss</text>
      </svg>
    </VizFrame>
  );
}
