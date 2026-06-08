"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rng, gaussian, polyfit, polyval, rSquared } from "@/lib/mathx";
import { Slider } from "@/components/viz/controls";
import {
  Plus, Trash2, Eye, EyeOff, Activity, Maximize2, ZoomIn, ZoomOut, Share2, Check, Dice5,
  LineChart, LayoutGrid, Save, FolderOpen, Crosshair, Table,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["var(--brand-violet)", "var(--brand-cyan)", "var(--brand-pink)", "var(--brand-indigo)", "var(--warning)", "var(--success)"];

const FN_NAMES = ["sin","cos","tan","asin","acos","atan","atan2","sinh","cosh","exp","log","ln","log10","log2","sqrt","cbrt","abs","sign","floor","ceil","round","min","max","pow","mod","hypot","clamp","normal","sigmoid","relu","gelu","softplus","gauss","step","lerp","pi","e","PI","E","tau","TAU"];
const FN_VALUES: unknown[] = [Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan, Math.atan2, Math.sinh, Math.cosh, Math.exp, Math.log, Math.log, (x: number) => Math.log10(x), (x: number) => Math.log2(x), Math.sqrt, Math.cbrt, Math.abs, Math.sign, Math.floor, Math.ceil, Math.round, Math.min, Math.max, Math.pow, (a: number, b: number) => ((a % b) + b) % b, Math.hypot, (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x)),
  (x: number, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)),
  (x: number) => 1 / (1 + Math.exp(-x)), (x: number) => Math.max(0, x),
  (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
  (x: number) => Math.log(1 + Math.exp(x)), (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI),
  (x: number) => (x >= 0 ? 1 : 0), (a: number, b: number, t: number) => a + (b - a) * t,
  Math.PI, Math.E, Math.PI, Math.E, 2 * Math.PI, 2 * Math.PI];

const SAFE = /^[-+*/^().,0-9a-zA-Z_ \t]*$/;

/** Build a callable from an expression with the given leading variable names (x, or x+y). */
function core(expr: string, varNames: string[]): { call: ((...args: number[]) => number) | null; error: string | null } {
  const e = expr.trim();
  if (!e) return { call: null, error: null };
  if (!SAFE.test(e)) return { call: null, error: "invalid characters" };
  const body = e.replace(/\bln\b/g, "log").replace(/\^/g, "**");
  try {
    const raw = new Function(...varNames, "a", "b", "c", "d", ...FN_NAMES, `return (${body});`) as unknown as (...args: unknown[]) => unknown;
    const call = (...args: number[]) => raw(...args, ...FN_VALUES) as number;
    const probe = call(...varNames.map(() => 1), 1, 1, 1, 1);
    if (typeof probe !== "number") return { call: null, error: "not a number" };
    return { call, error: null };
  } catch {
    return { call: null, error: "syntax error" };
  }
}

function compile(expr: string): { fn: ((x: number, a: number, b: number, c: number, d: number) => number) | null; error: string | null } {
  const { call, error } = core(expr, ["x"]);
  return { fn: (call as unknown as ((x: number, a: number, b: number, c: number, d: number) => number) | null) ?? null, error };
}
function compile2(expr: string): { fn: ((x: number, y: number, a: number, b: number, c: number, d: number) => number) | null; error: string | null } {
  const { call, error } = core(expr, ["x", "y"]);
  return { fn: (call as unknown as ((x: number, y: number, a: number, b: number, c: number, d: number) => number) | null) ?? null, error };
}

type Pt = { x: number; y: number };
type Expr = { id: number; text: string; color: string; visible: boolean; deriv: boolean };
type View = { xmin: number; xmax: number; ymin: number; ymax: number };
type Mode = "curve" | "heatmap";
type DataSrc = "none" | "synthetic" | "csv";
type Snapshot = {
  mode: Mode; e: [string, string, number, number][]; h: string;
  p: [number, number, number, number]; v: [number, number, number, number];
  ds: DataSrc; dn: number; dno: number; dse: number; cv: string;
  fo: number; fd: number; mr: number; mi: number; ct: number;
};
type SavedPlot = { name: string; snap: Snapshot };

const DEFAULT_VIEW: View = { xmin: -6, xmax: 6, ymin: -3, ymax: 3 };
const SAVE_KEY = "prism-sandbox-saves-v1";

