"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, linspace } from "@/lib/mathx";
import { clamp } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw, Plus } from "lucide-react";

const W = 620, H = 300, PAD_L = 44, PAD_R = 24, PAD_T = 20, PAD_B = 32;
const MAX_EPOCHS = 30;

type Run = {
  id: number;
  lr: number;
  batchSize: number;
  dropout: number;
  valAcc: number[];
  bestAcc: number;
  color: string;
};

const COLORS = [
  "var(--brand-indigo)",
  "var(--brand-cyan)",
  "var(--brand-pink)",
  "var(--success)",
  "var(--warning)",
  "var(--brand-violet)",
];

function simulateRun(lr: number, batchSize: number, dropout: number, seed: number): number[] {
  const rand = rng(seed);
  const noise = () => gaussian(rand, 0, 1);
  const capacity = 1 - dropout * 0.45;
  const lrPenalty = lr < 0.001 ? 0.85 : lr > 0.1 ? 0.82 : 1.0;
  const bsPenalty = batchSize > 128 ? 0.91 : batchSize < 16 ? 0.94 : 1.0;
  const ceiling = clamp(0.97 * capacity * lrPenalty * bsPenalty, 0.4, 0.97);
  const speed = clamp((lr / 0.01) * (32 / batchSize) * 0.4, 0.05, 1.2);
  const curve: number[] = [];
  for (let e = 0; e < MAX_EPOCHS; e++) {
    const t = e / (MAX_EPOCHS - 1);
    const smooth = ceiling * (1 - Math.exp(-speed * t * MAX_EPOCHS * 0.18));
    const noisy = smooth + noise() * 0.018 * (1 - t * 0.5);
    curve.push(clamp(noisy, 0.1, 0.99));
  }
  return curve;
}

const sx = (e: number) => PAD_L + (e / (MAX_EPOCHS - 1)) * (W - PAD_L - PAD_R);
const sy = (a: number) => PAD_T + (1 - (a - 0.4) / 0.6) * (H - PAD_T - PAD_B);

