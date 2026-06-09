"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 640, H = 340;
const GRID = 7, CELL = 36, PAD_L = 28, PAD_T = 40;
const FILTER_SIZE = 3;

const INPUT_IMAGE = [
  [0,0,0,0,0,0,0],
  [0,1,1,1,1,1,0],
  [0,1,0,0,0,1,0],
  [0,1,0,0,0,1,0],
  [0,1,0,0,0,1,0],
  [0,1,1,1,1,1,0],
  [0,0,0,0,0,0,0],
];

type FilterName = "edge" | "blur" | "sharpen";

const FILTERS: Record<FilterName, number[][]> = {
  edge:    [[-1,-1,-1],[-1, 8,-1],[-1,-1,-1]],
  blur:    [[ 1, 1, 1],[ 1, 1, 1],[ 1, 1, 1]],
  sharpen: [[ 0,-1, 0],[-1, 5,-1],[ 0,-1, 0]],
};

function convolve(img: number[][], kernel: number[][], stride: number): number[][] {
  const outSize = Math.floor((GRID - FILTER_SIZE) / stride) + 1;
  return range(outSize).map((row) =>
    range(outSize).map((col) => {
      let sum = 0;
      range(FILTER_SIZE).forEach((kr) =>
        range(FILTER_SIZE).forEach((kc) => {
          sum += img[row * stride + kr][col * stride + kc] * kernel[kr][kc];
        })
      );
      return sum;
    })
  );
}