const PRESETS: { name: string; mode: Mode; exprs?: string[]; heat?: string; params?: [number, number, number, number] }[] = [
  { name: "Distributions", mode: "curve", exprs: ["normal(x, d, c)", "normal(x, d+2, c*0.6)"], params: [1, 1, 1, 0] },
  { name: "Activations", mode: "curve", exprs: ["sigmoid(a*x)", "relu(x)", "gelu(x)"], params: [1.5, 1, 1, 0] },
  { name: "Damped wave", mode: "curve", exprs: ["a*exp(-0.2*x)*sin(b*x)"], params: [3, 2, 1, 0] },
  { name: "Logistic growth", mode: "curve", exprs: ["a / (1 + exp(-b*(x-d)))"], params: [1, 2, 1, 0] },
  { name: "Polynomial", mode: "curve", exprs: ["a*x^3 + b*x^2 + c*x + d"], params: [0.2, -1, 0.5, 0] },
  { name: "Gaussian hill", mode: "heatmap", heat: "exp(-(x*x + y*y) / a)", params: [4, 1, 1, 0] },
  { name: "Saddle", mode: "heatmap", heat: "a*(x*x - y*y)", params: [0.4, 1, 1, 0] },
  { name: "Ripples", mode: "heatmap", heat: "sin(a*sqrt(x*x + y*y))", params: [2, 1, 1, 0] },
  { name: "Interference", mode: "heatmap", heat: "sin(a*x) * cos(b*y)", params: [1.5, 1.5, 1, 0] },
];

let idc = 0;
const nid = () => ++idc;

const W = 720, H = 440, PAD = 36;
const PLOTW = W - 2 * PAD, PLOTH = H - 2 * PAD;

