"use client";

import { useState, useMemo } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { clamp } from "@/lib/utils";

const W = 620, H = 320, PAD_L = 44, PAD_R = 20, PAD_T = 28, PAD_B = 40;
const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BASE = [42, 45, 38, 51, 55, 47, 60, 58, 63, 52, 68, 72];

export default function Viz() {
  const [storyMode, setStoryMode] = useState(false);
  const [highlight, setHighlight] = useState(10);
  const [noise, setNoise] = useState(1.2);
  const [seed, setSeed] = useState(42);

  const data = useMemo(() => {
    const rand = rng(seed);
    return BASE.map((v) => clamp(v + gaussian(rand, 0, noise * 6), 10, 100));
  }, [noise, seed]);

  const yMax = 100;
  const yMin = 0;

  const bw = (W - PAD_L - PAD_R) / data.length;
  const barPad = storyMode ? 6 : 3;

  const sx = (i: number) => PAD_L + i * bw + bw / 2;
  const sy = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * (H - PAD_T - PAD_B);
  const barH = (v: number) => (H - PAD_T - PAD_B) * (v / (yMax - yMin));

  const highlightVal = data[highlight];
  const baseline = data.filter((_, i) => i !== highlight).reduce((a, b) => a + b, 0) / (data.length - 1);
  const delta = highlightVal - baseline;

  const gridLines = storyMode ? [0, 50, 100] : [0, 25, 50, 75, 100];

  return (
    <VizFrame
      title="Storytelling with Data"
      hint={storyMode ? "story mode: one bar, one message" : "toggle Story Mode to reveal the insight"}
      controls={
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <SegButton active={!storyMode} onClick={() => setStoryMode(false)}>Raw Chart</SegButton>
            <SegButton active={storyMode} onClick={() => setStoryMode(true)}>Story Mode</SegButton>
          </div>
          <Slider
            label="Highlight month"
            min={0} max={11} step={1} value={highlight}
            onChange={(v) => setHighlight(Math.round(v))}
            format={(v) => LABELS[Math.round(v)]}
          />
          <Slider
            label="Background noise"
            min={0} max={3} step={0.1} value={noise}
            onChange={setNoise}
            format={(v) => v.toFixed(1)}
          />
          <div className="rounded-lg border border-border bg-card p-2.5 text-xs space-y-1">
            <div className="text-muted-foreground">
              {LABELS[highlight]} vs avg
            </div>
            <div className={`font-mono font-semibold text-sm ${delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)} units ({delta >= 0 ? "+" : ""}{((delta / baseline) * 100).toFixed(0)}%)
            </div>
            {storyMode && (
              <div className="text-muted-foreground pt-0.5 leading-snug">
                Annotation + grey-out makes this {delta >= 0 ? "peak" : "dip"} unmissable.
              </div>
            )}
          </div>
          <VizButton onClick={() => setSeed((s) => s + 1)}>Reshuffle data</VizButton>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD_L} y1={sy(g)} x2={W - PAD_R} y2={sy(g)}
              stroke="var(--border)"
              strokeWidth={storyMode ? 0.8 : 0.5}
              strokeDasharray={storyMode ? "0" : "3 3"}
              opacity={storyMode ? 0.6 : 1}
            />
            <text
              x={PAD_L - 6} y={sy(g) + 4}
              fontSize={9} textAnchor="end"
              fill={storyMode ? "var(--muted-foreground)" : "var(--muted-foreground)"}
              opacity={storyMode ? 0.5 : 1}
            >
              {g}
            </text>
          </g>
        ))}

        {/* Axis */}
        <line
          x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B}
          stroke={storyMode ? "transparent" : "var(--border)"}
          strokeWidth={1}
        />
        <line
          x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B}
          stroke="var(--border)" strokeWidth={storyMode ? 0.6 : 1}
        />

        {/* Baseline reference line in story mode */}
        {storyMode && (
          <line
            x1={PAD_L} y1={sy(baseline)} x2={W - PAD_R} y2={sy(baseline)}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        )}
        {storyMode && (
          <text x={W - PAD_R + 2} y={sy(baseline) + 4} fontSize={8} fill="var(--muted-foreground)" opacity={0.7}>
            avg
          </text>
        )}

        {/* Bars */}
        {data.map((v, i) => {
          const isHighlight = i === highlight;
          const x = PAD_L + i * bw + barPad;
          const bWidth = bw - barPad * 2;
          const dimmed = storyMode && !isHighlight;
          const fill = dimmed ? "var(--muted-foreground)" : "var(--brand-pink)";
          const opacity = dimmed ? 0.2 : 1;

          return (
            <g key={i}>
              <rect
                x={x} y={sy(v)} width={bWidth} height={barH(v)}
                fill={fill}
                opacity={opacity}
                rx={storyMode ? 2 : 1}
              />
              {!storyMode && (
                <text x={sx(i)} y={H - PAD_B + 13} fontSize={8.5} textAnchor="middle" fill="var(--muted-foreground)">
                  {LABELS[i]}
                </text>
              )}
              {storyMode && (
                <text
                  x={sx(i)} y={H - PAD_B + 13} fontSize={8.5} textAnchor="middle"
                  fill={isHighlight ? "var(--foreground)" : "var(--muted-foreground)"}
                  opacity={isHighlight ? 1 : 0.35}
                  fontWeight={isHighlight ? "600" : "400"}
                >
                  {LABELS[i]}
                </text>
              )}
            </g>
          );
        })}

        {/* Annotation arrow + callout in story mode */}
        {storyMode && (() => {
          const cx = sx(highlight);
          const barTop = sy(highlightVal);
          const arrowY = barTop - 10;
          const labelY = arrowY - 22;
          return (
            <g>
              <line
                x1={cx} y1={arrowY} x2={cx} y2={barTop - 2}
                stroke="var(--brand-pink)" strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              <rect
                x={cx - 58} y={labelY - 12} width={116} height={22}
                fill="var(--brand-pink)" rx={4} opacity={0.15}
              />
              <rect
                x={cx - 58} y={labelY - 12} width={116} height={22}
                fill="none" stroke="var(--brand-pink)" rx={4} strokeWidth={1} opacity={0.6}
              />
              <text x={cx} y={labelY + 3} fontSize={10} textAnchor="middle" fill="var(--brand-pink)" fontWeight="600">
                {LABELS[highlight]}: {highlightVal.toFixed(0)} units
                {delta >= 0 ? ` (+${((delta / baseline) * 100).toFixed(0)}%)` : ` (${((delta / baseline) * 100).toFixed(0)}%)`}
              </text>
            </g>
          );
        })()}

        {/* Title overlay in story mode */}
        {storyMode && (
          <text x={PAD_L + 4} y={PAD_T - 8} fontSize={10} fill="var(--foreground)" fontWeight="500">
            {delta >= 0
              ? `${LABELS[highlight]} was our strongest month — ${((delta / baseline) * 100).toFixed(0)}% above average`
              : `${LABELS[highlight]} dipped ${Math.abs((delta / baseline) * 100).toFixed(0)}% below average`}
          </text>
        )}

        {/* Raw chart title */}
        {!storyMode && (
          <text x={PAD_L + 4} y={PAD_T - 8} fontSize={10} fill="var(--muted-foreground)">
            Monthly units sold
          </text>
        )}

        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--brand-pink)" />
          </marker>
        </defs>
      </svg>
    </VizFrame>
  );
}
