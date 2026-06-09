"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, std, histogram, linspace, normalPdf } from "@/lib/mathx";
import { mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

const W = 640, H = 320, PAD = 40, PAD_TOP = 20;

function skewness(xs: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const m = mean(xs);
  const s = std(xs);
  if (s === 0) return 0;
  const sum = xs.reduce((acc, x) => acc + Math.pow((x - m) / s, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export default function Viz() {
  const [outlierX, setOutlierX] = useState(3.0);
  const [spread, setSpread] = useState(1.0);
  const [shape, setShape] = useState<"sym" | "skew">("sym");
  const SEED = 42;

  const data = useMemo(() => {
    const rand = rng(SEED);
    const base = shape === "sym"
      ? range(39).map(() => gaussian(rand, 0, spread))
      : range(39).map(() => {
          const u = rand();
          return spread * (-Math.log(1 - u * 0.999));
        });
    return [...base, outlierX * 3];
  }, [outlierX, spread, shape]);

  const xMin = -6, xMax = 12;
  const bins = 22;
  const hist = useMemo(() => histogram(data, bins, xMin, xMax), [data]);

  const maxCount = Math.max(...hist.counts, 1);
  const yMax = maxCount + 1;

  const sx = (v: number) => mapRange(v, xMin, xMax, PAD, W - PAD);

  const dataMean = mean(data);
  const dataMedian = median(data);
  const dataStd = std(data);
  const dataSkew = skewness(data);

  const meanX = sx(dataMean);
  const medX = sx(dataMedian);

  const curveScale = (H - PAD - PAD_TOP) * 0.85;
  const curvePath = "M" + linspace(xMin, xMax, 200)
    .map((v) => {
      const y = normalPdf(v, dataMean, dataStd) * dataStd * curveScale * 1.8;
      return `${sx(v).toFixed(1)},${(H - PAD - y).toFixed(1)}`;
    })
    .join(" L");

  const meanColor = "var(--brand-cyan)";
  const medianColor = "var(--brand-pink)";

  const gap = Math.abs(dataMean - dataMedian);

  return (
    <VizFrame
      title="Descriptive Statistics"
      hint="Move the outlier slider and watch mean diverge from median"
      controls={
        <ControlGroup>
          <div className="space-y-3">
            <Slider
              label="Outlier position"
              min={-2}
              max={4}
              step={0.1}
              value={outlierX}
              onChange={setOutlierX}
              format={(v) => (v * 3).toFixed(1)}
            />
            <Slider
              label="Spread (std)"
              min={0.3}
              max={2.5}
              step={0.1}
              value={spread}
              onChange={setSpread}
              format={(v) => v.toFixed(1)}
            />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span style={{ color: meanColor }} className="font-bold">━</span>
              <span className="text-muted-foreground">Mean</span>
              <span className="ml-auto font-mono text-foreground">{dataMean.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: medianColor }} className="font-bold">━</span>
              <span className="text-muted-foreground">Median</span>
              <span className="ml-auto font-mono text-foreground">{dataMedian.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Std dev</span>
              <span className="ml-auto font-mono text-foreground">{dataStd.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Skew</span>
              <span className="ml-auto font-mono text-foreground">{dataSkew.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">|mean−median|</span>
              <span
                className="ml-auto font-mono font-bold"
                style={{ color: gap > 0.8 ? "var(--warning)" : "var(--success)" }}
              >
                {gap.toFixed(2)}
              </span>
            </div>
          </div>
        </ControlGroup>
      }
    >
      <div className="mb-2 flex gap-1.5">
        <SegButton active={shape === "sym"} onClick={() => setShape("sym")}>Symmetric</SegButton>
        <SegButton active={shape === "skew"} onClick={() => setShape("skew")}>Right-skewed</SegButton>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axis */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {/* Tick marks */}
        {linspace(xMin, xMax, 7).map((v) => (
          <g key={v}>
            <line x1={sx(v)} y1={H - PAD} x2={sx(v)} y2={H - PAD + 5} stroke="var(--border)" />
            <text x={sx(v)} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Histogram bars */}
        {hist.counts.map((count, i) => {
          const bx = sx(hist.min + i * hist.width);
          const bx2 = sx(hist.min + (i + 1) * hist.width);
          const barW = bx2 - bx - 1;
          const barH = (H - PAD - PAD_TOP) * (count / yMax);
          const isOutlierBin = hist.min + (i + 0.5) * hist.width > xMax * 0.55;
          return (
            <rect
              key={i}
              x={bx}
              y={H - PAD - barH}
              width={Math.max(barW, 0)}
              height={barH}
              fill={isOutlierBin ? "var(--brand-indigo)" : "var(--brand-cyan)"}
              opacity="0.35"
              rx="1"
            />
          );
        })}

        {/* Normal curve overlay */}
        <path d={curvePath} fill="none" stroke="var(--brand-cyan)" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 3" />

        {/* Mean line */}
        {meanX >= PAD && meanX <= W - PAD && (
          <g>
            <line x1={meanX} y1={PAD_TOP} x2={meanX} y2={H - PAD} stroke={meanColor} strokeWidth="2.5" strokeDasharray="5 3" />
            <text x={meanX + 4} y={PAD_TOP + 12} fontSize="10" fill={meanColor} fontWeight="bold">mean</text>
          </g>
        )}

        {/* Median line */}
        {medX >= PAD && medX <= W - PAD && (
          <g>
            <line x1={medX} y1={PAD_TOP} x2={medX} y2={H - PAD} stroke={medianColor} strokeWidth="2.5" />
            <text x={medX + 4} y={PAD_TOP + 24} fontSize="10" fill={medianColor} fontWeight="bold">median</text>
          </g>
        )}

        {/* Gap annotation when diverged */}
        {gap > 0.5 && meanX >= PAD && medX >= PAD && (
          <g>
            <line
              x1={Math.min(meanX, medX)}
              y1={H - PAD - 12}
              x2={Math.max(meanX, medX)}
              y2={H - PAD - 12}
              stroke="var(--warning)"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            <text
              x={(meanX + medX) / 2}
              y={H - PAD - 17}
              textAnchor="middle"
              fontSize="9"
              fill="var(--warning)"
            >
              gap = {gap.toFixed(2)}
            </text>
          </g>
        )}

        {/* Outlier dot indicator */}
        {sx(outlierX * 3) >= PAD && sx(outlierX * 3) <= W - PAD && (
          <g>
            <circle cx={sx(outlierX * 3)} cy={H - PAD - 8} r="5" fill="var(--brand-indigo)" opacity="0.9" />
            <text x={sx(outlierX * 3)} y={H - PAD - 15} textAnchor="middle" fontSize="8" fill="var(--brand-indigo)">
              outlier
            </text>
          </g>
        )}
      </svg>
    </VizFrame>
  );
}
