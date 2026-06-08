"use client";

import { useMemo, useRef, useState } from "react";
import { rng, gaussian } from "@/lib/mathx";
import { Slider } from "@/components/viz/controls";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["var(--brand-violet)", "var(--brand-cyan)", "var(--brand-pink)", "var(--brand-indigo)", "var(--warning)", "var(--success)"];

const FN_NAMES = ["sin","cos","tan","asin","acos","atan","atan2","exp","log","ln","log10","log2","sqrt","cbrt","abs","sign","floor","ceil","round","min","max","pow","mod","hypot","clamp","normal","sigmoid","relu","gelu","softplus","gauss","step","lerp","pi","e","PI","E","tau","TAU"];
const FN_VALUES: unknown[] = [Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan, Math.atan2, Math.exp, Math.log, Math.log, (x: number) => Math.log10(x), (x: number) => Math.log2(x), Math.sqrt, Math.cbrt, Math.abs, Math.sign, Math.floor, Math.ceil, Math.round, Math.min, Math.max, Math.pow, (a: number, b: number) => ((a % b) + b) % b, Math.hypot, (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x)),
  (x: number, mu = 0, s = 1) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)),
  (x: number) => 1 / (1 + Math.exp(-x)),
  (x: number) => Math.max(0, x),
  (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
  (x: number) => Math.log(1 + Math.exp(x)),
  (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI),
  (x: number) => (x >= 0 ? 1 : 0),
  (a: number, b: number, t: number) => a + (b - a) * t,
  Math.PI, Math.E, Math.PI, Math.E, 2 * Math.PI, 2 * Math.PI];

const SAFE = /^[-+*/^().,0-9a-zA-Z_ \t]*$/;

function compile(expr: string): { fn: ((x: number, a: number, b: number, c: number, d: number) => number) | null; error: string | null } {
  const e = expr.trim();
  if (!e) return { fn: null, error: null };
  if (!SAFE.test(e)) return { fn: null, error: "invalid characters" };
  const body = e.replace(/\bln\b/g, "log").replace(/\^/g, "**");
  try {
    // eslint-disable-next-line no-new-func
    const raw = new Function("x", "a", "b", "c", "d", ...FN_NAMES, `return (${body});`) as unknown as (...args: unknown[]) => unknown;
    const fn = (x: number, a: number, b: number, c: number, d: number) => raw(x, a, b, c, d, ...FN_VALUES) as number;
    const t = fn(1, 1, 1, 1, 1);
    if (typeof t !== "number") return { fn: null, error: "not a number" };
    return { fn, error: null };
  } catch {
    return { fn: null, error: "syntax error" };
  }
}

let idCounter = 0;
const nextId = () => ++idCounter;

