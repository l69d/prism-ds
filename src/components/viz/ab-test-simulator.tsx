"use client";

import { useMemo, useState } from "react";
import { rng, normalCdf, normalInv, linspace } from "@/lib/mathx";
import { VizFrame } from "./viz-frame";
import { Slider, SegButton, VizButton } from "./controls";
import { FlaskConical, Eye, Gauge, RotateCcw } from "lucide-react";

function twoPropP(cA: number, nA: number, cB: number, nB: number) {
  const pA = cA / nA, pB = cB / nB;
  const pPool = (cA + cB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB)) || 1e-9;
  const z = (pB - pA) / se;
  return { pA, pB, z, p: 2 * (1 - normalCdf(Math.abs(z))) };
}

function binom(n: number, p: number, rand: () => number) {
  let c = 0;
  for (let i = 0; i < n; i++) if (rand() < p) c++;
  return c;
}

type Tab = "experiment" | "peeking" | "power";

export function ABTestSimulator() {
  const [tab, setTab] = useState<Tab>("experiment");

  // --- experiment tab ---
  const [rateA, setRateA] = useState(0.1);
  const [rateB, setRateB] = useState(0.12);
  const [n, setN] = useState(2000);
  const [seed, setSeed] = useState(1);
  const exp = useMemo(() => {
    const r = rng(seed * 7919 + n);
    const cA = binom(n, rateA, r), cB = binom(n, rateB, r);
    const pA = cA / n, pB = cB / n;
    const seA = Math.sqrt((pA * (1 - pA)) / n), seB = Math.sqrt((pB * (1 - pB)) / n);
    const diff = pB - pA;
    const seD = Math.sqrt(seA * seA + seB * seB) || 1e-9;
    const { p } = twoPropP(cA, n, cB, n);
    return { cA, cB, pA, pB, seA, seB, diff, ciLo: diff - 1.96 * seD, ciHi: diff + 1.96 * seD, p };
  }, [rateA, rateB, n, seed]);

  // --- peeking tab (A and B identical: NO real effect) ---
  const [base, setBase] = useState(0.2);
  const [peekSeed, setPeekSeed] = useState(1);
  const [fprRuns, setFprRuns] = useState<{ peek: number; fixed: number; total: number }>({ peek: 0, fixed: 0, total: 0 });
  const peekPath = useMemo(() => {
    const r = rng(peekSeed * 104729 + Math.round(base * 1000));
    const checkpoints = 80, perStep = 30;
    let cA = 0, cB = 0, nn = 0;
    const path: { n: number; p: number }[] = [];
    let crossed = false;
    for (let k = 0; k < checkpoints; k++) {
      for (let i = 0; i < perStep; i++) { if (r() < base) cA++; if (r() < base) cB++; nn++; }
      const { p } = twoPropP(cA, nn, cB, nn);
      path.push({ n: nn, p });
      if (p < 0.05) crossed = true;
    }
    return { path, crossed, finalP: path[path.length - 1].p };
  }, [peekSeed, base]);

  const runMany = () => {
    let peek = 0, fixed = 0;
    const K = 200;
    for (let t = 0; t < K; t++) {
      const r = rng((peekSeed + t + 1) * 99991 + t);
      let cA = 0, cB = 0, nn = 0, crossed = false;
      for (let k = 0; k < 80; k++) {
        for (let i = 0; i < 30; i++) { if (r() < base) cA++; if (r() < base) cB++; nn++; }
        if (twoPropP(cA, nn, cB, nn).p < 0.05) crossed = true;
      }
      if (crossed) peek++;
      if (twoPropP(cA, nn, cB, nn).p < 0.05) fixed++;
    }
    setFprRuns({ peek, fixed, total: K });
  };

  // --- power tab ---
  const [pBase, setPBase] = useState(0.1);
  const [mde, setMde] = useState(10); // relative %
  const [power, setPower] = useState(0.8);
  const pow = useMemo(() => {
    const p1 = pBase, p2 = pBase * (1 + mde / 100);
    const d = Math.abs(p2 - p1) || 1e-9;
    const pbar = (p1 + p2) / 2;
    const zA = normalInv(0.975), zB = normalInv(power);
    const nReq = Math.ceil(((zA * Math.sqrt(2 * pbar * (1 - pbar)) + zB * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / (d * d));
    const powerAt = (nn: number) =>
      normalCdf((d * Math.sqrt(nn) - zA * Math.sqrt(2 * pbar * (1 - pbar))) / Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)));
    return { p1, p2, nReq, powerAt };
  }, [pBase, mde, power]);

  const tabs: { id: Tab; label: string; icon: typeof FlaskConical }[] = [
    { id: "experiment", label: "Run experiment", icon: FlaskConical },
    { id: "peeking", label: "The peeking trap", icon: Eye },
    { id: "power", label: "Power & sample size", icon: Gauge },
  ];

  return (
    <VizFrame title="A/B Test Simulator" hint="explore the tabs">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <SegButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            <span className="inline-flex items-center gap-1.5"><t.icon size={13} /> {t.label}</span>
          </SegButton>
        ))}
      </div>

      {tab === "experiment" && (
        <ExperimentView exp={exp} rateA={rateA} rateB={rateB} n={n} setRateA={setRateA} setRateB={setRateB} setN={setN} run={() => setSeed((s) => s + 1)} />
      )}
      {tab === "peeking" && (
        <PeekingView base={base} setBase={setBase} peekPath={peekPath} reseed={() => setPeekSeed((s) => s + 1)} runMany={runMany} fprRuns={fprRuns} />
      )}
      {tab === "power" && (
        <PowerView pow={pow} pBase={pBase} mde={mde} power={power} setPBase={setPBase} setMde={setMde} setPower={setPower} />
      )}
    </VizFrame>
  );
}

