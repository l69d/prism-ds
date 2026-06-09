"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { linspace } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, VizButton, ControlGroup } from "@/components/viz/controls";
import { Play, Pause, RotateCcw } from "lucide-react";
import { clamp } from "@/lib/utils";

const W = 620, H = 320, PAD = 36;

// Loss landscape: a Beale-inspired function with a ravine (elongated contours)
// to stress-test adaptive vs. fixed lr optimizers
const loss = (x: number, y: number) =>
  0.08 * (x * x + 10 * y * y) + 0.06 * Math.sin(2.5 * x) * Math.cos(2 * y);
const dloss_x = (x: number, y: number) =>
  0.16 * x + 0.15 * Math.cos(2.5 * x) * Math.cos(2 * y);
const dloss_y = (x: number, y: number) =>
  1.6 * y - 0.12 * Math.sin(2.5 * x) * Math.sin(2 * y);

type Pt = { x: number; y: number };
type Opt = "SGD" | "Momentum" | "RMSProp" | "Adam";

const OPTS: Opt[] = ["SGD", "Momentum", "RMSProp", "Adam"];
const COLORS: Record<Opt, string> = {
  SGD: "var(--brand-pink)",
  Momentum: "var(--brand-cyan)",
  RMSProp: "var(--warning)",
  Adam: "var(--brand-indigo)",
};

const START: Pt = { x: -2.8, y: 1.4 };

function makeState() {
  return {
    SGD:     { pt: { ...START }, vx: 0, vy: 0, gx2: 0, gy2: 0, mx: 0, my: 0, vx2: 0, vy2: 0 },
    Momentum:{ pt: { ...START }, vx: 0, vy: 0, gx2: 0, gy2: 0, mx: 0, my: 0, vx2: 0, vy2: 0 },
    RMSProp: { pt: { ...START }, vx: 0, vy: 0, gx2: 0, gy2: 0, mx: 0, my: 0, vx2: 0, vy2: 0 },
    Adam:    { pt: { ...START }, vx: 0, vy: 0, gx2: 0, gy2: 0, mx: 0, my: 0, vx2: 0, vy2: 0 },
  } as Record<Opt, { pt: Pt; vx: number; vy: number; gx2: number; gy2: number; mx: number; my: number; vx2: number; vy2: number }>;
}

function stepOpt(
  name: Opt,
  s: { pt: Pt; vx: number; vy: number; gx2: number; gy2: number; mx: number; my: number; vx2: number; vy2: number },
  lr: number,
  t: number
) {
  const gx = dloss_x(s.pt.x, s.pt.y);
  const gy = dloss_y(s.pt.x, s.pt.y);
  const beta = 0.9, beta2 = 0.999, eps = 1e-8;

  let nx = s.pt.x, ny = s.pt.y;
  let vx = s.vx, vy = s.vy;
  let gx2 = s.gx2, gy2 = s.gy2;
  let mx = s.mx, my = s.my;
  let vx2 = s.vx2, vy2 = s.vy2;

  if (name === "SGD") {
    nx -= lr * gx;
    ny -= lr * gy;
  } else if (name === "Momentum") {
    vx = beta * vx + lr * gx;
    vy = beta * vy + lr * gy;
    nx -= vx;
    ny -= vy;
  } else if (name === "RMSProp") {
    gx2 = beta * gx2 + (1 - beta) * gx * gx;
    gy2 = beta * gy2 + (1 - beta) * gy * gy;
    nx -= (lr / Math.sqrt(gx2 + eps)) * gx;
    ny -= (lr / Math.sqrt(gy2 + eps)) * gy;
  } else {
    mx = beta * mx + (1 - beta) * gx;
    my = beta * my + (1 - beta) * gy;
    vx2 = beta2 * vx2 + (1 - beta2) * gx * gx;
    vy2 = beta2 * vy2 + (1 - beta2) * gy * gy;
    const mxHat = mx / (1 - Math.pow(beta, t + 1));
    const myHat = my / (1 - Math.pow(beta, t + 1));
    const vx2Hat = vx2 / (1 - Math.pow(beta2, t + 1));
    const vy2Hat = vy2 / (1 - Math.pow(beta2, t + 1));
    nx -= (lr / (Math.sqrt(vx2Hat) + eps)) * mxHat;
    ny -= (lr / (Math.sqrt(vy2Hat) + eps)) * myHat;
  }

  return { pt: { x: clamp(nx, -3.5, 3.5), y: clamp(ny, -2.2, 2.2) }, vx, vy, gx2, gy2, mx, my, vx2, vy2 };
}

