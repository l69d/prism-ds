"use client";

import { useState, useMemo } from "react";
import { rng, gaussian, mean, pearson } from "@/lib/mathx";
import { mapRange, range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, ControlGroup } from "@/components/viz/controls";

const W = 620, H = 260, PAD = 40;
const N = 18;

type FeatureKey = "hour" | "dow" | "month" | "len" | "words" | "digits";
const FEATURE_LABELS: Record<FeatureKey, string> = {
  hour: "hour_of_day", dow: "day_of_week", month: "month",
  len: "text_length", words: "word_count", digits: "digit_count",
};
const FEATURE_RANGES: Record<FeatureKey, [number, number]> = {
  hour: [0, 23], dow: [0, 6], month: [1, 12],
  len: [10, 80], words: [2, 14], digits: [0, 5],
};
const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SNIPPETS = [
  "Order #2341 placed successfully",  "Your delivery is on the way",
  "Refund processed in 3-5 days",     "Rate your last purchase now",
  "Flash sale ends at midnight",       "Account login from new device",
  "Payment of $49 received",          "Track your package ABC123",
  "2 items added to cart",            "Review posted successfully",
  "Your code: 8821 expires in 10min", "New message from support",
  "Discount code SAVE20 applied",     "Subscription renewed automatically",
  "4 unread notifications pending",   "Shipment delayed by 1 day",
  "Invoice #99 sent to your email",   "Your reward points: 350 earned",
];

interface Row {
  ts: string; text: string; rating: number;
  hour: number; dow: number; month: number;
  len: number; words: number; digits: number;
}

function genRows(seed: number): Row[] {
  const rand = rng(seed);
  return range(N).map((i) => {
    const hour = Math.floor(rand() * 24);
    const dow = Math.floor(rand() * 7);
    const month = Math.floor(rand() * 12) + 1;
    const day = Math.floor(rand() * 28) + 1;
    const pad2 = (x: number) => String(x).padStart(2, "0");
    const ts = `2024-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(Math.floor(rand() * 60))}`;
    const text = SNIPPETS[i % SNIPPETS.length];
    const len = text.length;
    const words = text.trim().split(/\s+/).length;
    const digits = (text.match(/\d/g) ?? []).length;
    // rating correlates with hour (peak mid-day) and text length (longer = engaged)
    const base = 3 + gaussian(rand, 0, 0.7);
    const hourBonus = Math.abs(hour - 12) < 4 ? 0.8 : -0.4;
    const lenBonus = (len - 40) * 0.015;
    const rating = Math.max(1, Math.min(5, base + hourBonus + lenBonus));
    return { ts, text, rating, hour, dow, month, len, words, digits };
  });
}

