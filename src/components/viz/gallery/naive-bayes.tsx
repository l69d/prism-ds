"use client";

import { useState, useMemo } from "react";
import { linspace, normalPdf } from "@/lib/mathx";
import { mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 620, H = 320, PAD = 36;

export default function Viz() {
  const [mu0x, setMu0x] = useState(-1.0);
  const [mu1x, setMu1x] = useState(1.0);
  const [sd0x, setSd0x] = useState(1.0);
  const [sd1x, setSd1x] = useState(1.0);
  const [mu0y, setMu0y] = useState(-0.5);
  const [mu1y, setMu1y] = useState(0.5);
  const [sd0y, setSd0y] = useState(0.8);
  const [sd1y, setSd1y] = useState(1.2);
  const [prior0, setPrior0] = useState(0.5);
  const [view, setView] = useState<"boundary" | "feature1" | "feature2">("boundary");

  const prior1 = 1 - prior0;

  const xMin = -4, xMax = 4, yMin = -4, yMax = 4;
  const sx = (v: number) => PAD + mapRange(v, xMin, xMax, 0, W - 2 * PAD);
  const sy = (v: number) => H - PAD - mapRange(v, yMin, yMax, 0, H - 2 * PAD);

  const GRID = 48;
  const cells = useMemo(() => {
    return range(GRID).flatMap((row) =>
      range(GRID).map((col) => {
        const cx = xMin + (col + 0.5) * (xMax - xMin) / GRID;
        const cy = yMin + (row + 0.5) * (yMax - yMin) / GRID;
        const l0 = normalPdf(cx, mu0x, sd0x) * normalPdf(cy, mu0y, sd0y) * prior0;
        const l1 = normalPdf(cx, mu1x, sd1x) * normalPdf(cy, mu1y, sd1y) * prior1;
        const p1 = l0 + l1 > 0 ? l1 / (l0 + l1) : 0.5;
        return { cx, cy, p1 };
      })
    );
  }, [mu0x, mu1x, sd0x, sd1x, mu0y, mu1y, sd0y, sd1y, prior0, prior1]);

  const cellW = (W - 2 * PAD) / GRID;
  const cellH = (H - 2 * PAD) / GRID;

  const xs1d = linspace(xMin, xMax, 200);

  const pdf0x = xs1d.map((x) => normalPdf(x, mu0x, sd0x) * prior0);
  const pdf1x = xs1d.map((x) => normalPdf(x, mu1x, sd1x) * prior1);
  const pdf0y = xs1d.map((x) => normalPdf(x, mu0y, sd0y) * prior0);
  const pdf1y = xs1d.map((x) => normalPdf(x, mu1y, sd1y) * prior1);

  const maxPdf = Math.max(...pdf0x, ...pdf1x, ...pdf0y, ...pdf1y, 0.01);

  const pdfy0 = H - PAD;
  const pdfyScale = (H - 2 * PAD) * 0.9;

  const path1d = (vals: number[]) =>
    "M" + xs1d.map((x, i) => {
      const px = PAD + mapRange(x, xMin, xMax, 0, W - 2 * PAD);
      const py = pdfy0 - (vals[i] / maxPdf) * pdfyScale;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    }).join(" L");

  const crossX = useMemo(() => {
    for (let i = 0; i < xs1d.length - 1; i++) {
      const a = pdf0x[i] - pdf1x[i];
      const b = pdf0x[i + 1] - pdf1x[i + 1];
      if (a * b < 0) return xs1d[i] + (xs1d[i + 1] - xs1d[i]) * (a / (a - b));
    }
    return null;
  }, [pdf0x, pdf1x, xs1d]);

  const crossY = useMemo(() => {
    for (let i = 0; i < xs1d.length - 1; i++) {
      const a = pdf0y[i] - pdf1y[i];
      const b = pdf0y[i + 1] - pdf1y[i + 1];
      if (a * b < 0) return xs1d[i] + (xs1d[i + 1] - xs1d[i]) * (a / (a - b));
    }
    return null;
  }, [pdf0y, pdf1y, xs1d]);

  const testX = 0.3, testY = 0.1;
  const l0Test = normalPdf(testX, mu0x, sd0x) * normalPdf(testY, mu0y, sd0y) * prior0;
  const l1Test = normalPdf(testX, mu1x, sd1x) * normalPdf(testY, mu1y, sd1y) * prior1;
  const pTest = l0Test + l1Test > 0 ? l1Test / (l0Test + l1Test) : 0.5;

  return (
    <VizFrame
      title="Naive Bayes Classifier"
      hint="adjust per-feature distributions and watch the boundary shift"
      controls={
        <div className="space-y-4">
          <div className="flex gap-1.5 flex-wrap">
            <SegButton active={view === "boundary"} onClick={() => setView("boundary")}>Decision Boundary</SegButton>
            <SegButton active={view === "feature1"} onClick={() => setView("feature1")}>Feature 1 (X)</SegButton>
            <SegButton active={view === "feature2"} onClick={() => setView("feature2")}>Feature 2 (Y)</SegButton>
          </div>
          <ControlGroup>
            <Slider label="Class 0 mean (feature 1)" min={-3} max={3} step={0.1} value={mu0x} onChange={setMu0x} format={(v) => v.toFixed(1)} />
            <Slider label="Class 1 mean (feature 1)" min={-3} max={3} step={0.1} value={mu1x} onChange={setMu1x} format={(v) => v.toFixed(1)} />
            <Slider label="Class 0 mean (feature 2)" min={-3} max={3} step={0.1} value={mu0y} onChange={setMu0y} format={(v) => v.toFixed(1)} />
            <Slider label="Class 1 mean (feature 2)" min={-3} max={3} step={0.1} value={mu1y} onChange={setMu1y} format={(v) => v.toFixed(1)} />
          </ControlGroup>
          <ControlGroup>
            <Slider label="Class 0 spread (feat 1)" min={0.3} max={2.5} step={0.05} value={sd0x} onChange={setSd0x} format={(v) => v.toFixed(2)} />
            <Slider label="Class 1 spread (feat 1)" min={0.3} max={2.5} step={0.05} value={sd1x} onChange={setSd1x} format={(v) => v.toFixed(2)} />
            <Slider label="Class 0 spread (feat 2)" min={0.3} max={2.5} step={0.05} value={sd0y} onChange={setSd0y} format={(v) => v.toFixed(2)} />
            <Slider label="Class 1 spread (feat 2)" min={0.3} max={2.5} step={0.05} value={sd1y} onChange={setSd1y} format={(v) => v.toFixed(2)} />
            <Slider label="P(class 0) prior" min={0.05} max={0.95} step={0.01} value={prior0} onChange={setPrior0} format={(v) => v.toFixed(2)} />
          </ControlGroup>
          <div className="rounded-xl border border-[var(--brand-violet)]/30 bg-[var(--brand-violet)]/5 px-3 py-2 text-xs">
            Point (0.3, 0.1): P(class 1 | x, y) ={" "}
            <span className="font-mono font-bold" style={{ color: pTest > 0.5 ? "var(--brand-violet)" : "var(--brand-cyan)" }}>
              {(pTest * 100).toFixed(1)}%
            </span>
            <span className="ml-2 text-[var(--muted-foreground)]">→ predict class {pTest > 0.5 ? "1" : "0"}</span>
            <span className="ml-2 text-[var(--muted-foreground)]">
              (L0·prior0 = {l0Test.toExponential(2)}, L1·prior1 = {l1Test.toExponential(2)})
            </span>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {view === "boundary" && (
          <>
            {cells.map(({ cx, cy, p1 }, i) => {
              const px = PAD + mapRange(cx, xMin, xMax, 0, W - 2 * PAD) - cellW / 2;
              const py = H - PAD - mapRange(cy, yMin, yMax, 0, H - 2 * PAD) - cellH / 2;
              const violet = [106, 90, 205];
              const cyan = [6, 182, 212];
              const r = Math.round(violet[0] * p1 + cyan[0] * (1 - p1));
              const g = Math.round(violet[1] * p1 + cyan[1] * (1 - p1));
              const b = Math.round(violet[2] * p1 + cyan[2] * (1 - p1));
              return <rect key={i} x={px} y={py} width={cellW + 0.5} height={cellH + 0.5} fill={`rgb(${r},${g},${b})`} opacity="0.55" />;
            })}
            <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill="none" stroke="var(--border)" strokeWidth="1" />
            <circle cx={sx(mu0x)} cy={sy(mu0y)} r="7" fill="var(--brand-cyan)" stroke="var(--background)" strokeWidth="2" />
            <text x={sx(mu0x) + 10} y={sy(mu0y) + 4} fontSize="11" fill="var(--brand-cyan)" fontWeight="600">μ₀</text>
            <circle cx={sx(mu1x)} cy={sy(mu1y)} r="7" fill="var(--brand-violet)" stroke="var(--background)" strokeWidth="2" />
            <text x={sx(mu1x) + 10} y={sy(mu1y) + 4} fontSize="11" fill="var(--brand-violet)" fontWeight="600">μ₁</text>
            <circle cx={sx(testX)} cy={sy(testY)} r="5" fill="var(--foreground)" stroke="var(--background)" strokeWidth="1.5" />
            <text x={sx(testX) + 8} y={sy(testY) - 6} fontSize="10" fill="var(--foreground)">(0.3, 0.1)</text>
            <line x1={PAD} y1={sy(0)} x2={W - PAD} y2={sy(0)} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3,3" />
            <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={H - PAD} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="3,3" />
            <text x={sx(xMin) + 2} y={sy(0) - 4} fontSize="9" fill="var(--muted-foreground)">feature 1</text>
            <text x={sx(0) + 3} y={PAD + 10} fontSize="9" fill="var(--muted-foreground)">feature 2</text>
          </>
        )}
        {(view === "feature1" || view === "feature2") && (() => {
          const d0 = view === "feature1" ? path1d(pdf0x) : path1d(pdf0y);
          const d1 = view === "feature1" ? path1d(pdf1x) : path1d(pdf1y);
          const cross = view === "feature1" ? crossX : crossY;
          const label = view === "feature1" ? "feature 1 (x)" : "feature 2 (y)";
          return (
            <>
              <line x1={PAD} y1={pdfy0} x2={W - PAD} y2={pdfy0} stroke="var(--border)" strokeWidth="1" />
              <line x1={PAD} y1={PAD} x2={PAD} y2={pdfy0} stroke="var(--border)" strokeWidth="0.7" />
              <path d={d0} fill="var(--brand-cyan)" fillOpacity="0.25" stroke="var(--brand-cyan)" strokeWidth="2" />
              <path d={d1} fill="var(--brand-violet)" fillOpacity="0.25" stroke="var(--brand-violet)" strokeWidth="2" />
              {cross !== null && (
                <>
                  <line
                    x1={PAD + mapRange(cross, xMin, xMax, 0, W - 2 * PAD)}
                    y1={PAD}
                    x2={PAD + mapRange(cross, xMin, xMax, 0, W - 2 * PAD)}
                    y2={pdfy0}
                    stroke="var(--foreground)" strokeWidth="1.5" strokeDasharray="5,3"
                  />
                  <text
                    x={PAD + mapRange(cross, xMin, xMax, 0, W - 2 * PAD) + 4}
                    y={PAD + 18} fontSize="10" fill="var(--foreground)"
                  >
                    boundary ≈ {cross.toFixed(2)}
                  </text>
                </>
              )}
              <text x={sx(0)} y={pdfy0 + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{label}</text>
              <text x={PAD + 8} y={PAD + 16} fontSize="10" fill="var(--brand-cyan)" fontWeight="600">class 0</text>
              <text x={PAD + 8} y={PAD + 30} fontSize="10" fill="var(--brand-violet)" fontWeight="600">class 1</text>
              <text x={sx(-3)} y={pdfy0 - 2} fontSize="9" fill="var(--muted-foreground)">{xMin}</text>
              <text x={sx(3)} y={pdfy0 - 2} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{xMax}</text>
            </>
          );
        })()}
      </svg>
    </VizFrame>
  );
}
