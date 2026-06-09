"use client";

import { useState, useMemo } from "react";
import { rng, mean, std } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

const W = 640, H = 320, PAD = 40;

type Issue = "outliers" | "missing" | "duplicates" | "mixed";

const ISSUES: { key: Issue; label: string }[] = [
  { key: "outliers", label: "Outliers" },
  { key: "missing", label: "Missing" },
  { key: "duplicates", label: "Duplicates" },
  { key: "mixed", label: "Mixed Units" },
];

interface Row { x: number; y: number; kind: "clean" | "outlier" | "missing" | "dup" | "unit"; }

function buildData(issue: Issue, seed: number): Row[] {
  const rand = rng(seed);
  const rows: Row[] = [];
  for (let i = 0; i < 30; i++) {
    const x = 1 + i * 0.6 + (rand() - 0.5) * 0.4;
    const y = 2 + x * 1.5 + (rand() - 0.5) * 2;
    rows.push({ x, y, kind: "clean" });
  }
  if (issue === "outliers") {
    const rand2 = rng(seed + 1);
    for (let i = 0; i < 6; i++) {
      rows.push({ x: 3 + rand2() * 12, y: 40 + rand2() * 30, kind: "outlier" });
    }
  } else if (issue === "missing") {
    const rand2 = rng(seed + 2);
    for (let i = 0; i < 8; i++) {
      const idx = Math.floor(rand2() * rows.length);
      rows[idx] = { ...rows[idx], y: NaN, kind: "missing" };
    }
  } else if (issue === "duplicates") {
    const rand2 = rng(seed + 3);
    for (let i = 0; i < 7; i++) {
      const idx = Math.floor(rand2() * 20);
      rows.push({ ...rows[idx], kind: "dup" });
    }
  } else if (issue === "mixed") {
    const rand2 = rng(seed + 4);
    for (let i = 0; i < 8; i++) {
      const idx = Math.floor(rand2() * rows.length);
      rows[idx] = { ...rows[idx], y: rows[idx].y * 100, kind: "unit" };
    }
  }
  return rows;
}