const VIRIDIS = ["#440154", "#414487", "#2a788e", "#22a884", "#7ad151", "#fde725"];
function hexRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function viridis(t: number): string {
  const u = Math.max(0, Math.min(1, t)) * (VIRIDIS.length - 1);
  const i = Math.floor(u), f = u - i;
  const c0 = hexRgb(VIRIDIS[i]), c1 = hexRgb(VIRIDIS[Math.min(i + 1, VIRIDIS.length - 1)]);
  return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * f)},${Math.round(c0[1] + (c1[1] - c0[1]) * f)},${Math.round(c0[2] + (c1[2] - c0[2]) * f)})`;
}
function quantile(sorted: number[], q: number): number {
  const n = sorted.length;
  if (!n) return 0;
  const idx = (n - 1) * q, lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function zoomAt(v: View, px: number, py: number, f: number): View {
  const cx = v.xmin + ((px - PAD) / PLOTW) * (v.xmax - v.xmin);
  const cy = v.ymin + ((H - PAD - py) / PLOTH) * (v.ymax - v.ymin);
  return { xmin: cx - (cx - v.xmin) * f, xmax: cx + (v.xmax - cx) * f, ymin: cy - (cy - v.ymin) * f, ymax: cy + (v.ymax - cy) * f };
}

function fmt(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return (Math.round(v * 1000) / 1000).toString();
}

function niceTicks(lo: number, hi: number) {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const step = Math.pow(10, Math.floor(Math.log10(span / 7)));
  const mult = span / 7 / step;
  const s = mult >= 5 ? step * 5 : mult >= 2 ? step * 2 : step;
  const out: number[] = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi; t += s) out.push(Math.round(t / s) * s);
  return out;
}

/** Parse pasted text into points. Accepts "x,y" / "x y" / "x\ty" rows; single column -> y vs index. */
function parseCSV(text: string): Pt[] {
  const pts: Pt[] = [];
  for (const line of text.split(/[\n\r;]+/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(/[\s,]+/).map(Number);
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) pts.push({ x: parts[0], y: parts[1] });
    else if (parts.length === 1 && Number.isFinite(parts[0])) pts.push({ x: pts.length, y: parts[0] });
  }
  return pts;
}

function bisect(g: (x: number) => number, lo: number, hi: number): number {
  let flo = g(lo);
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2, fm = g(mid);
    if (fm === 0 || hi - lo < 1e-10) return mid;
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}
function scanZeros(g: (x: number) => number, xmin: number, xmax: number, n: number, cap = 40): number[] {
  const out: number[] = [];
  let px = xmin, pv = g(px);
  for (let i = 1; i <= n && out.length < cap; i++) {
    const x = xmin + (i / n) * (xmax - xmin), v = g(x);
    if (Number.isFinite(pv) && Number.isFinite(v) && pv * v < 0) out.push(bisect(g, px, x));
    px = x; pv = v;
  }
  return out;
}

export function FunctionSandbox() {
  const [mode, setMode] = useState<Mode>("curve");
  const [exprs, setExprs] = useState<Expr[]>([
    { id: nid(), text: "a * sin(b * x)", color: COLORS[0], visible: true, deriv: false },
    { id: nid(), text: "normal(x, 0, c)", color: COLORS[1], visible: true, deriv: false },
  ]);
  const [heatExpr, setHeatExpr] = useState("sin(x) * cos(y)");
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(0);
  const [view, setView] = useState<View>(DEFAULT_VIEW);

  const [dataSrc, setDataSrc] = useState<DataSrc>("none");
  const [noise, setNoise] = useState(0.3);
  const [dataN, setDataN] = useState(60);
  const [dataSeed, setDataSeed] = useState(1);
  const [syntheticPts, setSyntheticPts] = useState<Pt[]>([]);
  const [csvText, setCsvText] = useState("");
  const [fitOn, setFitOn] = useState(false);
  const [fitDeg, setFitDeg] = useState(3);

  const [showRoots, setShowRoots] = useState(false);
  const [showInter, setShowInter] = useState(false);
  const [contours, setContours] = useState(true);

  const [cursor, setCursor] = useState<number | null>(null);
  const [hxy, setHxy] = useState<Pt | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const [saved, setSaved] = useState<SavedPlot[]>([]);
  const [saveName, setSaveName] = useState("");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; view: View } | null>(null);
  const loaded = useRef(false);

  const compiled = useMemo(() => exprs.map((ex) => ({ ...ex, ...compile(ex.text) })), [exprs]);
  const heatC = useMemo(() => compile2(heatExpr), [heatExpr]);
  const csvPts = useMemo(() => parseCSV(csvText), [csvText]);
  const dataPts = dataSrc === "csv" ? csvPts : dataSrc === "synthetic" ? syntheticPts : [];

  // refs kept in sync for effects that read latest state without re-subscribing
  const viewRef = useRef(view);
  const compiledRef = useRef(compiled);
  const paramsRef = useRef({ a, b, c, d });
  useEffect(() => {
    viewRef.current = view;
    compiledRef.current = compiled;
    paramsRef.current = { a, b, c, d };
  });

  const snapshot = (): Snapshot => ({
    mode,
    e: exprs.map((x) => [x.text, x.color, x.visible ? 1 : 0, x.deriv ? 1 : 0]),
    h: heatExpr, p: [a, b, c, d], v: [view.xmin, view.xmax, view.ymin, view.ymax],
    ds: dataSrc, dn: dataN, dno: noise, dse: dataSeed, cv: csvText,
    fo: fitOn ? 1 : 0, fd: fitDeg, mr: showRoots ? 1 : 0, mi: showInter ? 1 : 0, ct: contours ? 1 : 0,
  });

  const restore = (s: Partial<Snapshot>) => {
    if (s.mode) setMode(s.mode);
    if (s.e) setExprs(s.e.map((r) => ({ id: nid(), text: r[0], color: r[1], visible: !!r[2], deriv: !!r[3] })));
    if (typeof s.h === "string") setHeatExpr(s.h);
    if (s.p) { setA(s.p[0]); setB(s.p[1]); setC(s.p[2]); setD(s.p[3]); }
    if (s.v) setView({ xmin: s.v[0], xmax: s.v[1], ymin: s.v[2], ymax: s.v[3] });
    if (s.ds) setDataSrc(s.ds);
    if (typeof s.dn === "number") setDataN(s.dn);
    if (typeof s.dno === "number") setNoise(s.dno);
    if (typeof s.dse === "number") setDataSeed(s.dse);
    if (typeof s.cv === "string") setCsvText(s.cv);
    if (typeof s.fo === "number") setFitOn(!!s.fo);
    if (typeof s.fd === "number") setFitDeg(s.fd);
    if (typeof s.mr === "number") setShowRoots(!!s.mr);
    if (typeof s.mi === "number") setShowInter(!!s.mi);
    if (typeof s.ct === "number") setContours(!!s.ct);
  };

  // load shared state from URL hash + saved plots once
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) setSaved(JSON.parse(raw) as SavedPlot[]);
    } catch {}
    try {
      const h = window.location.hash.slice(1);
      if (h) restore(JSON.parse(decodeURIComponent(h)) as Partial<Snapshot>);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;
      setView((v) => zoomAt(v, px, py, e.deltaY > 0 ? 1.12 : 0.89));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // (re)generate synthetic data
  useEffect(() => {
    if (dataSrc !== "synthetic") return;
    const first = compiledRef.current.find((e) => e.fn && e.visible);
    if (!first || !first.fn) { setSyntheticPts([]); return; }
    const v = viewRef.current;
    const { a, b, c, d } = paramsRef.current;
    const r = rng(dataSeed * 7919 + dataN);
    setSyntheticPts(Array.from({ length: dataN }, () => {
      const x = v.xmin + r() * (v.xmax - v.xmin);
      return { x, y: first.fn!(x, a, b, c, d) + gaussian(r, 0, noise) };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSrc, noise, dataN, dataSeed]);

  const sx = (x: number) => PAD + ((x - view.xmin) / (view.xmax - view.xmin)) * PLOTW;
  const sy = (y: number) => H - PAD - ((y - view.ymin) / (view.ymax - view.ymin)) * PLOTH;

  const SAMPLES = 500;
  const series = useMemo(() => {
    if (mode !== "curve") return [];
    return compiled.flatMap((ex) => {
      if (!ex.fn || !ex.visible) return [];
      const f = ex.fn;
      const pts: (Pt | null)[] = [];
      const dpts: (Pt | null)[] = [];
      const h = (view.xmax - view.xmin) / 1000;
      for (let i = 0; i < SAMPLES; i++) {
        const x = view.xmin + (i / (SAMPLES - 1)) * (view.xmax - view.xmin);
        const y = f(x, a, b, c, d);
        pts.push(Number.isFinite(y) ? { x, y } : null);
        if (ex.deriv) {
          const dy = (f(x + h, a, b, c, d) - f(x - h, a, b, c, d)) / (2 * h);
          dpts.push(Number.isFinite(dy) ? { x, y: dy } : null);
        }
      }
      const out = [{ id: ex.id, color: ex.color, pts, dash: false }];
      if (ex.deriv) out.push({ id: ex.id + 1e6, color: ex.color, pts: dpts, dash: true });
      return out;
    });
  }, [mode, compiled, a, b, c, d, view]);

  const fit = useMemo(() => {
    if (mode !== "curve" || !fitOn || dataPts.length < fitDeg + 1) return null;
    const xs = dataPts.map((p) => p.x), ys = dataPts.map((p) => p.y);
    const coeffs = polyfit(xs, ys, fitDeg);
    const preds = xs.map((x) => polyval(coeffs, x));
    const r2 = rSquared(ys, preds);
    const rmse = Math.sqrt(ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0) / ys.length);
    const pts = Array.from({ length: 300 }, (_, i) => {
      const x = view.xmin + (i / 299) * (view.xmax - view.xmin);
      return { x, y: polyval(coeffs, x) };
    });
    return { coeffs, r2, rmse, pts };
  }, [mode, fitOn, fitDeg, dataPts, view]);

  const markers = useMemo(() => {
    if (mode !== "curve") return { roots: [] as { x: number; color: string }[], inters: [] as Pt[] };
    const vis = compiled.filter((e) => e.fn && e.visible);
    const roots: { x: number; color: string }[] = [];
    const inters: Pt[] = [];
    if (showRoots) for (const e of vis) {
      const g = (x: number) => e.fn!(x, a, b, c, d);
      for (const x of scanZeros(g, view.xmin, view.xmax, 800)) roots.push({ x, color: e.color });
    }
    if (showInter) for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const fi = vis[i].fn!, fj = vis[j].fn!;
      const g = (x: number) => fi(x, a, b, c, d) - fj(x, a, b, c, d);
      for (const x of scanZeros(g, view.xmin, view.xmax, 800)) inters.push({ x, y: fi(x, a, b, c, d) });
    }
    return { roots, inters };
  }, [mode, compiled, a, b, c, d, view, showRoots, showInter]);

  const heat = useMemo(() => {
    if (mode !== "heatmap" || !heatC.fn) return null;
    const f = heatC.fn;
    const GW = 72, GH = 48;
    const Z: number[][] = [];
    const finite: number[] = [];
    for (let j = 0; j <= GH; j++) {
      const row: number[] = [];
      const yy = view.ymax - (j / GH) * (view.ymax - view.ymin);
      for (let i = 0; i <= GW; i++) {
        const xx = view.xmin + (i / GW) * (view.xmax - view.xmin);
        const z = f(xx, yy, a, b, c, d);
        row.push(z);
        if (Number.isFinite(z)) finite.push(z);
      }
      Z.push(row);
    }
    if (!finite.length) return null;
    finite.sort((p, q) => p - q);
    const zlo = quantile(finite, 0.02), zhi = quantile(finite, 0.98);
    const span = zhi - zlo || 1;
    const cw = PLOTW / GW, ch = PLOTH / GH;
    const cells: { x: number; y: number; fill: string }[] = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const z = (Z[j][i] + Z[j][i + 1] + Z[j + 1][i] + Z[j + 1][i + 1]) / 4;
      if (!Number.isFinite(z)) continue;
      cells.push({ x: PAD + i * cw, y: PAD + j * ch, fill: viridis((z - zlo) / span) });
    }
    let contour = "";
    if (contours) {
      const xAt = (fi: number) => PAD + (fi / GW) * PLOTW;
      const yAt = (fj: number) => PAD + (fj / GH) * PLOTH;
      const LEVELS = 9;
      for (let l = 1; l < LEVELS; l++) {
        const L = zlo + (l / LEVELS) * span;
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
          const tl = Z[j][i], tr = Z[j][i + 1], bl = Z[j + 1][i], br = Z[j + 1][i + 1];
          if (!Number.isFinite(tl) || !Number.isFinite(tr) || !Number.isFinite(bl) || !Number.isFinite(br)) continue;
          const pts: [number, number][] = [];
          if ((tl - L) * (tr - L) < 0) pts.push([xAt(i + (L - tl) / (tr - tl)), yAt(j)]);
          if ((tr - L) * (br - L) < 0) pts.push([xAt(i + 1), yAt(j + (L - tr) / (br - tr))]);
          if ((bl - L) * (br - L) < 0) pts.push([xAt(i + (L - bl) / (br - bl)), yAt(j + 1)]);
          if ((tl - L) * (bl - L) < 0) pts.push([xAt(i), yAt(j + (L - tl) / (bl - tl))]);
          if (pts.length >= 2) {
            contour += `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)} `;
            if (pts.length >= 4) contour += `M${pts[2][0].toFixed(1)},${pts[2][1].toFixed(1)}L${pts[3][0].toFixed(1)},${pts[3][1].toFixed(1)} `;
          }
        }
      }
    }
    return { cells, contour, zlo, zhi, cw, ch };
  }, [mode, heatC, a, b, c, d, view, contours]);

  // paint heatmap cells to canvas (far faster than thousands of SVG rects on pan)
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode !== "heatmap" || !heat) return;
    const sc = cv.width / W;
    for (const cell of heat.cells) {
      ctx.fillStyle = cell.fill;
      ctx.fillRect(cell.x * sc, cell.y * sc, (heat.cw + 0.6) * sc, (heat.ch + 0.6) * sc);
    }
  }, [mode, heat]);

  const pathFor = (pts: (Pt | null)[]) => {
    let dstr = "", pen = false;
    for (const p of pts) {
      const py = p ? sy(p.y) : NaN;
      if (!p || py < -2e4 || py > 2e4) { pen = false; continue; }
      dstr += `${pen ? "L" : "M"}${sx(p.x).toFixed(1)},${py.toFixed(1)} `;
      pen = true;
    }
    return dstr;
  };

  const gridXs = useMemo(() => niceTicks(view.xmin, view.xmax), [view]);
  const gridYs = useMemo(() => niceTicks(view.ymin, view.ymax), [view]);

  const onDown = (e: React.MouseEvent) => { dragRef.current = { sx: e.clientX, sy: e.clientY, view }; setDragging(true); };
  const onMove = (e: React.MouseEvent) => {
    const el = svgRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    if (dragRef.current) {
      const st = dragRef.current;
      const dpx = ((e.clientX - st.sx) / rect.width) * W;
      const dpy = ((e.clientY - st.sy) / rect.height) * H;
      const ddx = (dpx / PLOTW) * (st.view.xmax - st.view.xmin);
      const ddy = (dpy / PLOTH) * (st.view.ymax - st.view.ymin);
      setView({ xmin: st.view.xmin - ddx, xmax: st.view.xmax - ddx, ymin: st.view.ymin + ddy, ymax: st.view.ymax + ddy });
      return;
    }
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    if (mode === "heatmap") {
      if (px < PAD || px > W - PAD || py < PAD || py > H - PAD) { setHxy(null); return; }
      setHxy({
        x: view.xmin + ((px - PAD) / PLOTW) * (view.xmax - view.xmin),
        y: view.ymin + ((H - PAD - py) / PLOTH) * (view.ymax - view.ymin),
      });
      return;
    }
    if (px < PAD || px > W - PAD) { setCursor(null); return; }
    setCursor(view.xmin + ((px - PAD) / PLOTW) * (view.xmax - view.xmin));
  };
  const onUp = () => { dragRef.current = null; setDragging(false); };

  const fitY = () => {
    const ys: number[] = [];
    for (const s of series) for (const p of s.pts) if (p && Math.abs(p.y) < 1e6) ys.push(p.y);
    for (const p of dataPts) if (Math.abs(p.y) < 1e6) ys.push(p.y);
    if (!ys.length) return;
    let lo = Math.min(...ys), hi = Math.max(...ys);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    setView((v) => ({ ...v, ymin: lo - pad, ymax: hi + pad }));
  };

  const frameData = () => {
    if (!dataPts.length) return;
    const xs = dataPts.map((p) => p.x), ys = dataPts.map((p) => p.y);
    let xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
    if (xlo === xhi) { xlo -= 1; xhi += 1; }
    if (ylo === yhi) { ylo -= 1; yhi += 1; }
    const px = (xhi - xlo) * 0.08, py = (yhi - ylo) * 0.12;
    setView({ xmin: xlo - px, xmax: xhi + px, ymin: ylo - py, ymax: yhi + py });
  };

  const share = () => {
    const hash = encodeURIComponent(JSON.stringify(snapshot()));
    window.history.replaceState(null, "", "#" + hash);
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  const persistSaves = (next: SavedPlot[]) => {
    setSaved(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch {}
  };
  const saveCurrent = () => {
    const name = saveName.trim();
    if (!name) return;
    persistSaves([...saved.filter((s) => s.name !== name), { name, snap: snapshot() }]);
    setSaveName("");
  };
  const delSaved = (name: string) => persistSaves(saved.filter((s) => s.name !== name));

  const loadPreset = (p: typeof PRESETS[number]) => {
    setMode(p.mode);
    if (p.mode === "curve" && p.exprs) setExprs(p.exprs.map((t, i) => ({ id: nid(), text: t, color: COLORS[i % COLORS.length], visible: true, deriv: false })));
    if (p.mode === "heatmap" && p.heat) setHeatExpr(p.heat);
    if (p.params) { setA(p.params[0]); setB(p.params[1]); setC(p.params[2]); setD(p.params[3]); }
    setView(DEFAULT_VIEW);
  };

  const update = (id: number, patch: Partial<Expr>) => setExprs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () => setExprs((xs) => [...xs, { id: nid(), text: "", color: COLORS[xs.length % COLORS.length], visible: true, deriv: false }]);
  const remove = (id: number) => setExprs((xs) => xs.filter((x) => x.id !== id));

  const visiblePresets = PRESETS.filter((p) => p.mode === mode);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* Left panel */}
      <div className="flex flex-col gap-3">
        {/* Mode switch */}
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          <SegBtn active={mode === "curve"} onClick={() => setMode("curve")}><LineChart size={14} /> Curves</SegBtn>
          <SegBtn active={mode === "heatmap"} onClick={() => setMode("heatmap")}><LayoutGrid size={14} /> Heatmap</SegBtn>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visiblePresets.map((p) => (
            <button key={p.name} onClick={() => loadPreset(p)} className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground">
              {p.name}
            </button>
          ))}
        </div>

        {mode === "curve" ? (
          <>
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expressions y =</div>
              <div className="flex flex-col gap-2">
                {compiled.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ex.color }} />
                    <input value={ex.text} onChange={(e) => update(ex.id, { text: e.target.value })} spellCheck={false}
                      className={cn("h-9 w-full rounded-lg border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30", ex.error ? "border-danger/60" : "border-border focus:border-brand-violet/50")}
                      placeholder="e.g. a*sin(b*x)" />
                    <button onClick={() => update(ex.id, { deriv: !ex.deriv })} title="toggle derivative" className={cn("shrink-0", ex.deriv ? "text-brand-cyan" : "text-muted-foreground hover:text-foreground")}><Activity size={15} /></button>
                    <button onClick={() => update(ex.id, { visible: !ex.visible })} className="shrink-0 text-muted-foreground hover:text-foreground"><span className="sr-only">toggle</span>{ex.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <button onClick={() => remove(ex.id)} className="shrink-0 text-muted-foreground hover:text-danger"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button onClick={add} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-violet hover:bg-muted"><Plus size={14} /> Add</button>
                <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  {copied ? <Check size={13} className="text-success" /> : <Share2 size={13} />}{copied ? "Link copied" : "Share"}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={showRoots} onChange={(e) => setShowRoots(e.target.checked)} style={{ accentColor: "var(--brand-violet)" }} /> <Crosshair size={12} /> roots (y=0)
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={showInter} onChange={(e) => setShowInter(e.target.checked)} style={{ accentColor: "var(--brand-pink)" }} /> intersections
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Surface z = f(x, y)</div>
            <input value={heatExpr} onChange={(e) => setHeatExpr(e.target.value)} spellCheck={false}
              className={cn("h-9 w-full rounded-lg border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30", heatC.error ? "border-danger/60" : "border-border focus:border-brand-violet/50")}
              placeholder="e.g. sin(x)*cos(y)" />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={contours} onChange={(e) => setContours(e.target.checked)} style={{ accentColor: "var(--foreground)" }} /> contour lines
              </label>
              <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                {copied ? <Check size={13} className="text-success" /> : <Share2 size={13} />}{copied ? "Copied" : "Share"}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Two free variables <span className="font-mono text-foreground">x</span>, <span className="font-mono text-foreground">y</span> plus params. Color = viridis(z); drag to pan, scroll to zoom the domain.</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parameters</div>
          <div className="grid grid-cols-2 gap-3">
            <Slider label="a" min={-10} max={10} step={0.1} value={a} onChange={setA} format={(v) => v.toFixed(1)} />
            <Slider label="b" min={-10} max={10} step={0.1} value={b} onChange={setB} format={(v) => v.toFixed(1)} />
            <Slider label="c" min={-10} max={10} step={0.1} value={c} onChange={setC} format={(v) => v.toFixed(1)} />
            <Slider label="d" min={-10} max={10} step={0.1} value={d} onChange={setD} format={(v) => v.toFixed(1)} />
          </div>
        </div>

        {mode === "curve" && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Table size={13} /> Data &amp; fitting</div>
            <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
              <SegBtn small active={dataSrc === "none"} onClick={() => setDataSrc("none")}>Off</SegBtn>
              <SegBtn small active={dataSrc === "synthetic"} onClick={() => setDataSrc("synthetic")}>Synthetic</SegBtn>
              <SegBtn small active={dataSrc === "csv"} onClick={() => setDataSrc("csv")}>Paste data</SegBtn>
            </div>

            {dataSrc === "synthetic" && (
              <div className="mt-3 space-y-3">
                <p className="text-[11px] text-muted-foreground">Noisy samples from the first visible curve.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Slider label="noise σ" min={0} max={2} step={0.05} value={noise} onChange={setNoise} format={(v) => v.toFixed(2)} />
                  <Slider label="points" min={10} max={300} step={10} value={dataN} onChange={setDataN} />
                </div>
                <button onClick={() => setDataSeed((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-foreground hover:border-brand-violet/50"><Dice5 size={13} /> Resample</button>
              </div>
            )}

            {dataSrc === "csv" && (
              <div className="mt-3 space-y-2">
                <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} spellCheck={false} rows={5}
                  className="w-full resize-y rounded-lg border border-border bg-background p-2 font-mono text-xs text-foreground outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-ring/30"
                  placeholder={"Paste x,y per line:\n1, 2.3\n2, 3.9\n3, 6.1\n(one column = y vs index)"} />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span><span className="font-mono text-foreground">{csvPts.length}</span> points parsed</span>
                  <button onClick={frameData} disabled={!csvPts.length} className="rounded-lg border border-border bg-muted px-2 py-1 text-foreground hover:border-brand-violet/50 disabled:opacity-40">Frame data</button>
                </div>
              </div>
            )}

            {dataSrc !== "none" && (
              <div className="mt-3 space-y-2 border-t border-border pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={fitOn} onChange={(e) => setFitOn(e.target.checked)} style={{ accentColor: "var(--brand-violet)" }} /> fit a polynomial to the data
                </label>
                {fitOn && (
                  <>
                    <Slider label="fit degree" min={1} max={12} step={1} value={fitDeg} onChange={setFitDeg} />
                    {fit ? (
                      <div className="rounded-lg border border-border bg-card-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        R² <span className="font-mono text-foreground">{fit.r2.toFixed(3)}</span> · RMSE <span className="font-mono text-foreground">{fit.rmse.toFixed(3)}</span>
                        {fitDeg >= 9 && <div className="mt-1 text-warning">High degree — watch for overfitting wiggle.</div>}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground">Need at least {fitDeg + 1} points to fit degree {fitDeg}.</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Saved plots */}
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Save size={13} /> Saved plots</div>
          <div className="flex gap-1.5">
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveCurrent(); }}
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-brand-violet/50 focus:ring-2 focus:ring-ring/30" placeholder="name this plot…" />
            <button onClick={saveCurrent} disabled={!saveName.trim()} className="shrink-0 rounded-lg bg-brand-violet/90 px-2.5 text-xs font-medium text-white hover:bg-brand-violet disabled:opacity-40">Save</button>
          </div>
          {saved.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {saved.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-xs">
                  <button onClick={() => restore(s.snap)} className="flex flex-1 items-center gap-1.5 truncate text-left text-foreground hover:text-brand-violet" title="load">
                    <FolderOpen size={12} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{s.snap.mode}</span>
                  </button>
                  <button onClick={() => delSaved(s.name)} className="shrink-0 text-muted-foreground hover:text-danger"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">Stored in this browser. Use Share for a link anyone can open.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Functions:</span> sin, cos, exp, ln, log10, sqrt, abs, pow, min, max, mod, clamp, lerp, <span className="text-brand-violet">normal(x,μ,σ)</span>, <span className="text-brand-violet">sigmoid</span>, relu, gelu, softplus, gauss, step. Constants pi, e, tau · <span className="font-mono">^</span> for powers · params <span className="font-mono">a b c d</span> · <span className="text-brand-cyan">drag</span> to pan, <span className="text-brand-cyan">scroll</span> to zoom.
        </div>
      </div>

      {/* Plot */}
      <div className="rounded-2xl border border-border bg-card p-2">
        <div className="mb-1 flex items-center justify-end gap-1">
          <IconBtn onClick={() => setView((v) => zoomAt(v, W / 2, H / 2, 0.8))} title="Zoom in"><ZoomIn size={15} /></IconBtn>
          <IconBtn onClick={() => setView((v) => zoomAt(v, W / 2, H / 2, 1.25))} title="Zoom out"><ZoomOut size={15} /></IconBtn>
          <IconBtn onClick={fitY} title="Fit y-axis"><Maximize2 size={15} /></IconBtn>
          <IconBtn onClick={() => setView(DEFAULT_VIEW)} title="Reset view"><span className="px-1 text-xs">Reset</span></IconBtn>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} width={W * 2} height={H * 2} className={cn("pointer-events-none absolute inset-0 h-full w-full rounded-lg", mode === "heatmap" ? "" : "hidden")} />
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={cn("relative w-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => { onUp(); setCursor(null); setHxy(null); }}>
            {gridXs.map((t, i) => <line key={"gx" + i} x1={sx(t)} y1={PAD} x2={sx(t)} y2={H - PAD} stroke="var(--border)" opacity={mode === "heatmap" ? 0.18 : 0.35} />)}
            {gridYs.map((t, i) => <line key={"gy" + i} x1={PAD} y1={sy(t)} x2={W - PAD} y2={sy(t)} stroke="var(--border)" opacity={mode === "heatmap" ? 0.18 : 0.35} />)}
            {view.ymin <= 0 && view.ymax >= 0 && <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--muted-foreground)" strokeWidth="1.2" opacity={mode === "heatmap" ? 0.4 : 1} />}
            {view.xmin <= 0 && view.xmax >= 0 && <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--muted-foreground)" strokeWidth="1.2" opacity={mode === "heatmap" ? 0.4 : 1} />}
            {gridXs.map((t, i) => <text key={"lx" + i} x={sx(t)} y={H - PAD + 13} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>)}
            {gridYs.map((t, i) => <text key={"ly" + i} x={PAD - 5} y={sy(t) + 3} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>)}

            {mode === "heatmap" && heat && contours && <path d={heat.contour} fill="none" stroke="var(--foreground)" strokeWidth="0.7" opacity="0.28" />}
            {mode === "heatmap" && hxy && !dragging && (
              <>
                <line x1={sx(hxy.x)} y1={PAD} x2={sx(hxy.x)} y2={H - PAD} stroke="var(--background)" strokeDasharray="3 3" opacity="0.7" />
                <line x1={PAD} y1={sy(hxy.y)} x2={W - PAD} y2={sy(hxy.y)} stroke="var(--background)" strokeDasharray="3 3" opacity="0.7" />
              </>
            )}

            {mode === "curve" && (
              <>
                {dataPts.map((p, i) => <circle key={"d" + i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill="var(--brand-cyan)" opacity="0.5" />)}
                {fit && <path d={pathFor(fit.pts)} fill="none" stroke="var(--foreground)" strokeWidth="2" strokeDasharray="6 3" opacity="0.9" />}
                {series.map((s) => <path key={s.id} d={pathFor(s.pts)} fill="none" stroke={s.color} strokeWidth={s.dash ? 1.5 : 2.2} strokeDasharray={s.dash ? "4 4" : undefined} opacity={s.dash ? 0.7 : 1} />)}
                {markers.roots.map((r, i) => <circle key={"r" + i} cx={sx(r.x)} cy={sy(0)} r={4.5} fill="none" stroke={r.color} strokeWidth="2" />)}
                {markers.inters.map((p, i) => <g key={"i" + i}><circle cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill="var(--brand-pink)" stroke="var(--background)" strokeWidth="1.5" /></g>)}
                {cursor !== null && !dragging && (
                  <>
                    <line x1={sx(cursor)} y1={PAD} x2={sx(cursor)} y2={H - PAD} stroke="var(--brand-violet)" strokeDasharray="3 3" opacity="0.5" />
                    {compiled.filter((e) => e.fn && e.visible).map((e) => {
                      const y = e.fn!(cursor, a, b, c, d);
                      return Number.isFinite(y) ? <circle key={"c" + e.id} cx={sx(cursor)} cy={sy(y)} r={3.5} fill={e.color} stroke="var(--background)" strokeWidth="1.5" /> : null;
                    })}
                  </>
                )}
              </>
            )}
          </svg>
        </div>

        {mode === "curve" && cursor !== null && (
          <div className="flex flex-wrap items-center gap-3 px-2 py-1 text-xs">
            <span className="font-mono text-muted-foreground">x = {fmt(cursor)}</span>
            {compiled.filter((e) => e.fn && e.visible).map((e) => {
              const y = e.fn!(cursor!, a, b, c, d);
              return <span key={e.id} className="font-mono" style={{ color: e.color }}>{fmt(y)}</span>;
            })}
          </div>
        )}
        {mode === "curve" && (showRoots || showInter) && (
          <div className="flex flex-wrap items-center gap-3 px-2 py-1 text-[11px] text-muted-foreground">
            {showRoots && <span><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-brand-violet align-middle" /> {markers.roots.length} root{markers.roots.length === 1 ? "" : "s"}</span>}
            {showInter && <span><span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-pink align-middle" /> {markers.inters.length} intersection{markers.inters.length === 1 ? "" : "s"}</span>}
          </div>
        )}
        {mode === "heatmap" && heat && (
          <div className="flex flex-wrap items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <span className="font-mono">{fmt(heat.zlo)}</span>
            <div className="h-2.5 min-w-24 flex-1 rounded" style={{ background: `linear-gradient(to right, ${VIRIDIS.join(",")})` }} />
            <span className="font-mono">{fmt(heat.zhi)}</span>
            {hxy && <span className="font-mono text-foreground">f({fmt(hxy.x)}, {fmt(hxy.y)}) = {fmt(heatC.fn!(hxy.x, hxy.y, a, b, c, d))}</span>}
          </div>
        )}
        {mode === "heatmap" && heatC.error && <div className="px-2 py-1 text-xs text-danger">{heatC.error}</div>}
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, small, children }: { active: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
      small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
      active ? "bg-brand-violet/90 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}>{children}</button>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card px-1.5 text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground">
      {children}
    </button>
  );
}