/* ---------------- Experiment view ---------------- */
type ExpResult = { cA: number; cB: number; pA: number; pB: number; seA: number; seB: number; diff: number; ciLo: number; ciHi: number; p: number };
function ExperimentView({ exp, rateA, rateB, n, setRateA, setRateB, setN, run }: {
  exp: ExpResult; rateA: number; rateB: number; n: number;
  setRateA: (v: number) => void; setRateB: (v: number) => void; setN: (v: number) => void; run: () => void;
}) {
  const W = 600, H = 110;
  const maxRate = Math.max(0.02, rateA, rateB, exp.pA, exp.pB) * 1.4;
  const bx = (v: number) => 90 + (v / maxRate) * (W - 130);
  const sig = exp.p < 0.05;
  // difference number line
  const dW = 600, dRange = Math.max(0.02, Math.abs(exp.ciLo), Math.abs(exp.ciHi)) * 1.2;
  const dx = (v: number) => dW / 2 + (v / dRange) * (dW / 2 - 30);
  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {([["A (control)", exp.pA, exp.seA, "var(--brand-cyan)", 30], ["B (variant)", exp.pB, exp.seB, "var(--brand-violet)", 70]] as [string, number, number, string, number][]).map((row, i) => (
          <g key={i}>
            <text x={8} y={row[4] + 4} className="fill-[var(--muted-foreground)] text-[11px]">{row[0]}</text>
            <rect x={90} y={row[4] - 9} width={bx(row[1]) - 90} height={18} rx={3} fill={row[3]} opacity={0.85} />
            <line x1={bx(row[1] - 1.96 * row[2])} y1={row[4]} x2={bx(row[1] + 1.96 * row[2])} y2={row[4]} stroke="var(--foreground)" strokeWidth="1.5" />
            <text x={bx(row[1]) + 8} y={row[4] + 4} className="fill-[var(--foreground)] text-[11px] font-mono">{(row[1] * 100).toFixed(2)}%</text>
          </g>
        ))}
      </svg>
      <div className="rounded-xl border border-border bg-card-muted/30 p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">95% CI for the difference (B − A)</div>
        <svg viewBox={`0 0 ${dW} 54`} className="w-full">
          <line x1={30} y1={38} x2={dW - 10} y2={38} stroke="var(--border)" />
          <line x1={dx(0)} y1={10} x2={dx(0)} y2={46} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          <text x={dx(0)} y={8} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[9px]">0 (no effect)</text>
          <line x1={dx(exp.ciLo)} y1={28} x2={dx(exp.ciHi)} y2={28} stroke={sig ? "var(--success)" : "var(--warning)"} strokeWidth="3" />
          <circle cx={dx(exp.diff)} cy={28} r={5} fill={sig ? "var(--success)" : "var(--warning)"} />
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>lift <span className="font-mono text-foreground">{(exp.diff * 100).toFixed(2)} pp</span></span>
        <span>p-value <span className="font-mono text-foreground">{exp.p < 0.0001 ? "<0.0001" : exp.p.toFixed(4)}</span></span>
        <span className="font-semibold" style={{ color: sig ? "var(--success)" : "var(--warning)" }}>{sig ? "Significant at 0.05" : "Not significant"}</span>
      </div>
      <div className="grid gap-4 border-t border-border/60 pt-3 sm:grid-cols-3">
        <Slider label="True rate A" min={0.01} max={0.4} step={0.005} value={rateA} onChange={setRateA} format={(v: number) => (v * 100).toFixed(1) + "%"} />
        <Slider label="True rate B" min={0.01} max={0.4} step={0.005} value={rateB} onChange={setRateB} format={(v: number) => (v * 100).toFixed(1) + "%"} />
        <Slider label="Users per arm" min={100} max={20000} step={100} value={n} onChange={setN} format={(v: number) => v.toLocaleString()} />
      </div>
      <VizButton onClick={run}><RotateCcw size={13} /> Run again (new random sample)</VizButton>
    </div>
  );
}