export default function Viz() {
  const [lr, setLr] = useState(0.01);
  const [batchSize, setBatchSize] = useState(32);
  const [dropout, setDropout] = useState(0.2);
  const [runs, setRuns] = useState<Run[]>([]);
  const [nextId, setNextId] = useState(0);
  const [hoverId, setHoverId] = useState<number | null>(null);

  const previewCurve = useMemo(
    () => simulateRun(lr, batchSize, dropout, 999 + Math.round(lr * 1000) + batchSize + Math.round(dropout * 10)),
    [lr, batchSize, dropout]
  );
  const previewBest = Math.max(...previewCurve);

  function addRun() {
    const curve = simulateRun(lr, batchSize, dropout, nextId * 137 + 42);
    const run: Run = {
      id: nextId,
      lr,
      batchSize,
      dropout,
      valAcc: curve,
      bestAcc: Math.max(...curve),
      color: COLORS[nextId % COLORS.length],
    };
    setRuns((prev) => [...prev.slice(-5), run]);
    setNextId((n) => n + 1);
  }

  function makePath(curve: number[]) {
    return "M" + linspace(0, MAX_EPOCHS - 1, MAX_EPOCHS).map((e, i) =>
      `${sx(e).toFixed(1)},${sy(curve[i]).toFixed(1)}`
    ).join(" L");
  }

  const bestRun = runs.length > 0 ? runs.reduce((b, r) => r.bestAcc > b.bestAcc ? r : b) : null;

  return (
    <VizFrame
      title="Experiment Tracking"
      hint="tune params, log runs, compare to find what worked"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Learning rate" min={0.0005} max={0.2} step={0.0005} value={lr}
              onChange={setLr} format={(v) => v < 0.01 ? v.toFixed(4) : v.toFixed(3)} />
            <Slider label="Batch size" min={8} max={256} step={8} value={batchSize}
              onChange={setBatchSize} format={(v) => String(v)} />
          </ControlGroup>
          <Slider label="Dropout" min={0} max={0.7} step={0.05} value={dropout}
            onChange={setDropout} format={(v) => v.toFixed(2)} />
          <div className="flex items-center gap-2 flex-wrap">
            <VizButton onClick={addRun}>
              <Plus size={13} /> Log run
            </VizButton>
            <VizButton onClick={() => { setRuns([]); setNextId(0); }}>
              <RotateCcw size={13} /> Clear
            </VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              preview acc: <span className="font-mono" style={{ color: "var(--brand-indigo)" }}>{(previewBest * 100).toFixed(1)}%</span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((a) => (
          <g key={a}>
            <line x1={PAD_L} y1={sy(a)} x2={W - PAD_R} y2={sy(a)}
              stroke="var(--border)" strokeWidth={a === 1.0 ? 1 : 0.5} strokeDasharray="3 4" />
            <text x={PAD_L - 6} y={sy(a) + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
              {Math.round(a * 100)}%
            </text>
          </g>
        ))}
        {/* X axis ticks */}
        {[0, 10, 20, 29].map((e) => (
          <text key={e} x={sx(e)} y={H - PAD_B + 14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
            {e + 1}
          </text>
        ))}
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          epoch
        </text>
        {/* Logged runs */}
        {runs.map((run) => {
          const isHovered = hoverId === run.id;
          const isBest = bestRun?.id === run.id;
          return (
            <path
              key={run.id}
              d={makePath(run.valAcc)}
              fill="none"
              stroke={run.color}
              strokeWidth={isHovered || isBest ? 2.8 : 1.5}
              opacity={isHovered ? 1 : isBest ? 0.95 : 0.55}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoverId(run.id)}
              onMouseLeave={() => setHoverId(null)}
            />
          );
        })}
        {/* Best run end marker */}
        {bestRun && (
          <circle
            cx={sx(MAX_EPOCHS - 1)}
            cy={sy(bestRun.bestAcc)}
            r={5}
            fill={bestRun.color}
            stroke="var(--background)"
            strokeWidth="2"
          />
        )}
        {/* Live preview curve (dashed) */}
        <path
          d={makePath(previewCurve)}
          fill="none"
          stroke="var(--brand-indigo)"
          strokeWidth="2"
          strokeDasharray="5 4"
          opacity="0.75"
        />
        {/* No-runs placeholder */}
        {runs.length === 0 && (
          <text x={(PAD_L + W - PAD_R) / 2} y={H / 2} textAnchor="middle" fontSize="12"
            fill="var(--muted-foreground)" opacity="0.6">
            Press "Log run" to track this experiment
          </text>
        )}
        {/* Hovered run tooltip */}
        {hoverId !== null && (() => {
          const run = runs.find((r) => r.id === hoverId);
          if (!run) return null;
          return (
            <g transform={`translate(${PAD_L + 6}, ${PAD_T + 4})`}>
              <rect x={0} y={0} width={158} height={58} rx={6}
                fill="var(--card)" stroke="var(--border)" strokeWidth="1" opacity="0.96" />
              <text x={8} y={16} fontSize="10" fontWeight="600" fill="var(--foreground)">
                Run #{run.id + 1}
              </text>
              <text x={8} y={30} fontSize="9" fill="var(--muted-foreground)">
                lr={run.lr.toFixed(4)}  batch={run.batchSize}  drop={run.dropout.toFixed(2)}
              </text>
              <text x={8} y={44} fontSize="9" fill="var(--muted-foreground)">
                best val acc: <tspan fontWeight="600" fill={run.color}>{(run.bestAcc * 100).toFixed(1)}%</tspan>
              </text>
            </g>
          );
        })()}
        {/* Best label */}
        {bestRun && runs.length > 1 && (
          <text
            x={W - PAD_R - 2}
            y={sy(bestRun.bestAcc) - 8}
            textAnchor="end"
            fontSize="9"
            fill={bestRun.color}
            fontWeight="600"
          >
            best #{bestRun.id + 1}
          </text>
        )}
        {/* Legend */}
        <g transform={`translate(${PAD_L + 4}, ${H - PAD_B - 4})`}>
          <line x1={0} y1={0} x2={18} y2={0} stroke="var(--brand-indigo)" strokeWidth="2" strokeDasharray="5 4" opacity="0.75" />
          <text x={22} y={4} fontSize="9" fill="var(--muted-foreground)">preview</text>
          {runs.length > 0 && (
            <>
              <line x1={68} y1={0} x2={86} y2={0} stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.6" />
              <text x={90} y={4} fontSize="9" fill="var(--muted-foreground)">logged runs</text>
            </>
          )}
        </g>
      </svg>
      {runs.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border text-xs">
          <table className="w-full min-w-[340px]">
            <thead>
              <tr className="border-b border-border bg-card-muted/40 text-muted-foreground">
                {["Run", "lr", "batch", "dropout", "best acc"].map((h) => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...runs].reverse().map((run) => {
                const isBest = bestRun?.id === run.id;
                return (
                  <tr key={run.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                    onMouseEnter={() => setHoverId(run.id)} onMouseLeave={() => setHoverId(null)}>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: run.color }} />
                        #{run.id + 1}
                        {isBest && <span className="text-[10px] font-semibold" style={{ color: run.color }}>★</span>}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono">{run.lr.toFixed(4)}</td>
                    <td className="px-3 py-1.5 font-mono">{run.batchSize}</td>
                    <td className="px-3 py-1.5 font-mono">{run.dropout.toFixed(2)}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color: isBest ? run.color : undefined, fontWeight: isBest ? 600 : undefined }}>
                      {(run.bestAcc * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VizFrame>
  );
}