export default function Viz() {
  const [seed] = useState(77);
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("hour");
  const [view, setView] = useState<"raw" | "extracted">("raw");

  const rows = useMemo(() => genRows(seed), [seed]);

  const featureVals = rows.map((r) => r[activeFeature] as number);
  const ratings = rows.map((r) => r.rating);
  const corr = pearson(featureVals, ratings);

  const [lo, hi] = FEATURE_RANGES[activeFeature];
  const BINS = 8;
  const binWidth = (hi - lo) / BINS;

  const bins = useMemo(() => {
    const counts = range(BINS).map(() => ({ sum: 0, n: 0 }));
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i][activeFeature] as number;
      const b = Math.min(BINS - 1, Math.floor((v - lo) / binWidth));
      counts[b].sum += rows[i].rating;
      counts[b].n += 1;
    }
    return counts.map((c) => ({ avg: c.n > 0 ? c.sum / c.n : 0, n: c.n }));
  }, [rows, activeFeature, lo, binWidth]);

  const avgRating = mean(ratings);
  const maxAvg = Math.max(...bins.map((b) => b.avg), 5);

  const barX = (i: number) => PAD + i * ((W - 2 * PAD) / BINS);
  const barW = (W - 2 * PAD) / BINS - 3;
  const sy = (v: number) => H - PAD - mapRange(v, 0, maxAvg, 0, H - 2 * PAD);

  const COLS: FeatureKey[] = ["hour", "dow", "month", "len", "words", "digits"];

  return (
    <VizFrame
      title="Dates & Text Features"
      hint="Switch features to see which ones correlate with the rating"
      controls={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">View</span>
            <div className="flex gap-1">
              <SegButton active={view === "raw"} onClick={() => setView("raw")}>Raw input</SegButton>
              <SegButton active={view === "extracted"} onClick={() => setView("extracted")}>Extracted features</SegButton>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Inspect feature</span>
            <div className="flex flex-wrap gap-1">
              {COLS.map((k) => (
                <SegButton key={k} active={activeFeature === k} onClick={() => setActiveFeature(k)}>
                  {FEATURE_LABELS[k]}
                </SegButton>
              ))}
            </div>
          </div>
          <ControlGroup>
            <div className="text-xs space-y-0.5">
              <span className="text-muted-foreground">Pearson r with rating</span>
              <div className="font-mono text-sm" style={{ color: Math.abs(corr) > 0.3 ? "var(--brand-cyan)" : "var(--muted-foreground)" }}>
                {corr >= 0 ? "+" : ""}{corr.toFixed(3)}
                {Math.abs(corr) > 0.3 ? " ← signal!" : " (weak)"}
              </div>
            </div>
            <div className="text-xs space-y-0.5">
              <span className="text-muted-foreground">Mean rating overall</span>
              <div className="font-mono text-sm text-foreground">{avgRating.toFixed(2)} / 5</div>
            </div>
          </ControlGroup>
        </div>
      }
    >
      {view === "raw" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-card-muted/40">
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">timestamp</th>
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">text</th>
                <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-card-muted/20">
                  <td className="px-3 py-1 font-mono text-muted-foreground whitespace-nowrap">{r.ts}</td>
                  <td className="px-3 py-1 text-foreground max-w-[200px] truncate">{r.text}</td>
                  <td className="px-3 py-1 text-right font-mono" style={{ color: "var(--brand-cyan)" }}>{r.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1.5 text-xs text-muted-foreground italic">Raw strings — no numeric signal for a model yet. Switch to "Extracted features" →</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-card-muted/40">
                {COLS.map((k) => (
                  <th
                    key={k}
                    className="px-2 py-1.5 text-right font-medium cursor-pointer whitespace-nowrap"
                    style={{ color: activeFeature === k ? "var(--brand-cyan)" : "var(--muted-foreground)" }}
                    onClick={() => setActiveFeature(k)}
                  >
                    {FEATURE_LABELS[k]}{activeFeature === k ? " ▲" : ""}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-card-muted/20">
                  {COLS.map((k) => (
                    <td
                      key={k}
                      className="px-2 py-1 text-right font-mono"
                      style={{ color: activeFeature === k ? "var(--brand-cyan)" : "var(--foreground)" }}
                    >
                      {k === "dow" ? DOW[r[k]] : String(r[k])}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right font-mono text-foreground">{r.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-1.5 text-xs text-muted-foreground italic">Click any column header to inspect its distribution below →</p>
        </div>
      )}

      <p className="mt-3 mb-1 text-xs font-medium text-muted-foreground">
        Avg rating by <span style={{ color: "var(--brand-cyan)" }}>{FEATURE_LABELS[activeFeature]}</span> bucket
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />

        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={PAD - 4} y1={sy(v)} x2={W - PAD} y2={sy(v)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={PAD - 6} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{v}</text>
          </g>
        ))}

        <line x1={PAD} y1={sy(avgRating)} x2={W - PAD} y2={sy(avgRating)}
          stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="5,3" opacity={0.6} />
        <text x={W - PAD + 2} y={sy(avgRating) + 3} fontSize="8" fill="var(--muted-foreground)">avg</text>

        {bins.map((b, i) => {
          const x = barX(i);
          const barH = b.n > 0 ? Math.max(2, sy(0) - sy(b.avg)) : 0;
          const y = sy(b.avg);
          const binLo = lo + i * binWidth;
          const label = activeFeature === "dow"
            ? DOW[Math.min(6, Math.round(binLo))]
            : Math.round(binLo).toString();
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={barH}
                fill="var(--brand-cyan)" opacity={b.n > 0 ? 0.75 : 0.15}
                rx="2"
              />
              {b.n > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="var(--brand-cyan)">
                  {b.avg.toFixed(1)}
                </text>
              )}
              <text x={x + barW / 2} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)">
                {label}
              </text>
            </g>
          );
        })}

        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          {FEATURE_LABELS[activeFeature]} bucket
        </text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)"
          transform={`rotate(-90,12,${H / 2})`}>avg rating</text>
      </svg>
    </VizFrame>
  );
}