/* ---------------- Peeking view ---------------- */
type PeekPath = { path: { n: number; p: number }[]; crossed: boolean; finalP: number };
function PeekingView({ base, setBase, peekPath, reseed, runMany, fprRuns }: {
  base: number; setBase: (v: number) => void; peekPath: PeekPath;
  reseed: () => void; runMany: () => void; fprRuns: { peek: number; fixed: number; total: number };
}) {
  const W = 600, H = 220, PAD = 34;
  const maxN = peekPath.path[peekPath.path.length - 1].n;
  const px = (nn: number) => PAD + (nn / maxN) * (W - PAD - 12);
  const yOf = (p: number) => 12 + Math.min(1, p) * (H - PAD - 24);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Here A and B have the <strong className="text-foreground">exact same</strong> true rate — there is <strong className="text-foreground">no real effect</strong>.
        Watch the running p-value as data accumulates. If you stop the moment it dips below 0.05, you declare a false winner.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <rect x={PAD} y={yOf(0.05)} width={W - PAD - 12} height={H - PAD - yOf(0.05)} fill="var(--danger)" opacity="0.07" />
        <line x1={PAD} y1={yOf(0.05)} x2={W - 12} y2={yOf(0.05)} stroke="var(--danger)" strokeDasharray="4 4" opacity="0.8" />
        <text x={W - 14} y={yOf(0.05) - 4} textAnchor="end" className="fill-[var(--danger)] text-[10px]">p = 0.05</text>
        <path d={"M" + peekPath.path.map((d) => `${px(d.n).toFixed(1)},${yOf(d.p).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-violet)" strokeWidth="2" />
        <line x1={PAD} y1={H - PAD} x2={W - 12} y2={H - PAD} stroke="var(--border)" />
        <text x={(W) / 2} y={H - 6} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">cumulative sample size →</text>
      </svg>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span style={{ color: peekPath.crossed ? "var(--danger)" : "var(--success)" }} className="font-semibold">
          {peekPath.crossed ? "This run dipped below 0.05 at least once — peeking would call it a winner" : "This run never crossed 0.05"}
        </span>
        <span className="text-muted-foreground">final p <span className="font-mono text-foreground">{peekPath.finalP.toFixed(3)}</span></span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <VizButton onClick={reseed}><RotateCcw size={13} /> New sequence</VizButton>
        <VizButton onClick={runMany}>Run 200 A/A tests</VizButton>
        {fprRuns.total > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            False positives — <span className="font-mono text-danger">{((fprRuns.peek / fprRuns.total) * 100).toFixed(0)}%</span> if you peek vs
            {" "}<span className="font-mono text-success">{((fprRuns.fixed / fprRuns.total) * 100).toFixed(0)}%</span> at a fixed horizon (should be ~5%)
          </span>
        )}
      </div>
      <Slider label="Baseline rate (both arms)" min={0.05} max={0.5} step={0.01} value={base} onChange={setBase} format={(v: number) => (v * 100).toFixed(0) + "%"} />
    </div>
  );
}

/* ---------------- Power view ---------------- */
function PowerView({ pow, pBase, mde, power, setPBase, setMde, setPower }: {
  pow: { p1: number; p2: number; nReq: number; powerAt: (n: number) => number };
  pBase: number; mde: number; power: number;
  setPBase: (v: number) => void; setMde: (v: number) => void; setPower: (v: number) => void;
}) {
  const W = 600, H = 200, PAD = 40;
  const nMax = Math.max(pow.nReq * 2.2, 500);
  const ns = linspace(50, nMax, 80);
  const px = (nn: number) => PAD + (nn / nMax) * (W - PAD - 12);
  const py = (p: number) => H - PAD - p * (H - PAD - 12);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Required sample size:</span>
        <span className="font-mono text-2xl font-bold text-gradient">{pow.nReq.toLocaleString()}</span>
        <span className="text-muted-foreground">per arm ({(pow.nReq * 2).toLocaleString()} total)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={H - PAD} x2={W - 12} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={12} x2={PAD} y2={H - PAD} stroke="var(--border)" />
        <line x1={PAD} y1={py(power)} x2={W - 12} y2={py(power)} stroke="var(--brand-cyan)" strokeDasharray="4 4" opacity="0.7" />
        <text x={PAD + 4} y={py(power) - 4} className="fill-[var(--brand-cyan)] text-[10px]">target power {(power * 100).toFixed(0)}%</text>
        <path d={"M" + ns.map((nn) => `${px(nn).toFixed(1)},${py(Math.max(0, Math.min(1, pow.powerAt(nn)))).toFixed(1)}`).join(" L")} fill="none" stroke="var(--brand-violet)" strokeWidth="2.5" />
        <line x1={px(pow.nReq)} y1={12} x2={px(pow.nReq)} y2={H - PAD} stroke="var(--brand-pink)" strokeDasharray="3 3" />
        <circle cx={px(pow.nReq)} cy={py(power)} r={4} fill="var(--brand-pink)" />
        <text x={(W) / 2} y={H - 6} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">sample size per arm → (power curve)</text>
      </svg>
      <div className="grid gap-4 border-t border-border/60 pt-3 sm:grid-cols-3">
        <Slider label="Baseline rate" min={0.01} max={0.5} step={0.005} value={pBase} onChange={setPBase} format={(v: number) => (v * 100).toFixed(1) + "%"} />
        <Slider label="Min. detectable effect (relative)" min={1} max={50} step={1} value={mde} onChange={setMde} format={(v: number) => "+" + v + "%"} />
        <Slider label="Target power" min={0.5} max={0.99} step={0.01} value={power} onChange={setPower} format={(v: number) => (v * 100).toFixed(0) + "%"} />
      </div>
      <p className="text-xs text-muted-foreground">
        Detecting a <span className="font-mono text-foreground">+{mde}%</span> relative lift on a{" "}
        <span className="font-mono text-foreground">{(pBase * 100).toFixed(1)}%</span> baseline (to{" "}
        <span className="font-mono text-foreground">{(pow.p2 * 100).toFixed(2)}%</span>) at 95% confidence.
      </p>
    </div>
  );
}
