"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rng, gaussian, polyfit, polyval, rSquared } from "@/lib/mathx";
import { Slider } from "@/components/viz/controls";
import { Plus, Trash2, Eye, EyeOff, Activity, Maximize2, ZoomIn, ZoomOut, Share2, Check, Dice5 } from "lucide-react";
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

function compile(expr: string): { fn: ((x: number, a: number, b: number, c: number, d: number) => number) | null; error: string | null } {
  const e = expr.trim();
  if (!e) return { fn: null, error: null };
  if (!SAFE.test(e)) return { fn: null, error: "invalid characters" };
  const body = e.replace(/\bln\b/g, "log").replace(/\^/g, "**");
  try {
    const raw = new Function("x", "a", "b", "c", "d", ...FN_NAMES, `return (${body});`) as unknown as (...args: unknown[]) => unknown;
    const fn = (x: number, a: number, b: number, c: number, d: number) => raw(x, a, b, c, d, ...FN_VALUES) as number;
    if (typeof fn(1, 1, 1, 1, 1) !== "number") return { fn: null, error: "not a number" };
    return { fn, error: null };
  } catch {
    return { fn: null, error: "syntax error" };
  }
}

type Expr = { id: number; text: string; color: string; visible: boolean; deriv: boolean };
type View = { xmin: number; xmax: number; ymin: number; ymax: number };
const DEFAULT_VIEW: View = { xmin: -6, xmax: 6, ymin: -3, ymax: 3 };

const PRESETS: { name: string; exprs: string[]; params?: [number, number, number, number] }[] = [
  { name: "Distributions", exprs: ["normal(x, d, c)", "normal(x, d+2, c*0.6)"], params: [1, 1, 1, 0] },
  { name: "Activations", exprs: ["sigmoid(a*x)", "relu(x)", "gelu(x)"], params: [1.5, 1, 1, 0] },
  { name: "Damped wave", exprs: ["a*exp(-0.2*x)*sin(b*x)"], params: [3, 2, 1, 0] },
  { name: "Logistic growth", exprs: ["a / (1 + exp(-b*(x-d)))"], params: [1, 2, 1, 0] },
  { name: "Polynomial", exprs: ["a*x^3 + b*x^2 + c*x + d"], params: [0.2, -1, 0.5, 0] },
];

let idc = 0;
const nid = () => ++idc;

const W = 720, H = 440, PAD = 36;

