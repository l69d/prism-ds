"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton } from "@/components/viz/controls";
import { clamp, mapRange } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

const W = 640, H = 360, PAD = 44;

type Vec = { x: number; y: number };
type Word = { label: string } & Vec;

// Fixed 2-D embedding coordinates (hand-crafted to show the semantic geometry)
const WORDS: Word[] = [
  { label: "king",    x: 0.78, y: 0.82 },
  { label: "queen",   x: 0.58, y: 0.82 },
  { label: "man",     x: 0.78, y: 0.48 },
  { label: "woman",   x: 0.58, y: 0.48 },
  { label: "prince",  x: 0.90, y: 0.65 },
  { label: "princess",x: 0.70, y: 0.65 },
  { label: "boy",     x: 0.88, y: 0.32 },
  { label: "girl",    x: 0.68, y: 0.32 },
  { label: "actor",   x: 0.78, y: 0.15 },
  { label: "actress", x: 0.58, y: 0.15 },
  { label: "uncle",   x: 0.42, y: 0.65 },
  { label: "aunt",    x: 0.22, y: 0.65 },
  { label: "dog",     x: 0.18, y: 0.30 },
  { label: "cat",     x: 0.18, y: 0.14 },
];

type AnalogySet = { a: string; b: string; c: string; d: string; label: string };
const ANALOGIES: AnalogySet[] = [
  { a: "king",   b: "man",   c: "woman",   d: "queen",    label: "royalty" },
  { a: "prince", b: "man",   c: "woman",   d: "princess", label: "title" },
  { a: "boy",    b: "man",   c: "woman",   d: "girl",     label: "age" },
  { a: "actor",  b: "man",   c: "woman",   d: "actress",  label: "role" },
  { a: "uncle",  b: "man",   c: "woman",   d: "aunt",     label: "family" },
];

function add(a: Vec, b: Vec): Vec { return { x: a.x + b.x, y: a.y + b.y }; }
function sub(a: Vec, b: Vec): Vec { return { x: a.x - b.x, y: a.y - b.y }; }
function dot(a: Vec, b: Vec): number { return a.x * b.x + a.y * b.y; }
function mag(v: Vec): number { return Math.sqrt(v.x * v.x + v.y * v.y); }
function cosine(a: Vec, b: Vec): number {
  const m = mag(a) * mag(b);
  return m < 1e-9 ? 0 : clamp(dot(a, b) / m, -1, 1);
}

function nearest(target: Vec, words: Word[], exclude: string[]): { word: Word; sim: number } {
  let best = words[0];
  let bestSim = -Infinity;
  for (const w of words) {
    if (exclude.includes(w.label)) continue;
    const s = cosine(target, w);
    if (s > bestSim) { bestSim = s; best = w; }
  }
  return { word: best, sim: bestSim };
}