function cleaned(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter(r => {
    if (r.kind === "missing" || r.kind === "outlier" || r.kind === "unit") return false;
    const key = `${r.x.toFixed(1)},${r.y.toFixed(1)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function linReg(pts: Row[]): { m: number; b: number } {
  const valid = pts.filter(p => !isNaN(p.y));
  if (valid.length < 2) return { m: 0, b: 0 };
  const xs = valid.map(p => p.x);
  const ys = valid.map(p => p.y);
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const m = den === 0 ? 0 : num / den;
  return { m, b: my - m * mx };
}

export default function Viz() {
  const [issue, setIssue] = useState<Issue>("outliers");
  const [showClean, setShowClean] = useState(false);
  const [seed, setSeed] = useState(42);

  const raw = useMemo(() => buildData(issue, seed), [issue, seed]);
  const display = showClean ? cleaned(raw) : raw;
  const valid = display.filter(r => !isNaN(r.y));

  const allY = valid.map(r => r.y);
  const allX = valid.map(r => r.x);
  const yMin = Math.min(...allY, 0) - 2;
  const yMax = Math.max(...allY) + 4;
  const xMin = Math.min(...allX) - 0.5;
  const xMax = Math.max(...allX) + 0.5;

  const sx = (v: number) => PAD + ((v - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const rawReg = linReg(raw.filter(r => !isNaN(r.y)));
  const cleanReg = linReg(cleaned(raw));
  const showReg = issue !== "missing";

  const rawStd = allY.length > 1 ? std(raw.filter(r => !isNaN(r.y)).map(r => r.y)) : 0;
  const cleanStd = std(cleaned(raw).map(r => r.y));

  const issueCount = raw.filter(r => r.kind !== "clean").length;

  const kindColor: Record<Row["kind"], string> = {
    clean: "var(--brand-cyan)",
    outlier: "var(--danger)",
    missing: "var(--warning)",
    dup: "var(--brand-violet)",
    unit: "var(--brand-pink)",
  };

  return (
    <VizFrame
      title="Data Cleaning"
      hint="Toggle between raw and cleaned data to see how quality issues warp your analysis"
      controls={
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Issue Type</div>
          <div className="flex flex-wrap gap-1.5">
            {ISSUES.map(({ key, label }) => (
              <SegButton key={key} active={issue === key} onClick={() => { setIssue(key); setShowClean(false); }}>
                {label}
              </SegButton>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <SegButton active={!showClean} onClick={() => setShowClean(false)}>Raw</SegButton>
            <SegButton active={showClean} onClick={() => setShowClean(true)}>Cleaned</SegButton>
            <VizButton onClick={() => setSeed(s => s + 1)} className="ml-auto"><RotateCcw size={13} /> Resample</VizButton>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
            <span className="text-muted-foreground">Points shown</span>
            <span className="font-mono text-foreground">{valid.length}</span>
            <span className="text-muted-foreground">Issues found</span>
            <span className="font-mono" style={{ color: issueCount > 0 && !showClean ? "var(--danger)" : "var(--success)" }}>
              {showClean ? 0 : issueCount}
            </span>
            <span className="text-muted-foreground">Y std dev</span>
            <span className="font-mono text-foreground">{(showClean ? cleanStd : rawStd).toFixed(2)}</span>
            {showReg && <>
              <span className="text-muted-foreground">Slope (raw)</span>
              <span className="font-mono" style={{ color: "var(--warning)" }}>{rawReg.m.toFixed(2)}</span>
              <span className="text-muted-foreground">Slope (clean)</span>
              <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>{cleanReg.m.toFixed(2)}</span>
            </>}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        {[0.25, 0.5, 0.75].map(t => {
          const gx = PAD + t * (W - 2 * PAD);
          const gy = PAD + t * (H - 2 * PAD);
          return (
            <g key={t}>
              <line x1={gx} y1={PAD} x2={gx} y2={H - PAD} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="3,3" />
              <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="3,3" />
            </g>
          );
        })}
        {showReg && (
          <>
            <line
              x1={sx(xMin)} y1={sy(rawReg.m * xMin + rawReg.b)}
              x2={sx(xMax)} y2={sy(rawReg.m * xMax + rawReg.b)}
              stroke="var(--warning)" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.7"
            />
            <line
              x1={sx(xMin)} y1={sy(cleanReg.m * xMin + cleanReg.b)}
              x2={sx(xMax)} y2={sy(cleanReg.m * xMax + cleanReg.b)}
              stroke="var(--brand-cyan)" strokeWidth="2" opacity="0.9"
            />
          </>
        )}
        {display.map((r, i) => {
          if (isNaN(r.y)) {
            return (
              <g key={i}>
                <line x1={sx(r.x) - 5} y1={sy(yMin + (yMax - yMin) * 0.5) - 5} x2={sx(r.x) + 5} y2={sy(yMin + (yMax - yMin) * 0.5) + 5} stroke="var(--warning)" strokeWidth="1.5" />
                <line x1={sx(r.x) + 5} y1={sy(yMin + (yMax - yMin) * 0.5) - 5} x2={sx(r.x) - 5} y2={sy(yMin + (yMax - yMin) * 0.5) + 5} stroke="var(--warning)" strokeWidth="1.5" />
              </g>
            );
          }
          return (
            <circle
              key={i}
              cx={sx(r.x)} cy={sy(r.y)}
              r={r.kind === "dup" ? 6 : 4.5}
              fill={kindColor[r.kind]}
              fillOpacity={r.kind === "clean" ? 0.75 : 0.9}
              stroke={r.kind !== "clean" ? kindColor[r.kind] : "none"}
              strokeWidth={r.kind !== "clean" ? 1.5 : 0}
            />
          );
        })}
        <text x={PAD + 4} y={PAD - 8} fontSize="10" fill="var(--muted-foreground)">Y</text>
        <text x={W - PAD + 4} y={H - PAD + 4} fontSize="10" fill="var(--muted-foreground)">X</text>
        {!showClean && (
          <text x={W / 2} y={20} textAnchor="middle" fontSize="11" fill="var(--danger)" fontWeight="600">
            {issue === "outliers" && `${issueCount} outliers pulling the fit line`}
            {issue === "missing" && `${issueCount} missing values (×) — mean shifts`}
            {issue === "duplicates" && `${issueCount} duplicate rows inflate sample size`}
            {issue === "mixed" && `${issueCount} rows in wrong units (100× scale)`}
          </text>
        )}
        {showClean && (
          <text x={W / 2} y={20} textAnchor="middle" fontSize="11" fill="var(--success)" fontWeight="600">
            Cleaned — {issueCount} issues removed, fit is stable
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