function zoomAt(v: View, px: number, py: number, f: number): View {
  const cx = v.xmin + ((px - PAD) / (W - 2 * PAD)) * (v.xmax - v.xmin);
  const cy = v.ymin + ((H - PAD - py) / (H - 2 * PAD)) * (v.ymax - v.ymin);
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

export function FunctionSandbox() {
  const [exprs, setExprs] = useState<Expr[]>([
    { id: nid(), text: "a * sin(b * x)", color: COLORS[0], visible: true, deriv: false },
    { id: nid(), text: "normal(x, 0, c)", color: COLORS[1], visible: true, deriv: false },
  ]);
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(0);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [showData, setShowData] = useState(false);
  const [noise, setNoise] = useState(0.3);
  const [dataN, setDataN] = useState(60);
  const [dataSeed, setDataSeed] = useState(1);
  const [dataPts, setDataPts] = useState<{ x: number; y: number }[]>([]);
  const [fitOn, setFitOn] = useState(false);
  const [fitDeg, setFitDeg] = useState(3);
  const [cursor, setCursor] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; view: View } | null>(null);
  const viewRef = useRef(view);
  const loaded = useRef(false);

  const compiled = useMemo(() => exprs.map((ex) => ({ ...ex, ...compile(ex.text) })), [exprs]);
  const compiledRef = useRef(compiled);
  const paramsRef = useRef({ a, b, c, d });
  useEffect(() => {
    viewRef.current = view;
    compiledRef.current = compiled;
    paramsRef.current = { a, b, c, d };
  });

  // load shared state from URL hash once
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const h = window.location.hash.slice(1);
      if (!h) return;
      const s = JSON.parse(decodeURIComponent(h));
      if (s.e) setExprs(s.e.map((r: [string, string, number, number]) => ({ id: nid(), text: r[0], color: r[1], visible: !!r[2], deriv: !!r[3] })));
      if (s.p) { setA(s.p[0]); setB(s.p[1]); setC(s.p[2]); setD(s.p[3]); }
      if (s.v) setView({ xmin: s.v[0], xmax: s.v[1], ymin: s.v[2], ymax: s.v[3] });
    } catch {}
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

  // (re)generate data
  useEffect(() => {
    if (!showData) { setDataPts([]); return; }
    const first = compiledRef.current.find((e) => e.fn && e.visible);
    if (!first || !first.fn) { setDataPts([]); return; }
    const v = viewRef.current;
    const { a, b, c, d } = paramsRef.current;
    const r = rng(dataSeed * 7919 + dataN);
    setDataPts(Array.from({ length: dataN }, () => {
      const x = v.xmin + r() * (v.xmax - v.xmin);
      return { x, y: first.fn!(x, a, b, c, d) + gaussian(r, 0, noise) };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showData, noise, dataN, dataSeed]);

  const sx = (x: number) => PAD + ((x - view.xmin) / (view.xmax - view.xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - view.ymin) / (view.ymax - view.ymin)) * (H - 2 * PAD);

  const SAMPLES = 500;
  const series = useMemo(() => {
    return compiled.flatMap((ex) => {
      if (!ex.fn || !ex.visible) return [];
      const f = ex.fn;
      const pts: ({ x: number; y: number } | null)[] = [];
      const dpts: ({ x: number; y: number } | null)[] = [];
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
  }, [compiled, a, b, c, d, view]);

  const fit = useMemo(() => {
    if (!fitOn || dataPts.length < fitDeg + 1) return null;
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
  }, [fitOn, fitDeg, dataPts, view]);

  const pathFor = (pts: ({ x: number; y: number } | null)[]) => {
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
      const ddx = (dpx / (W - 2 * PAD)) * (st.view.xmax - st.view.xmin);
      const ddy = (dpy / (H - 2 * PAD)) * (st.view.ymax - st.view.ymin);
      setView({ xmin: st.view.xmin - ddx, xmax: st.view.xmax - ddx, ymin: st.view.ymin + ddy, ymax: st.view.ymax + ddy });
      return;
    }
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px < PAD || px > W - PAD) { setCursor(null); return; }
    setCursor(view.xmin + ((px - PAD) / (W - 2 * PAD)) * (view.xmax - view.xmin));
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

  const share = () => {
    const s = { e: exprs.map((x) => [x.text, x.color, x.visible ? 1 : 0, x.deriv ? 1 : 0]), p: [a, b, c, d], v: [view.xmin, view.xmax, view.ymin, view.ymax] };
    const hash = encodeURIComponent(JSON.stringify(s));
    window.history.replaceState(null, "", "#" + hash);
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  const loadPreset = (p: typeof PRESETS[number]) => {
    setExprs(p.exprs.map((t, i) => ({ id: nid(), text: t, color: COLORS[i % COLORS.length], visible: true, deriv: false })));
    if (p.params) { setA(p.params[0]); setB(p.params[1]); setC(p.params[2]); setD(p.params[3]); }
    setView(DEFAULT_VIEW);
  };

  const update = (id: number, patch: Partial<Expr>) => setExprs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () => setExprs((xs) => [...xs, { id: nid(), text: "", color: COLORS[xs.length % COLORS.length], visible: true, deriv: false }]);
  const remove = (id: number) => setExprs((xs) => xs.filter((x) => x.id !== id));

  return (
    <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
      {/* Left panel */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => loadPreset(p)} className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground">
              {p.name}
            </button>
          ))}
        </div>

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
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parameters</div>
          <div className="grid grid-cols-2 gap-3">
            <Slider label="a" min={-10} max={10} step={0.1} value={a} onChange={setA} format={(v) => v.toFixed(1)} />
            <Slider label="b" min={-10} max={10} step={0.1} value={b} onChange={setB} format={(v) => v.toFixed(1)} />
            <Slider label="c" min={-10} max={10} step={0.1} value={c} onChange={setC} format={(v) => v.toFixed(1)} />
            <Slider label="d" min={-10} max={10} step={0.1} value={d} onChange={setD} format={(v) => v.toFixed(1)} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data &amp; fitting</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showData} onChange={(e) => setShowData(e.target.checked)} style={{ accentColor: "var(--brand-cyan)" }} /> scatter noisy samples from first curve
          </label>
          {showData && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Slider label="noise σ" min={0} max={2} step={0.05} value={noise} onChange={setNoise} format={(v) => v.toFixed(2)} />
                <Slider label="points" min={10} max={300} step={10} value={dataN} onChange={setDataN} />
              </div>
              <button onClick={() => setDataSeed((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-foreground hover:border-brand-violet/50"><Dice5 size={13} /> Resample</button>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={fitOn} onChange={(e) => setFitOn(e.target.checked)} style={{ accentColor: "var(--brand-violet)" }} /> fit a polynomial to the data
              </label>
              {fitOn && (
                <>
                  <Slider label="fit degree" min={1} max={12} step={1} value={fitDeg} onChange={setFitDeg} />
                  {fit && (
                    <div className="rounded-lg border border-border bg-card-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      R² <span className="font-mono text-foreground">{fit.r2.toFixed(3)}</span> · RMSE <span className="font-mono text-foreground">{fit.rmse.toFixed(3)}</span>
                      {fitDeg >= 9 && <div className="mt-1 text-warning">High degree — watch for overfitting wiggle.</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={cn("w-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => { onUp(); setCursor(null); }}>
          {gridXs.map((t, i) => <line key={"gx" + i} x1={sx(t)} y1={PAD} x2={sx(t)} y2={H - PAD} stroke="var(--border)" opacity="0.35" />)}
          {gridYs.map((t, i) => <line key={"gy" + i} x1={PAD} y1={sy(t)} x2={W - PAD} y2={sy(t)} stroke="var(--border)" opacity="0.35" />)}
          {view.ymin <= 0 && view.ymax >= 0 && <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--muted-foreground)" strokeWidth="1.2" />}
          {view.xmin <= 0 && view.xmax >= 0 && <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--muted-foreground)" strokeWidth="1.2" />}
          {gridXs.map((t, i) => <text key={"lx" + i} x={sx(t)} y={H - PAD + 13} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>)}
          {gridYs.map((t, i) => <text key={"ly" + i} x={PAD - 5} y={sy(t) + 3} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>)}
          {dataPts.map((p, i) => <circle key={"d" + i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill="var(--brand-cyan)" opacity="0.5" />)}
          {fit && <path d={pathFor(fit.pts)} fill="none" stroke="var(--foreground)" strokeWidth="2" strokeDasharray="6 3" opacity="0.9" />}
          {series.map((s) => <path key={s.id} d={pathFor(s.pts)} fill="none" stroke={s.color} strokeWidth={s.dash ? 1.5 : 2.2} strokeDasharray={s.dash ? "4 4" : undefined} opacity={s.dash ? 0.7 : 1} />)}
          {cursor !== null && !dragging && (
            <>
              <line x1={sx(cursor)} y1={PAD} x2={sx(cursor)} y2={H - PAD} stroke="var(--brand-violet)" strokeDasharray="3 3" opacity="0.5" />
              {compiled.filter((e) => e.fn && e.visible).map((e) => {
                const y = e.fn!(cursor, a, b, c, d);
                return Number.isFinite(y) ? <circle key={"c" + e.id} cx={sx(cursor)} cy={sy(y)} r={3.5} fill={e.color} stroke="var(--background)" strokeWidth="1.5" /> : null;
              })}
            </>
          )}
        </svg>
        {cursor !== null && (
          <div className="flex flex-wrap items-center gap-3 px-2 py-1 text-xs">
            <span className="font-mono text-muted-foreground">x = {fmt(cursor)}</span>
            {compiled.filter((e) => e.fn && e.visible).map((e) => {
              const y = e.fn!(cursor!, a, b, c, d);
              return <span key={e.id} className="font-mono" style={{ color: e.color }}>{fmt(y)}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="inline-flex h-7 items-center justify-center rounded-lg border border-border bg-card px-1.5 text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground">
      {children}
    </button>
  );
}