export function FunctionSandbox() {
  const [exprs, setExprs] = useState([
    { id: nextId(), text: "a * sin(b * x)", color: COLORS[0], visible: true },
    { id: nextId(), text: "normal(x, 0, c)", color: COLORS[1], visible: true },
  ]);
  const [a, setA] = useState(1.5);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(0);
  const [xmin, setXmin] = useState(-6);
  const [xmax, setXmax] = useState(6);
  const [autoY, setAutoY] = useState(true);
  const [ymin, setYmin] = useState(-3);
  const [ymax, setYmax] = useState(3);
  const [showData, setShowData] = useState(false);
  const [noise, setNoise] = useState(0.3);
  const [cursor, setCursor] = useState<number | null>(null);

  const W = 720, H = 420, PAD = 34;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const compiled = useMemo(() => exprs.map((ex) => ({ ...ex, ...compile(ex.text) })), [exprs]);

  const SAMPLES = 480;
  const series = useMemo(() => {
    return compiled.map((ex) => {
      if (!ex.fn || !ex.visible) return { id: ex.id, color: ex.color, pts: [] as ({ x: number; y: number } | null)[] };
      const pts: ({ x: number; y: number } | null)[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        const x = xmin + (i / (SAMPLES - 1)) * (xmax - xmin);
        const y = ex.fn(x, a, b, c, d);
        pts.push(Number.isFinite(y) ? { x, y } : null);
      }
      return { id: ex.id, color: ex.color, pts };
    });
  }, [compiled, a, b, c, d, xmin, xmax]);

  const data = useMemo(() => {
    if (!showData) return [];
    const first = compiled.find((e) => e.fn && e.visible);
    if (!first || !first.fn) return [];
    const r = rng(20240608);
    return Array.from({ length: 50 }, () => {
      const x = xmin + r() * (xmax - xmin);
      return { x, y: first.fn!(x, a, b, c, d) + gaussian(r, 0, noise) };
    });
  }, [showData, compiled, a, b, c, d, xmin, xmax, noise]);

  const yBounds = useMemo(() => {
    if (!autoY) return [ymin, ymax] as [number, number];
    const ys: number[] = [];
    for (const s of series) for (const p of s.pts) if (p && Math.abs(p.y) < 1e6) ys.push(p.y);
    for (const p of data) if (Math.abs(p.y) < 1e6) ys.push(p.y);
    if (!ys.length) return [-3, 3] as [number, number];
    let lo = Math.min(...ys), hi = Math.max(...ys);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    return [lo - pad, hi + pad] as [number, number];
  }, [series, data, autoY, ymin, ymax]);

  const [ylo, yhi] = yBounds;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - ylo) / (yhi - ylo)) * (H - 2 * PAD);

  const pathFor = (pts: ({ x: number; y: number } | null)[]) => {
    let dstr = "", pen = false;
    for (const p of pts) {
      if (!p || sy(p.y) < -1e4 || sy(p.y) > 1e4) { pen = false; continue; }
      dstr += `${pen ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)} `;
      pen = true;
    }
    return dstr;
  };

  const gridXs = useMemo(() => niceTicks(xmin, xmax), [xmin, xmax]);
  const gridYs = useMemo(() => niceTicks(ylo, yhi), [ylo, yhi]);

  const onMove = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px < PAD || px > W - PAD) { setCursor(null); return; }
    setCursor(xmin + ((px - PAD) / (W - 2 * PAD)) * (xmax - xmin));
  };

  const update = (id: number, patch: Partial<{ text: string; visible: boolean }>) =>
    setExprs((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const add = () =>
    setExprs((xs) => [...xs, { id: nextId(), text: "", color: COLORS[xs.length % COLORS.length], visible: true }]);
  const remove = (id: number) => setExprs((xs) => xs.filter((x) => x.id !== id));

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Left: expression editor + params */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expressions y =</div>
          <div className="flex flex-col gap-2">
            {compiled.map((ex) => (
              <div key={ex.id} className="flex items-center gap-1.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ex.color }} />
                <input
                  value={ex.text}
                  onChange={(e) => update(ex.id, { text: e.target.value })}
                  spellCheck={false}
                  className={cn(
                    "h-9 w-full rounded-lg border bg-background px-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30",
                    ex.error ? "border-danger/60" : "border-border focus:border-brand-violet/50",
                  )}
                  placeholder="e.g. a*sin(b*x)"
                />
                <button onClick={() => update(ex.id, { visible: !ex.visible })} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="toggle">
                  {ex.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => remove(ex.id)} className="shrink-0 text-muted-foreground hover:text-danger" aria-label="delete">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={add} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-violet hover:bg-muted">
            <Plus size={14} /> Add expression
          </button>
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
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">View</div>
          <div className="grid grid-cols-2 gap-3">
            <Slider label="x min" min={-50} max={0} step={0.5} value={xmin} onChange={setXmin} format={(v) => v.toFixed(0)} />
            <Slider label="x max" min={0.5} max={50} step={0.5} value={xmax} onChange={setXmax} format={(v) => v.toFixed(0)} />
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={autoY} onChange={(e) => setAutoY(e.target.checked)} style={{ accentColor: "var(--brand-violet)" }} /> auto-fit y-axis
          </label>
          {!autoY && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Slider label="y min" min={-50} max={0} step={0.5} value={ymin} onChange={setYmin} format={(v) => v.toFixed(0)} />
              <Slider label="y max" min={0.5} max={50} step={0.5} value={ymax} onChange={setYmax} format={(v) => v.toFixed(0)} />
            </div>
          )}
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showData} onChange={(e) => setShowData(e.target.checked)} style={{ accentColor: "var(--brand-cyan)" }} /> scatter noisy samples from first curve
          </label>
          {showData && (
            <div className="mt-2"><Slider label="noise σ" min={0} max={2} step={0.05} value={noise} onChange={setNoise} format={(v) => v.toFixed(2)} /></div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Functions:</span> sin, cos, exp, ln, log10, sqrt, abs, pow, min, max, mod, clamp, lerp, <span className="text-brand-violet">normal(x,μ,σ)</span>, <span className="text-brand-violet">sigmoid</span>, <span className="text-brand-violet">relu</span>, <span className="text-brand-violet">gelu</span>, <span className="text-brand-violet">softplus</span>, gauss, step. Constants: pi, e, tau. Use <span className="font-mono">^</span> for powers and params <span className="font-mono">a b c d</span>.
        </div>
      </div>

      {/* Right: plot */}
      <div className="rounded-2xl border border-border bg-card p-2">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setCursor(null)}>
          {gridXs.map((t, i) => (
            <line key={"gx" + i} x1={sx(t)} y1={PAD} x2={sx(t)} y2={H - PAD} stroke="var(--border)" opacity="0.4" />
          ))}
          {gridYs.map((t, i) => (
            <line key={"gy" + i} x1={PAD} y1={sy(t)} x2={W - PAD} y2={sy(t)} stroke="var(--border)" opacity="0.4" />
          ))}
          {/* axes */}
          {ylo <= 0 && yhi >= 0 && <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--muted-foreground)" strokeWidth="1.2" />}
          {xmin <= 0 && xmax >= 0 && <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--muted-foreground)" strokeWidth="1.2" />}
          {gridXs.map((t, i) => (
            <text key={"lx" + i} x={sx(t)} y={H - PAD + 14} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>
          ))}
          {gridYs.map((t, i) => (
            <text key={"ly" + i} x={PAD - 5} y={sy(t) + 3} textAnchor="end" className="fill-[var(--muted-foreground)] text-[9px]">{fmt(t)}</text>
          ))}
          {/* data scatter */}
          {data.map((p, i) => (
            <circle key={"d" + i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill="var(--brand-cyan)" opacity="0.55" />
          ))}
          {/* curves */}
          {series.map((s) => (
            <path key={s.id} d={pathFor(s.pts)} fill="none" stroke={s.color} strokeWidth="2.2" />
          ))}
          {/* cursor */}
          {cursor !== null && (
            <>
              <line x1={sx(cursor)} y1={PAD} x2={sx(cursor)} y2={H - PAD} stroke="var(--brand-violet)" strokeDasharray="3 3" opacity="0.5" />
              {compiled.filter((e) => e.fn && e.visible).map((e) => {
                const y = e.fn!(cursor, a, b, c, d);
                if (!Number.isFinite(y)) return null;
                return <circle key={"c" + e.id} cx={sx(cursor)} cy={sy(y)} r={3.5} fill={e.color} stroke="var(--background)" strokeWidth="1.5" />;
              })}
            </>
          )}
        </svg>
        {cursor !== null && (
          <div className="flex flex-wrap items-center gap-3 px-2 pb-1 pt-1 text-xs">
            <span className="font-mono text-muted-foreground">x = {fmt(cursor)}</span>
            {compiled.filter((e) => e.fn && e.visible).map((e) => {
              const y = e.fn!(cursor!, a, b, c, d);
              return <span key={e.id} className="font-mono" style={{ color: e.color }}>{Number.isFinite(y) ? fmt(y) : "—"}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(v: number) {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
  return (Math.round(v * 100) / 100).toString();
}

function niceTicks(lo: number, hi: number) {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const step = Math.pow(10, Math.floor(Math.log10(span / 6)));
  const mult = span / 6 / step;
  const s = mult >= 5 ? step * 5 : mult >= 2 ? step * 2 : step;
  const out: number[] = [];
  for (let t = Math.ceil(lo / s) * s; t <= hi; t += s) out.push(Math.round(t / s) * s);
  return out;
}