export default function Viz() {
  const [lr, setLr] = useState(0.12);
  const [visible, setVisible] = useState<Record<Opt, boolean>>({ SGD: true, Momentum: true, RMSProp: true, Adam: true });
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const stateRef = useRef(makeState());
  const pathsRef = useRef<Record<Opt, Pt[]>>({ SGD: [{ ...START }], Momentum: [{ ...START }], RMSProp: [{ ...START }], Adam: [{ ...START }] });
  const [snapshot, setSnapshot] = useState(() => ({ ...stateRef.current }));
  const [pathSnap, setPathSnap] = useState(() => ({ ...pathsRef.current }));
  const raf = useRef<number | null>(null);

  // Precompute contour grid
  const xMin = -3.5, xMax = 3.5, yMin = -2.2, yMax = 2.2;
  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const contourPaths = useMemo(() => {
    const levels = [0.05, 0.15, 0.3, 0.5, 0.75, 1.1, 1.6];
    return levels.map((level) => {
      const res: string[] = [];
      const nx = 120, ny = 80;
      const xs = linspace(xMin, xMax, nx);
      const ys = linspace(yMin, yMax, ny);
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const corners = [
            { x: xs[i], y: ys[j] }, { x: xs[i + 1], y: ys[j] },
            { x: xs[i + 1], y: ys[j + 1] }, { x: xs[i], y: ys[j + 1] },
          ];
          const vals = corners.map((c) => loss(c.x, c.y));
          const pts: { px: number; py: number }[] = [];
          for (let e = 0; e < 4; e++) {
            const a = vals[e], b = vals[(e + 1) % 4];
            if ((a < level) !== (b < level)) {
              const t = (level - a) / (b - a);
              const cx2 = corners[e].x + t * (corners[(e + 1) % 4].x - corners[e].x);
              const cy2 = corners[e].y + t * (corners[(e + 1) % 4].y - corners[e].y);
              pts.push({ px: sx(cx2), py: sy(cy2) });
            }
          }
          if (pts.length === 2) res.push(`M${pts[0].px.toFixed(1)},${pts[0].py.toFixed(1)}L${pts[1].px.toFixed(1)},${pts[1].py.toFixed(1)}`);
        }
      }
      return res.join(" ");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doStep = () => {
    const t = tick;
    const s = stateRef.current;
    const newS = makeState();
    OPTS.forEach((name) => {
      newS[name] = stepOpt(name, s[name], lr, t);
      pathsRef.current[name] = [...pathsRef.current[name].slice(-80), { ...newS[name].pt }];
    });
    stateRef.current = newS;
    setTick((prev) => prev + 1);
    setSnapshot({ ...newS });
    setPathSnap({ SGD: [...pathsRef.current.SGD], Momentum: [...pathsRef.current.Momentum], RMSProp: [...pathsRef.current.RMSProp], Adam: [...pathsRef.current.Adam] });
  };

  useEffect(() => {
    if (!running) return;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 80) { doStep(); last = t; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr]);

  const reset = () => {
    setRunning(false);
    setTick(0);
    stateRef.current = makeState();
    pathsRef.current = { SGD: [{ ...START }], Momentum: [{ ...START }], RMSProp: [{ ...START }], Adam: [{ ...START }] };
    setSnapshot({ ...stateRef.current });
    setPathSnap({ SGD: [{ ...START }], Momentum: [{ ...START }], RMSProp: [{ ...START }], Adam: [{ ...START }] });
  };

  const contourOpacity = [0.12, 0.18, 0.22, 0.26, 0.3, 0.34, 0.36];

  return (
    <VizFrame
      title="Optimizer Paths"
      hint="watch how each optimizer navigates the ravine"
      controls={
        <div className="space-y-3">
          <ControlGroup>
            <Slider label="Learning rate" min={0.01} max={0.35} step={0.01} value={lr} onChange={(v) => { setLr(v); reset(); }} format={(v) => v.toFixed(2)} />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Step {tick}</span>
              <div className="flex flex-wrap gap-1.5">
                {OPTS.map((o) => (
                  <SegButton key={o} active={visible[o]} onClick={() => setVisible((prev) => ({ ...prev, [o]: !prev[o] }))}>
                    <span style={{ color: visible[o] ? COLORS[o] : undefined }}>{o}</span>
                  </SegButton>
                ))}
              </div>
            </div>
          </ControlGroup>
          <div className="flex items-center gap-2 flex-wrap">
            <VizButton onClick={() => setRunning((r) => !r)}>{running ? <><Pause size={13} />Pause</> : <><Play size={13} />Run</>}</VizButton>
            <VizButton onClick={() => { setRunning(false); doStep(); }}><span className="text-xs">Step</span></VizButton>
            <VizButton onClick={reset}><RotateCcw size={13} />Reset</VizButton>
            <div className="ml-auto flex gap-3 text-xs text-muted-foreground font-mono">
              {OPTS.filter((o) => visible[o]).map((o) => (
                <span key={o}>
                  <span style={{ color: COLORS[o] }}>{o}</span>{" "}
                  <span className="text-foreground">{loss(snapshot[o].pt.x, snapshot[o].pt.y).toFixed(4)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Contour lines */}
        {contourPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--muted-foreground)" strokeWidth="0.8" opacity={contourOpacity[i]} />
        ))}
        {/* Minimum marker */}
        <circle cx={sx(0)} cy={sy(0)} r={5} fill="none" stroke="var(--success)" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 2" />
        <text x={sx(0) + 8} y={sy(0) + 4} fontSize="9" fill="var(--success)" opacity="0.7">min</text>
        {/* Optimizer trails */}
        {OPTS.map((name) => {
          if (!visible[name]) return null;
          const pts = pathSnap[name];
          if (pts.length < 2) return null;
          const d = "M" + pts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" L");
          return (
            <g key={name}>
              <path d={d} fill="none" stroke={COLORS[name]} strokeWidth="1.5" opacity="0.55" />
              {pts.map((p, i) => i > 0 && i % 5 === 0 && (
                <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={1.8} fill={COLORS[name]} opacity={0.3 + 0.5 * (i / pts.length)} />
              ))}
              <circle cx={sx(pts[pts.length - 1].x)} cy={sy(pts[pts.length - 1].y)} r={5} fill={COLORS[name]} stroke="var(--background)" strokeWidth="1.5" />
            </g>
          );
        })}
        {/* Start dot */}
        <circle cx={sx(START.x)} cy={sy(START.y)} r={4} fill="var(--foreground)" opacity="0.35" />
        <text x={sx(START.x) + 6} y={sy(START.y) - 5} fontSize="9" fill="var(--muted-foreground)">start</text>
      </svg>
    </VizFrame>
  );
}