export default function Viz() {
  const [filterName, setFilterName] = useState<FilterName>("edge");
  const [stride, setStride] = useState(1);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);
  const lastT = useRef(0);

  const kernel = FILTERS[filterName];
  const featureMap = useMemo(() => convolve(INPUT_IMAGE, kernel, stride), [kernel, stride]);
  const outSize = featureMap.length;
  const totalSteps = outSize * outSize;

  const curRow = Math.floor(step / outSize);
  const curCol = step % outSize;
  const imgRow = curRow * stride;
  const imgCol = curCol * stride;

  const fmVals = featureMap.flat();
  const fmMin = Math.min(...fmVals);
  const fmMax = Math.max(...fmVals, fmMin + 1);
  const normalize = (v: number) => (v - fmMin) / (fmMax - fmMin);

  useEffect(() => {
    if (!running) return;
    const loop = (t: number) => {
      if (t - lastT.current > 350) {
        lastT.current = t;
        setStep((s) => {
          const next = s + 1;
          if (next >= totalSteps) { setRunning(false); return totalSteps - 1; }
          return next;
        });
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [running, totalSteps]);

  const reset = () => { setRunning(false); setStep(0); };

  const dotProduct = useMemo(() => {
    let s = 0;
    range(FILTER_SIZE).forEach((kr) =>
      range(FILTER_SIZE).forEach((kc) => {
        s += INPUT_IMAGE[imgRow + kr][imgCol + kc] * kernel[kr][kc];
      })
    );
    return s;
  }, [imgRow, imgCol, kernel]);

  // Layout: input grid left, filter center, output right
  const FM_CELL = Math.min(36, Math.floor((W - 2*PAD_L - GRID*CELL - 80) / outSize));
  const INPUT_X = PAD_L;
  const FILTER_X = PAD_L + GRID * CELL + 24;
  const FILTER_CELL = 34;
  const OUT_X = FILTER_X + FILTER_SIZE * FILTER_CELL + 24;

  return (
    <VizFrame
      title="Convolutional Filter Sliding Over Image"
      hint="watch the filter scan and build the feature map"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Filter:</span>
            {(["edge","blur","sharpen"] as FilterName[]).map((f) => (
              <SegButton key={f} active={filterName === f} onClick={() => { setFilterName(f); reset(); }}>{f}</SegButton>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-32">
              <Slider label="Stride" min={1} max={2} step={1} value={stride} onChange={(v) => { setStride(v); reset(); }} format={(v) => String(v)} />
            </div>
            <div className="flex gap-1.5 items-center">
              <VizButton onClick={() => setRunning((r) => !r)}>
                {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}
              </VizButton>
              <VizButton onClick={reset}><RotateCcw size={13} /> Reset</VizButton>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              pos <span className="font-mono text-foreground">({curRow},{curCol})</span>
              &nbsp;· dot = <span className="font-mono" style={{ color: "var(--brand-indigo)" }}>{dotProduct}</span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* === Labels === */}
        <text x={INPUT_X + (GRID*CELL)/2} y={PAD_T - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Input (7×7)</text>
        <text x={FILTER_X + (FILTER_SIZE*FILTER_CELL)/2} y={PAD_T - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Filter</text>
        <text x={OUT_X + (outSize*FM_CELL)/2} y={PAD_T - 10} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">Feature Map ({outSize}×{outSize})</text>

        {/* === Input grid === */}
        {range(GRID).map((r) =>
          range(GRID).map((c) => {
            const val = INPUT_IMAGE[r][c];
            const inWindow = r >= imgRow && r < imgRow + FILTER_SIZE && c >= imgCol && c < imgCol + FILTER_SIZE;
            const x = INPUT_X + c * CELL, y = PAD_T + r * CELL;
            return (
              <g key={`i-${r}-${c}`}>
                <rect x={x} y={y} width={CELL-1} height={CELL-1}
                  fill={val ? "var(--brand-indigo)" : "var(--card)"}
                  opacity={inWindow ? 1 : 0.55}
                  stroke={inWindow ? "var(--brand-cyan)" : "var(--border)"}
                  strokeWidth={inWindow ? 1.5 : 0.5} rx="2"
                />
                <text x={x+CELL/2-0.5} y={y+CELL/2+4} textAnchor="middle" fontSize="10" fill={val ? "var(--background)" : "var(--muted-foreground)"}>
                  {val}
                </text>
              </g>
            );
          })
        )}
        {/* Sliding window border on input */}
        <rect x={INPUT_X + imgCol*CELL} y={PAD_T + imgRow*CELL}
          width={FILTER_SIZE*CELL-1} height={FILTER_SIZE*CELL-1}
          fill="none" stroke="var(--brand-cyan)" strokeWidth="2.5" rx="3" opacity="0.9"
        />

        {/* === Filter kernel === */}
        {range(FILTER_SIZE).map((kr) =>
          range(FILTER_SIZE).map((kc) => {
            const kv = kernel[kr][kc];
            const iv = INPUT_IMAGE[imgRow+kr]?.[imgCol+kc] ?? 0;
            const isActive = iv !== 0 && kv !== 0;
            const x = FILTER_X + kc*FILTER_CELL, y = PAD_T + kr*FILTER_CELL + 20;
            return (
              <g key={`k-${kr}-${kc}`}>
                <rect x={x} y={y} width={FILTER_CELL-2} height={FILTER_CELL-2}
                  fill={isActive ? "var(--brand-indigo)" : "var(--card)"}
                  opacity={isActive ? 0.85 : 0.6}
                  stroke={isActive ? "var(--brand-indigo)" : "var(--border)"}
                  strokeWidth={isActive ? 1.5 : 0.5} rx="3"
                />
                <text x={x+FILTER_CELL/2-1} y={y+FILTER_CELL/2+4} textAnchor="middle" fontSize="10"
                  fill={isActive ? "var(--background)" : "var(--foreground)"} fontWeight={isActive ? "700" : "400"}>
                  {kv}
                </text>
              </g>
            );
          })
        )}

        {/* Arrow from filter to feature map */}
        <text x={FILTER_X + FILTER_SIZE*FILTER_CELL/2} y={PAD_T + FILTER_SIZE*FILTER_CELL + 38} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          Σ = {dotProduct}
        </text>

        {/* === Feature Map === */}
        {range(outSize).map((r) =>
          range(outSize).map((c) => {
            const filled = r < curRow || (r === curRow && c <= curCol);
            const isCurrent = r === curRow && c === curCol;
            const fv = featureMap[r][c];
            const norm = normalize(fv);
            const x = OUT_X + c*FM_CELL, y = PAD_T + r*FM_CELL + (outSize < 6 ? 20 : 0);
            return (
              <g key={`f-${r}-${c}`}>
                <rect x={x} y={y} width={FM_CELL-2} height={FM_CELL-2}
                  fill={filled ? `color-mix(in oklab, var(--brand-indigo) ${Math.round(norm*100)}%, var(--card))` : "var(--card)"}
                  stroke={isCurrent ? "var(--brand-cyan)" : "var(--border)"}
                  strokeWidth={isCurrent ? 2 : 0.5} rx="2" opacity={filled ? 1 : 0.4}
                />
                {filled && (
                  <text x={x+FM_CELL/2-1} y={y+FM_CELL/2+4} textAnchor="middle" fontSize={FM_CELL > 28 ? "9" : "8"}
                    fill={norm > 0.5 ? "var(--background)" : "var(--foreground)"}>
                    {fv}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Step progress bar */}
        <rect x={PAD_L} y={H-14} width={W - 2*PAD_L} height={5} rx="2.5" fill="var(--border)" />
        <rect x={PAD_L} y={H-14} width={Math.max(0, totalSteps > 1 ? (step/(totalSteps-1))*(W-2*PAD_L) : 0)} height={5} rx="2.5" fill="var(--brand-indigo)" opacity="0.8" />
        <text x={W/2} y={H-2} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          step {step+1}/{totalSteps} · stride={stride}
        </text>
      </svg>
    </VizFrame>
  );
}
