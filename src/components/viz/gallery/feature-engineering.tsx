"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, pearson } from "@/lib/mathx";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";
import { range, mapRange } from "@/lib/utils";

const W = 640, H = 320, PAD = 44;
const CATS = ["A", "B", "C", "D"] as const;
type Cat = (typeof CATS)[number];
type Encoding = "raw" | "onehot" | "target" | "leaky";

const CAT_MEANS: Record<Cat, number> = { A: 10, B: 25, C: 45, D: 70 };
const CAT_COLORS: Record<Cat, string> = {
  A: "var(--brand-cyan)",
  B: "var(--brand-violet)",
  C: "var(--brand-pink)",
  D: "var(--warning)",
};

function genData(n: number, seed: number) {
  const rand = rng(seed);
  return range(n).map((_i) => {
    const cat = CATS[Math.floor(rand() * 4)] as Cat;
    const y = CAT_MEANS[cat] * 0.9 + gaussian(rand, 0, 6);
    return { cat, y };
  });
}

function computeR2(xs: number[], ys: number[]): number {
  const r = pearson(xs, ys);
  return r * r;
}

export default function Viz() {
  const [n, setN] = useState(80);
  const [trainFrac, setTrainFrac] = useState(0.6);
  const [encoding, setEncoding] = useState<Encoding>("raw");
  const [seed] = useState(42);

  const data = useMemo(() => genData(n, seed), [n, seed]);

  const splitIdx = Math.floor(data.length * trainFrac);
  const train = data.slice(0, splitIdx);
  const test = data.slice(splitIdx);

  const targetMeans = useMemo(() => {
    const sums: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    const cnts: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (let i = 0; i < splitIdx; i++) { sums[data[i].cat] += data[i].y; cnts[data[i].cat]++; }
    const result: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const c of CATS) result[c] = cnts[c] > 0 ? sums[c] / cnts[c] : 0;
    return result;
  }, [data, splitIdx]);

  const targetMeansFull = useMemo(() => {
    const sums: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    const cnts: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const d of data) { sums[d.cat] += d.y; cnts[d.cat]++; }
    const result: Record<Cat, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const c of CATS) result[c] = cnts[c] > 0 ? sums[c] / cnts[c] : 0;
    return result;
  }, [data]);

  function encodeX(d: { cat: Cat }): number {
    if (encoding === "raw") return CATS.indexOf(d.cat);
    if (encoding === "onehot") return CATS.indexOf(d.cat) * 25 + 5;
    if (encoding === "target") return targetMeans[d.cat];
    return targetMeansFull[d.cat];
  }

  const trainXs = train.map((d) => encodeX(d));
  const testXs = test.map((d) => encodeX(d));
  const trainYs = train.map((d) => d.y);
  const testYs = test.map((d) => d.y);

  const trainR2 = trainXs.length > 1 ? computeR2(trainXs, trainYs) : 0;
  const testR2 = testXs.length > 1 ? computeR2(testXs, testYs) : 0;
  const leak = encoding === "leaky";

  const xMin = Math.min(...trainXs, ...testXs) - 5;
  const xMax = Math.max(...trainXs, ...testXs) + 5;
  const yMin = Math.min(...trainYs, ...testYs) - 5;
  const yMax = Math.max(...trainYs, ...testYs) + 5;

  const sx = (v: number) => PAD + mapRange(v, xMin, xMax, 0, W - 2 * PAD);
  const sy = (v: number) => H - PAD - mapRange(v, yMin, yMax, 0, H - 2 * PAD);

  const trainMeanX = mean(trainXs);
  const trainMeanY = mean(trainYs);
  const dxx = trainXs.reduce((s, x) => s + (x - trainMeanX) ** 2, 0);
  const dxy = trainXs.reduce((s, x, i) => s + (x - trainMeanX) * (trainYs[i] - trainMeanY), 0);
  const slope = dxx > 0 ? dxy / dxx : 0;
  const intercept = trainMeanY - slope * trainMeanX;

  const lineX1 = xMin, lineX2 = xMax;
  const lineY1 = slope * lineX1 + intercept;
  const lineY2 = slope * lineX2 + intercept;

  return (
    <VizFrame
      title="Feature Engineering: Encoding & Target Leakage"
      hint="Switch encoding methods and watch test R² change — leaky encoding inflates it artificially"
      controls={
        <div className="space-y-4">
          <ControlGroup>
            <Slider label="Samples" min={40} max={160} step={10} value={n} onChange={setN} format={(v) => `${v}`} />
            <Slider label="Train split" min={0.4} max={0.85} step={0.05} value={trainFrac} onChange={setTrainFrac} format={(v) => `${Math.round(v * 100)}%`} />
          </ControlGroup>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Encoding method</p>
            <div className="flex flex-wrap gap-1.5">
              {(["raw", "onehot", "target", "leaky"] as Encoding[]).map((e) => (
                <SegButton key={e} active={encoding === e} onClick={() => setEncoding(e)}>
                  {e === "raw" ? "Raw (ordinal)" : e === "onehot" ? "One-hot" : e === "target" ? "Target enc." : "Leaky target"}
                </SegButton>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Train R²</span>
              <div className="font-mono text-foreground text-sm">{trainR2.toFixed(3)}</div>
            </div>
            <div className="space-y-0.5">
              <span className={leak ? "text-danger font-semibold" : "text-muted-foreground"}>
                Test R² {leak && "⚠ leaky!"}
              </span>
              <div className={`font-mono text-sm ${leak ? "text-danger" : "text-foreground"}`}>{testR2.toFixed(3)}</div>
            </div>
          </div>
          {encoding === "raw" && <p className="text-xs text-muted-foreground">Treating A=0, B=1… implies B is "between" A and C. Spurious ordering.</p>}
          {encoding === "onehot" && <p className="text-xs text-muted-foreground">Each category gets its own binary column. No ordering assumed — clean but sparse.</p>}
          {encoding === "target" && <p className="text-xs text-muted-foreground">Replace category with its mean target on train only. Signal-rich but needs care.</p>}
          {encoding === "leaky" && <p className="text-xs text-danger">Mean computed on ALL rows including test. Test R² looks great but it&apos;s cheating!</p>}
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">encoded feature value</text>
        <text x={10} y={H / 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" transform={`rotate(-90,10,${H / 2})`}>target y</text>

        {/* Test points (faded background) */}
        {test.map((d, i) => (
          <circle
            key={`te-${i}`}
            cx={sx(testXs[i])}
            cy={sy(d.y)}
            r={3.5}
            fill={CAT_COLORS[d.cat]}
            opacity={0.3}
            stroke="none"
          />
        ))}

        {/* Train points */}
        {train.map((d, i) => (
          <circle
            key={`tr-${i}`}
            cx={sx(trainXs[i])}
            cy={sy(d.y)}
            r={4}
            fill={CAT_COLORS[d.cat]}
            opacity={0.8}
            stroke="none"
          />
        ))}

        {/* Regression line (fit on train) */}
        <line
          x1={sx(lineX1)} y1={sy(lineY1)}
          x2={sx(lineX2)} y2={sy(lineY2)}
          stroke={leak ? "var(--danger)" : "var(--brand-cyan)"}
          strokeWidth="2"
          strokeDasharray={leak ? "6,3" : "none"}
          opacity={0.9}
        />

        {/* Legend */}
        {CATS.map((c, ci) => (
          <g key={c} transform={`translate(${PAD + ci * 72}, 14)`}>
            <circle r="5" fill={CAT_COLORS[c]} opacity={0.85} />
            <text x="9" y="4" fontSize="10" fill="var(--muted-foreground)">{c} (μ={CAT_MEANS[c]})</text>
          </g>
        ))}

        {/* Train/test label */}
        <text x={W - PAD - 2} y={PAD + 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">● train  ○ test</text>
      </svg>
    </VizFrame>
  );
}
