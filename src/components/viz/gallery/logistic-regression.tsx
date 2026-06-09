"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 640, H = 320, PAD = { l: 36, r: 16, t: 14, b: 30 };
const SW = 240, SH = 160;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function makeData(seed: number) {
  const r = rng(seed);
  const pts: { x: number; y: number; cls: number }[] = [];
  for (let i = 0; i < 30; i++) pts.push({ x: gaussian(r, -1.4, 0.8), y: gaussian(r, -0.6, 0.7), cls: 0 });
  for (let i = 0; i < 30; i++) pts.push({ x: gaussian(r, 1.4, 0.8), y: gaussian(r, 0.6, 0.7), cls: 1 });
  return pts;
}

export default function Viz() {
  const [w0, setW0] = useState(1.4);
  const [w1, setW1] = useState(0.9);
  const [bias, setBias] = useState(0.0);
  const [view, setView] = useState<"scatter" | "sigmoid">("scatter");
  const [seed] = useState(42);

  const pts = useMemo(() => makeData(seed), [seed]);

  // Scatter plot coords
  const xMin = -3.5, xMax = 3.5, yMin = -2.5, yMax = 2.5;
  const sx = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

  // Decision boundary: w0*x + w1*y + bias = 0 → y = -(w0*x + bias) / w1
  const dbY = (x: number) => w1 !== 0 ? -(w0 * x + bias) / w1 : 0;
  const dbPath = "M" + linspace(xMin, xMax, 80).map(x => {
    const y = dbY(x);
    return `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
  }).join(" L");

  // Accuracy
  const accuracy = useMemo(() => {
    const correct = pts.filter(p => {
      const z = w0 * p.x + w1 * p.y + bias;
      return (sigmoid(z) >= 0.5 ? 1 : 0) === p.cls;
    }).length;
    return (correct / pts.length) * 100;
  }, [pts, w0, w1, bias]);

  // Sigmoid panel: z range → probability
  const zMin = -6, zMax = 6;
  const sgX = (z: number) => (z - zMin) / (zMax - zMin) * (SW - 24) + 12;
  const sgY = (p: number) => SH - 16 - p * (SH - 28);
  const sigPath = "M" + linspace(zMin, zMax, 120).map(z =>
    `${sgX(z).toFixed(1)},${sgY(sigmoid(z)).toFixed(1)}`
  ).join(" L");

  // Representative z scores for the sigmoid viz (use first feature only projected onto w0*x)
  const sampleZ0 = w0 * (-1.4) + bias;
  const sampleZ1 = w0 * 1.4 + bias;

  const lossVal = useMemo(() => {
    let loss = 0;
    for (const p of pts) {
      const prob = sigmoid(w0 * p.x + w1 * p.y + bias);
      const clamped = Math.max(1e-7, Math.min(1 - 1e-7, prob));
      loss += p.cls === 1 ? -Math.log(clamped) : -Math.log(1 - clamped);
    }
    return loss / pts.length;
  }, [pts, w0, w1, bias]);

  return (
    <VizFrame
      title="Logistic Regression"
      hint="adjust weights and bias to move the decision boundary"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Weight w₀ (x-axis)" min={-3} max={3} step={0.1} value={w0} onChange={setW0} format={v => v.toFixed(1)} />
            <Slider label="Weight w₁ (y-axis)" min={-3} max={3} step={0.1} value={w1} onChange={setW1} format={v => v.toFixed(1)} />
          </ControlGroup>
          <Slider label="Bias b (shift boundary)" min={-3} max={3} step={0.1} value={bias} onChange={setBias} format={v => v.toFixed(1)} />
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>accuracy <span className="font-mono" style={{ color: accuracy >= 80 ? "var(--success)" : accuracy >= 60 ? "var(--warning)" : "var(--danger)" }}>{accuracy.toFixed(0)}%</span></span>
            <span>log-loss <span className="font-mono text-foreground">{lossVal.toFixed(3)}</span></span>
            <span className="font-mono text-muted-foreground">z = {w0.toFixed(1)}x₀ + {w1.toFixed(1)}x₁ + {bias.toFixed(1)}</span>
          </div>
        </div>
      }
    >
      <div className="mb-2 flex gap-1.5">
        <SegButton active={view === "scatter"} onClick={() => setView("scatter")}>Decision Boundary</SegButton>
        <SegButton active={view === "sigmoid"} onClick={() => setView("sigmoid")}>Sigmoid Curve</SegButton>
      </div>

      {view === "scatter" ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Grid lines */}
          <line x1={sx(0)} y1={PAD.t} x2={sx(0)} y2={H - PAD.b} stroke="var(--border)" strokeWidth="1" />
          <line x1={PAD.l} y1={sy(0)} x2={W - PAD.r} y2={sy(0)} stroke="var(--border)" strokeWidth="1" />
          {/* Axis labels */}
          <text x={W - PAD.r - 4} y={sy(0) - 6} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">x₀</text>
          <text x={sx(0) + 6} y={PAD.t + 12} textAnchor="start" fontSize="11" fill="var(--muted-foreground)">x₁</text>

          {/* Decision boundary */}
          <path d={dbPath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" strokeDasharray="6 4" />
          <text x={sx(xMax - 0.3)} y={sy(dbY(xMax - 0.3)) - 8} textAnchor="end" fontSize="10" fill="var(--brand-violet)" opacity="0.85">boundary</text>

          {/* Data points */}
          {pts.map((p, i) => {
            const z = w0 * p.x + w1 * p.y + bias;
            const prob = sigmoid(z);
            const isCorrect = (prob >= 0.5 ? 1 : 0) === p.cls;
            return (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={5}
                fill={p.cls === 1 ? "var(--brand-violet)" : "var(--brand-cyan)"}
                stroke={isCorrect ? "none" : "var(--danger)"}
                strokeWidth={isCorrect ? 0 : 2}
                opacity={0.82}
              />
            );
          })}
          {/* Legend */}
          <circle cx={PAD.l + 10} cy={PAD.t + 10} r={5} fill="var(--brand-cyan)" />
          <text x={PAD.l + 20} y={PAD.t + 14} fontSize="11" fill="var(--muted-foreground)">Class 0</text>
          <circle cx={PAD.l + 75} cy={PAD.t + 10} r={5} fill="var(--brand-violet)" />
          <text x={PAD.l + 85} y={PAD.t + 14} fontSize="11" fill="var(--muted-foreground)">Class 1</text>
          <rect x={PAD.l + 145} y={PAD.t + 4} width={10} height={10} fill="none" stroke="var(--danger)" strokeWidth="2" rx="2" />
          <text x={PAD.l + 160} y={PAD.t + 14} fontSize="11" fill="var(--muted-foreground)">misclassified</text>
        </svg>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Sigmoid panel */}
          <rect x={10} y={10} width={SW} height={SH} rx="6" fill="var(--card)" stroke="var(--border)" />
          {/* Axes */}
          <line x1={12} y1={sgY(0.5) + 10} x2={SW + 8} y2={sgY(0.5) + 10} stroke="var(--border)" strokeDasharray="4 3" />
          <line x1={sgX(0)} y1={14} x2={sgX(0)} y2={SH - 10} stroke="var(--border)" strokeDasharray="4 3" />
          {/* Labels */}
          <text x={sgX(zMin) + 2} y={SH - 2} fontSize="10" fill="var(--muted-foreground)">z={zMin}</text>
          <text x={sgX(zMax) - 2} y={SH - 2} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">z={zMax}</text>
          <text x={sgX(0) + 3} y={sgY(0.5) + 9} fontSize="10" fill="var(--muted-foreground)">0.5</text>
          <text x={16} y={22} fontSize="11" fontWeight="600" fill="var(--brand-violet)">σ(z) = 1/(1+e⁻ᶻ)</text>
          {/* Sigmoid curve */}
          <path d={sigPath} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
          {/* Class markers on sigmoid */}
          <circle cx={sgX(sampleZ0)} cy={sgY(sigmoid(sampleZ0))} r={6} fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="1.5" />
          <circle cx={sgX(sampleZ1)} cy={sgY(sigmoid(sampleZ1))} r={6} fill="var(--brand-violet)" stroke="var(--background)" strokeWidth="1.5" />
          <line x1={sgX(sampleZ0)} y1={sgY(sigmoid(sampleZ0))} x2={sgX(sampleZ0)} y2={SH - 16} stroke="var(--brand-cyan)" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
          <line x1={sgX(sampleZ1)} y1={sgY(sigmoid(sampleZ1))} x2={sgX(sampleZ1)} y2={SH - 16} stroke="var(--brand-violet)" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />

          {/* Explanation panel */}
          <rect x={SW + 20} y={10} width={W - SW - 30} height={SH} rx="6" fill="var(--card)" stroke="var(--border)" />
          <text x={SW + 34} y={36} fontSize="12" fontWeight="600" fill="var(--foreground)">How it works</text>

          <text x={SW + 34} y={60} fontSize="11" fill="var(--muted-foreground)">1. Compute linear score z:</text>
          <text x={SW + 34} y={76} fontSize="11" fill="var(--brand-violet)" fontFamily="monospace">
            z = {w0.toFixed(1)}x₀ + {w1.toFixed(1)}x₁ + {bias.toFixed(1)}
          </text>

          <text x={SW + 34} y={100} fontSize="11" fill="var(--muted-foreground)">2. Squeeze to probability:</text>
          <text x={SW + 34} y={116} fontSize="11" fill="var(--brand-cyan)" fontFamily="monospace">P(y=1) = σ(z)</text>

          <text x={SW + 34} y={136} fontSize="11" fill="var(--muted-foreground)">3. Predict class 1 if P ≥ 0.5</text>

          <text x={SW + 34} y={156} fontSize="10" fill="var(--muted-foreground)">Class 0 mean z ≈</text>
          <text x={SW + 130} y={156} fontSize="10" fill="var(--brand-cyan)" fontFamily="monospace">{sampleZ0.toFixed(2)} → P={sigmoid(sampleZ0).toFixed(2)}</text>

          {/* Below sigmoid: probability readout */}
          <text x={20} y={SH + 28} fontSize="11" fill="var(--muted-foreground)">Class 0 avg score z ≈ <tspan fill="var(--brand-cyan)" fontFamily="monospace">{sampleZ0.toFixed(2)}</tspan>  →  P(y=1) = <tspan fill="var(--brand-cyan)" fontFamily="monospace">{sigmoid(sampleZ0).toFixed(3)}</tspan></text>
          <text x={20} y={SH + 46} fontSize="11" fill="var(--muted-foreground)">Class 1 avg score z ≈ <tspan fill="var(--brand-violet)" fontFamily="monospace">{sampleZ1.toFixed(2)}</tspan>  →  P(y=1) = <tspan fill="var(--brand-violet)" fontFamily="monospace">{sigmoid(sampleZ1).toFixed(3)}</tspan></text>
          <text x={20} y={SH + 64} fontSize="11" fill="var(--muted-foreground)">Log-loss: <tspan fill="var(--foreground)" fontFamily="monospace">{lossVal.toFixed(3)}</tspan>  ·  Accuracy: <tspan style={{ fill: accuracy >= 80 ? "var(--success)" : accuracy >= 60 ? "var(--warning)" : "var(--danger)" }} fontFamily="monospace">{accuracy.toFixed(0)}%</tspan></text>
        </svg>
      )}
    </VizFrame>
  );
}
