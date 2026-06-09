"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 360, PAD = 48;
const CX = W / 2, CY = H / 2;
const SCALE = 70;

const sx = (v: number) => CX + v * SCALE;
const sy = (v: number) => CY - v * SCALE;

function applyMatrix(a: number, b: number, c: number, d: number, x: number, y: number): [number, number] {
  return [a * x + b * y, c * x + d * y];
}

function det(a: number, b: number, c: number, d: number): number {
  return a * d - b * c;
}

function dot(x1: number, y1: number, x2: number, y2: number): number {
  return x1 * x2 + y1 * y2;
}

function norm(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

type Mode = "transform" | "dot";

export default function Viz() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);
  const [mode, setMode] = useState<Mode>("transform");
  const [vx, setVx] = useState(1);
  const [vy, setVy] = useState(0.5);
  const [wx, setWx] = useState(0.5);
  const [wy, setWy] = useState(1);

  const detVal = useMemo(() => det(a, b, c, d), [a, b, c, d]);

  // Transformed unit square corners: (0,0),(1,0),(1,1),(0,1)
  const corners: [number, number][] = useMemo(() => [
    [0, 0], [1, 0], [1, 1], [0, 1],
  ], []);
  const transformed = useMemo(
    () => corners.map(([x, y]) => applyMatrix(a, b, c, d, x, y)),
    [a, b, c, d, corners]
  );

  // Basis vectors transformed
  const e1T = useMemo(() => applyMatrix(a, b, c, d, 1, 0), [a, b, c, d]);
  const e2T = useMemo(() => applyMatrix(a, b, c, d, 0, 1), [a, b, c, d]);

  // Dot product mode
  const dotVal = useMemo(() => dot(vx, vy, wx, wy), [vx, vy, wx, wy]);
  const normV = useMemo(() => norm(vx, vy), [vx, vy]);
  const normW = useMemo(() => norm(wx, wy), [wx, wy]);
  const cosTheta = useMemo(
    () => (normV > 0.001 && normW > 0.001 ? dotVal / (normV * normW) : 0),
    [dotVal, normV, normW]
  );
  const angleDeg = useMemo(() => (Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI, [cosTheta]);

  const parallelogramPts = useMemo(() => {
    const pts = transformed.map(([tx, ty]) => `${sx(tx).toFixed(1)},${sy(ty).toFixed(1)}`);
    return pts.join(" ");
  }, [transformed]);

  const detColor = Math.abs(detVal) < 0.05 ? "var(--danger)" : detVal < 0 ? "var(--warning)" : "var(--success)";
  const dotColor = dotVal > 0.05 ? "var(--brand-indigo)" : dotVal < -0.05 ? "var(--brand-pink)" : "var(--muted-foreground)";

  const reset = () => { setA(1); setB(0); setC(0); setD(1); };

  const gridLines = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <VizFrame
      title="Linear Algebra: Matrices as Transformations"
      hint="tune matrix entries and watch space transform"
      controls={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SegButton active={mode === "transform"} onClick={() => setMode("transform")}>Matrix Transform</SegButton>
            <SegButton active={mode === "dot"} onClick={() => setMode("dot")}>Dot Product</SegButton>
            {mode === "transform" && (
              <VizButton onClick={reset} className="ml-auto"><RotateCcw size={13} /> Reset</VizButton>
            )}
          </div>
          {mode === "transform" ? (
            <ControlGroup>
              <Slider label="a (col 1, row 1)" min={-2} max={2} step={0.05} value={a} onChange={setA} format={(v) => v.toFixed(2)} />
              <Slider label="b (col 2, row 1)" min={-2} max={2} step={0.05} value={b} onChange={setB} format={(v) => v.toFixed(2)} />
              <Slider label="c (col 1, row 2)" min={-2} max={2} step={0.05} value={c} onChange={setC} format={(v) => v.toFixed(2)} />
              <Slider label="d (col 2, row 2)" min={-2} max={2} step={0.05} value={d} onChange={setD} format={(v) => v.toFixed(2)} />
            </ControlGroup>
          ) : (
            <ControlGroup>
              <Slider label="v.x" min={-2} max={2} step={0.1} value={vx} onChange={setVx} format={(v) => v.toFixed(1)} />
              <Slider label="v.y" min={-2} max={2} step={0.1} value={vy} onChange={setVy} format={(v) => v.toFixed(1)} />
              <Slider label="w.x" min={-2} max={2} step={0.1} value={wx} onChange={setWx} format={(v) => v.toFixed(1)} />
              <Slider label="w.y" min={-2} max={2} step={0.1} value={wy} onChange={setWy} format={(v) => v.toFixed(1)} />
            </ControlGroup>
          )}
          {mode === "transform" ? (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Matrix: <span className="font-mono text-foreground">[{a.toFixed(1)} {b.toFixed(1)}; {c.toFixed(1)} {d.toFixed(1)}]</span></span>
              <span>det = <span className="font-mono font-semibold" style={{ color: detColor }}>{detVal.toFixed(2)}</span></span>
              <span className="text-muted-foreground">{Math.abs(detVal) < 0.05 ? "⚠ space collapses (singular)" : detVal < 0 ? "flips orientation" : "preserves orientation"}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>v·w = <span className="font-mono font-semibold" style={{ color: dotColor }}>{dotVal.toFixed(2)}</span></span>
              <span>angle = <span className="font-mono text-foreground">{angleDeg.toFixed(1)}°</span></span>
              <span>{angleDeg > 90 ? "obtuse — pointing away" : angleDeg < 10 ? "nearly parallel" : "acute — same direction"}</span>
            </div>
          )}
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid */}
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={sx(g)} y1={PAD} x2={sx(g)} y2={H - PAD} stroke="var(--border)" strokeWidth={g === 0 ? 1.5 : 0.7} opacity={g === 0 ? 0.8 : 0.4} />
            <line x1={PAD} y1={sy(g)} x2={W - PAD} y2={sy(g)} stroke="var(--border)" strokeWidth={g === 0 ? 1.5 : 0.7} opacity={g === 0 ? 0.8 : 0.4} />
          </g>
        ))}

        {mode === "transform" ? (
          <>
            {/* Original unit square */}
            <polygon
              points={`${sx(0)},${sy(0)} ${sx(1)},${sy(0)} ${sx(1)},${sy(1)} ${sx(0)},${sy(1)}`}
              fill="var(--brand-indigo)"
              fillOpacity="0.13"
              stroke="var(--brand-indigo)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Transformed parallelogram */}
            <polygon
              points={parallelogramPts}
              fill="var(--brand-indigo)"
              fillOpacity="0.25"
              stroke="var(--brand-indigo)"
              strokeWidth="2"
            />
            {/* Original basis vectors (dashed) */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(0)} stroke="var(--brand-cyan)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
            <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(1)} stroke="var(--brand-pink)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
            {/* Transformed e1 */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(e1T[0])} y2={sy(e1T[1])} stroke="var(--brand-cyan)" strokeWidth="2.5" />
            <circle cx={sx(e1T[0])} cy={sy(e1T[1])} r={5} fill="var(--brand-cyan)" />
            <text x={sx(e1T[0]) + 7} y={sy(e1T[1]) + 4} fontSize="11" fill="var(--brand-cyan)" fontWeight="600">e₁′</text>
            {/* Transformed e2 */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(e2T[0])} y2={sy(e2T[1])} stroke="var(--brand-pink)" strokeWidth="2.5" />
            <circle cx={sx(e2T[0])} cy={sy(e2T[1])} r={5} fill="var(--brand-pink)" />
            <text x={sx(e2T[0]) + 7} y={sy(e2T[1]) + 4} fontSize="11" fill="var(--brand-pink)" fontWeight="600">e₂′</text>
            {/* Origin dot */}
            <circle cx={sx(0)} cy={sy(0)} r={4} fill="var(--foreground)" />
            {/* Matrix label */}
            <text x={W - PAD - 4} y={PAD + 14} textAnchor="end" fontSize="12" fill="var(--muted-foreground)" fontFamily="monospace">
              [{a.toFixed(1)} {b.toFixed(1)}]
            </text>
            <text x={W - PAD - 4} y={PAD + 28} textAnchor="end" fontSize="12" fill="var(--muted-foreground)" fontFamily="monospace">
              [{c.toFixed(1)} {d.toFixed(1)}]
            </text>
            <text x={W - PAD - 4} y={PAD + 48} textAnchor="end" fontSize="11" style={{ fill: detColor }} fontFamily="monospace">
              det={detVal.toFixed(2)}
            </text>
          </>
        ) : (
          <>
            {/* Projection shadow of v onto w */}
            {normW > 0.001 && (
              <>
                <line
                  x1={sx(0)} y1={sy(0)}
                  x2={sx((dotVal / (normW * normW)) * wx)}
                  y2={sy((dotVal / (normW * normW)) * wy)}
                  stroke="var(--brand-indigo)"
                  strokeWidth="4"
                  strokeOpacity="0.3"
                />
                <line
                  x1={sx((dotVal / (normW * normW)) * wx)}
                  y1={sy((dotVal / (normW * normW)) * wy)}
                  x2={sx(vx)} y2={sy(vy)}
                  stroke="var(--muted-foreground)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
              </>
            )}
            {/* Vector w */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(wx)} y2={sy(wy)} stroke="var(--brand-pink)" strokeWidth="2.5" />
            <circle cx={sx(wx)} cy={sy(wy)} r={6} fill="var(--brand-pink)" />
            <text x={sx(wx) + 8} y={sy(wy) + 4} fontSize="12" fill="var(--brand-pink)" fontWeight="600">w</text>
            {/* Vector v */}
            <line x1={sx(0)} y1={sy(0)} x2={sx(vx)} y2={sy(vy)} stroke="var(--brand-cyan)" strokeWidth="2.5" />
            <circle cx={sx(vx)} cy={sy(vy)} r={6} fill="var(--brand-cyan)" />
            <text x={sx(vx) + 8} y={sy(vy) + 4} fontSize="12" fill="var(--brand-cyan)" fontWeight="600">v</text>
            {/* Arc for angle */}
            {normV > 0.1 && normW > 0.1 && (
              <text x={CX + 22} y={CY - 10} fontSize="11" fill="var(--muted-foreground)">{angleDeg.toFixed(0)}°</text>
            )}
            {/* Dot product readout */}
            <text x={W - PAD - 4} y={PAD + 14} textAnchor="end" fontSize="12" fontFamily="monospace" style={{ fill: dotColor }}>
              v·w = {dotVal.toFixed(2)}
            </text>
            <text x={W - PAD - 4} y={PAD + 30} textAnchor="end" fontSize="11" fill="var(--muted-foreground)" fontFamily="monospace">
              cos θ = {cosTheta.toFixed(2)}
            </text>
            {/* Origin */}
            <circle cx={sx(0)} cy={sy(0)} r={4} fill="var(--foreground)" />
          </>
        )}
      </svg>
    </VizFrame>
  );
}