export default function Viz() {
  const [analogyIdx, setAnalogyIdx] = useState(0);
  const [noise, setNoise] = useState(0);
  const [showNearest, setShowNearest] = useState(true);

  const analogy = ANALOGIES[analogyIdx];

  const wA = useMemo(() => WORDS.find((w) => w.label === analogy.a)!, [analogy]);
  const wB = useMemo(() => WORDS.find((w) => w.label === analogy.b)!, [analogy]);
  const wC = useMemo(() => WORDS.find((w) => w.label === analogy.c)!, [analogy]);
  const wD = useMemo(() => WORDS.find((w) => w.label === analogy.d)!, [analogy]);

  // target = A - B + C  (plus a tiny deterministic displacement when noise > 0)
  const noiseVec: Vec = useMemo(() => ({
    x: noise * 0.012 * (((analogyIdx * 7 + 3) % 11) - 5),
    y: noise * 0.012 * (((analogyIdx * 5 + 1) % 9)  - 4),
  }), [noise, analogyIdx]);

  const target: Vec = useMemo(() => {
    const raw = add(sub(wA, wB), wC);
    return add(raw, noiseVec);
  }, [wA, wB, wC, noiseVec]);

  const nearestResult = useMemo(
    () => nearest(target, WORDS, [analogy.a, analogy.b, analogy.c]),
    [target, analogy],
  );

  const trueD_sim = useMemo(() => cosine(target, wD), [target, wD]);

  const sx = (v: number) => PAD + v * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - v * (H - 2 * PAD);

  function arrow(from: Vec, to: Vec, color: string, dash?: string) {
    const id = `arr-${color.replace(/[^a-z]/g, "")}-${dash ? "d" : "s"}`;
    return (
      <g>
        <defs>
          <marker id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill={color} />
          </marker>
        </defs>
        <line
          x1={sx(from.x)} y1={sy(from.y)}
          x2={sx(to.x) - 0.01} y2={sy(to.y) - 0.01}
          stroke={color} strokeWidth={2} strokeDasharray={dash}
          markerEnd={`url(#${id})`}
        />
      </g>
    );
  }

  function wordDot(w: Word, color: string, r: number, halo?: boolean) {
    return (
      <g key={w.label} style={{ pointerEvents: "none" }}>
        {halo && <circle cx={sx(w.x)} cy={sy(w.y)} r={r + 6} fill={color} opacity={0.18} />}
        <circle cx={sx(w.x)} cy={sy(w.y)} r={r} fill={color} opacity={0.92} />
        <text
          x={sx(w.x)} y={sy(w.y) - r - 4}
          textAnchor="middle" fontSize={10} fontWeight="600"
          fill={color}
        >{w.label}</text>
      </g>
    );
  }

  const nearestIsD = nearestResult.word.label === analogy.d;

  return (
    <VizFrame
      title="Word Embeddings — Vector Arithmetic"
      hint="pick an analogy · adjust noise · see A − B + C ≈ D"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {ANALOGIES.map((an, i) => (
              <SegButton key={an.label} active={analogyIdx === i} onClick={() => setAnalogyIdx(i)}>
                {an.a} − {an.b} + {an.c}
              </SegButton>
            ))}
          </div>
          <Slider
            label="Embedding noise"
            min={0} max={10} step={0.5}
            value={noise}
            onChange={setNoise}
            format={(v) => v === 0 ? "none" : `+${v.toFixed(1)}`}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <SegButton active={showNearest} onClick={() => setShowNearest((v) => !v)}>
              Show nearest word
            </SegButton>
            <VizButton onClick={() => { setNoise(0); setAnalogyIdx(0); }}>
              <RotateCcw size={12} /> Reset
            </VizButton>
            <span className="ml-auto text-xs text-muted-foreground">
              nearest to target:{" "}
              <span className="font-mono" style={{ color: nearestIsD ? "var(--success)" : "var(--danger)" }}>
                {nearestResult.word.label}
              </span>{" "}
              <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>
                sim={trueD_sim.toFixed(3)}
              </span>
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth={1} />
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">dim 1 (e.g. gender)</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" transform={`rotate(-90,10,${H / 2})`}>dim 2 (status)</text>

        {/* Background dots for all other words */}
        {WORDS.filter((w) => ![analogy.a, analogy.b, analogy.c, analogy.d].includes(w.label)).map((w) => (
          <g key={w.label}>
            <circle cx={sx(w.x)} cy={sy(w.y)} r={3.5} fill="var(--muted-foreground)" opacity={0.35} />
            <text x={sx(w.x)} y={sy(w.y) - 7} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" opacity={0.5}>{w.label}</text>
          </g>
        ))}

        {/* Gender offset reference: B → C dashed */}
        {arrow(wB, wC, "var(--brand-indigo)", "5 3")}

        {/* Main analogy arrow: A → target */}
        {arrow(wA, target, "var(--brand-cyan)", undefined)}

        {/* Dashed ghost arrow A → D (true target) when noise > 0 */}
        {noise > 0 && arrow(wA, wD, "var(--success)", "4 4")}

        {/* Nearest result indicator */}
        {showNearest && nearestResult.word.label !== analogy.d && (
          <g>
            <circle
              cx={sx(nearestResult.word.x)} cy={sy(nearestResult.word.y)} r={10}
              fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 2"
            />
          </g>
        )}

        {/* Key word dots */}
        {wordDot(wB, "var(--brand-indigo)", 5)}
        {wordDot(wC, "var(--brand-indigo)", 5)}
        {wordDot(wA, "var(--brand-cyan)", 6)}
        {wordDot(wD, "var(--success)", 6, true)}

        {/* Target crosshair */}
        <g>
          <line x1={sx(target.x) - 8} y1={sy(target.y)} x2={sx(target.x) + 8} y2={sy(target.y)} stroke="var(--brand-cyan)" strokeWidth={1.5} />
          <line x1={sx(target.x)} y1={sy(target.y) - 8} x2={sx(target.x)} y2={sy(target.y) + 8} stroke="var(--brand-cyan)" strokeWidth={1.5} />
          <text x={sx(target.x) + 10} y={sy(target.y) - 6} fontSize={9} fill="var(--brand-cyan)" fontWeight="600">A−B+C</text>
        </g>

        {/* Equation label */}
        <text x={W / 2} y={PAD - 12} textAnchor="middle" fontSize={11} fill="var(--foreground)" fontWeight="600">
          {analogy.a} − {analogy.b} + {analogy.c} ≈{" "}
          <tspan fill={nearestIsD ? "var(--success)" : "var(--danger)"}>{nearestResult.word.label}</tspan>
        </text>

        {/* Legend */}
        <g transform={`translate(${W - PAD - 120}, ${PAD - 8})`}>
          <line x1={0} y1={8} x2={18} y2={8} stroke="var(--brand-indigo)" strokeWidth={2} strokeDasharray="5 3" />
          <text x={22} y={11} fontSize={9} fill="var(--muted-foreground)">gender offset</text>
          <line x1={0} y1={22} x2={18} y2={22} stroke="var(--brand-cyan)" strokeWidth={2} />
          <text x={22} y={25} fontSize={9} fill="var(--muted-foreground)">A−B+C vector</text>
          {noise > 0 && <>
            <line x1={0} y1={36} x2={18} y2={36} stroke="var(--success)" strokeWidth={2} strokeDasharray="4 4" />
            <text x={22} y={39} fontSize={9} fill="var(--muted-foreground)">true answer</text>
          </>}
        </g>

        {/* Noise bar */}
        {noise > 0 && (
          <g transform={`translate(${PAD}, ${H - PAD - 16})`}>
            <rect x={0} y={0} width={W - 2 * PAD} height={4} rx="2" fill="var(--border)" />
            <rect x={0} y={0} width={mapRange(noise, 0, 10, 0, W - 2 * PAD)} height={4} rx="2" fill="var(--warning)" opacity={0.75} />
            <text x={2} y={-3} fontSize={8} fill="var(--warning)" opacity={0.8}>noise level</text>
          </g>
        )}
      </svg>
    </VizFrame>
  );
}
