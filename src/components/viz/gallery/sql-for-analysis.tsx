"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton } from "@/components/viz/controls";
import { range } from "@/lib/utils";

const W = 620, H = 300, PAD = 20;

type QueryMode = "raw" | "groupby" | "window_rank" | "window_running";

const SALES_DATA = [
  { id: 1, region: "East",  rep: "Alice",   amount: 420 },
  { id: 2, region: "West",  rep: "Bob",     amount: 310 },
  { id: 3, region: "East",  rep: "Carol",   amount: 580 },
  { id: 4, region: "West",  rep: "Dave",    amount: 490 },
  { id: 5, region: "North", rep: "Eve",     amount: 360 },
  { id: 6, region: "North", rep: "Frank",   amount: 270 },
  { id: 7, region: "East",  rep: "Grace",   amount: 450 },
  { id: 8, region: "West",  rep: "Hank",    amount: 530 },
];

const REGION_COLORS: Record<string, string> = {
  East:  "var(--brand-cyan)",
  West:  "var(--brand-violet)",
  North: "var(--brand-pink)",
};

interface RawRow { id: number; region: string; rep: string; amount: number }
interface GroupRow { region: string; total: number; count: number }
interface WindowRow extends RawRow { rank: number; runningTotal: number }

function computeGroupBy(data: RawRow[]): GroupRow[] {
  const map: Record<string, GroupRow> = {};
  for (const row of data) {
    if (!map[row.region]) map[row.region] = { region: row.region, total: 0, count: 0 };
    map[row.region].total += row.amount;
    map[row.region].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function computeWindow(data: RawRow[], mode: "window_rank" | "window_running"): WindowRow[] {
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const rankMap: Record<number, number> = {};
  sorted.forEach((row, i) => { rankMap[row.id] = i + 1; });

  let running = 0;
  const ordered = mode === "window_running"
    ? [...data].sort((a, b) => a.id - b.id)
    : sorted;

  return ordered.map((row) => {
    running += row.amount;
    return { ...row, rank: rankMap[row.id], runningTotal: running };
  });
}

const QUERY_LABELS: Record<QueryMode, string> = {
  raw:            "SELECT *",
  groupby:        "GROUP BY region",
  window_rank:    "RANK() OVER",
  window_running: "SUM() OVER (ORDER BY)",
};

const SQL_SNIPPETS: Record<QueryMode, string> = {
  raw:            "SELECT id, region, rep, amount\nFROM sales;",
  groupby:        "SELECT region,\n  SUM(amount) AS total,\n  COUNT(*) AS n\nFROM sales\nGROUP BY region;",
  window_rank:    "SELECT *, RANK() OVER\n  (ORDER BY amount DESC)\n  AS overall_rank\nFROM sales;",
  window_running: "SELECT *, SUM(amount) OVER\n  (ORDER BY id ROWS BETWEEN\n   UNBOUNDED PRECEDING\n   AND CURRENT ROW)\n  AS running_total\nFROM sales;",
};

const BAR_MAX_AMOUNT = 620;

export default function Viz() {
  const [mode, setMode] = useState<QueryMode>("raw");
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const groupRows = useMemo(() => computeGroupBy(SALES_DATA), []);
  const rankRows  = useMemo(() => computeWindow(SALES_DATA, "window_rank"), []);
  const runRows   = useMemo(() => computeWindow(SALES_DATA, "window_running"), []);

  const rowCount = mode === "groupby" ? groupRows.length : SALES_DATA.length;
  const collapses = mode === "groupby";
  const isWindow  = mode === "window_rank" || mode === "window_running";

  const barData: { label: string; value: number; max: number; color: string; sub?: string }[] =
    mode === "groupby"
      ? groupRows.map((r) => ({
          label: r.region,
          value: r.total,
          max: 1600,
          color: REGION_COLORS[r.region],
          sub: `n=${r.count}`,
        }))
      : mode === "window_rank"
      ? rankRows.map((r) => ({
          label: r.rep,
          value: r.amount,
          max: BAR_MAX_AMOUNT,
          color: REGION_COLORS[r.region],
          sub: `#${r.rank}`,
        }))
      : mode === "window_running"
      ? runRows.map((r) => ({
          label: r.rep,
          value: r.runningTotal,
          max: runRows[runRows.length - 1]?.runningTotal ?? 1,
          color: REGION_COLORS[r.region],
          sub: `+${r.amount}`,
        }))
      : SALES_DATA.map((r) => ({
          label: r.rep,
          value: r.amount,
          max: BAR_MAX_AMOUNT,
          color: REGION_COLORS[r.region],
        }));

  const barH = Math.floor((H - PAD * 2) / barData.length - 3);
  const labelW = 52;
  const barAreaW = W - PAD * 2 - labelW - 48;

  return (
    <VizFrame
      title="SQL for Analysis"
      hint="switch query type to see rows appear / collapse"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(["raw", "groupby", "window_rank", "window_running"] as QueryMode[]).map((m) => (
              <SegButton key={m} active={mode === m} onClick={() => setMode(m)}>
                {QUERY_LABELS[m]}
              </SegButton>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/50 p-2 font-mono text-muted-foreground whitespace-pre leading-relaxed">
              {SQL_SNIPPETS[mode]}
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Output rows</span>
                <span className={`font-mono font-semibold ${collapses ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
                  {rowCount} {collapses ? "← collapsed!" : "← all kept"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Adds new col</span>
                <span className={`font-mono font-semibold ${isWindow ? "text-[var(--brand-cyan)]" : "text-[var(--muted-foreground)]"}`}>
                  {isWindow ? "yes (window)" : "no"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Keeps detail</span>
                <span className={`font-mono font-semibold ${collapses ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                  {collapses ? "NO" : "yes"}
                </span>
              </div>
              <p className="pt-1 text-muted-foreground leading-relaxed">
                {mode === "raw" && "All 8 rows. No aggregation."}
                {mode === "groupby" && "GROUP BY collapses 8 rows → 3. Detail is lost."}
                {mode === "window_rank" && "RANK() adds rank without losing any row. All 8 remain."}
                {mode === "window_running" && "SUM OVER ORDER BY accumulates down the table. Each row still present."}
              </p>
            </div>
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <rect x={0} y={0} width={W} height={H} fill="var(--card)" rx={8} />

        {range(barData.length).map((i) => {
          const d = barData[i];
          const y = PAD + i * (barH + 3);
          const bw = Math.max(2, (d.value / d.max) * barAreaW);
          const isHl = highlighted === d.color;
          return (
            <g key={i}
               onMouseEnter={() => setHighlighted(d.color)}
               onMouseLeave={() => setHighlighted(null)}
               style={{ cursor: "default" }}>
              <rect x={PAD + labelW} y={y} width={barAreaW} height={barH}
                    fill="var(--muted)" rx={3} opacity={0.35} />
              <rect x={PAD + labelW} y={y} width={bw} height={barH}
                    fill={d.color} rx={3}
                    opacity={highlighted && !isHl ? 0.35 : 0.85} />
              <text x={PAD + labelW - 4} y={y + barH / 2 + 4}
                    textAnchor="end" fontSize={10}
                    fill={isHl ? "var(--foreground)" : "var(--muted-foreground)"}>
                {d.label}
              </text>
              <text x={PAD + labelW + bw + 5} y={y + barH / 2 + 4}
                    fontSize={9} fill={d.color}>
                {d.value.toLocaleString()}{d.sub ? ` ${d.sub}` : ""}
              </text>
            </g>
          );
        })}

        <line x1={PAD + labelW} y1={PAD} x2={PAD + labelW} y2={H - PAD}
              stroke="var(--border)" strokeWidth={1} />

        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9}
              fill="var(--muted-foreground)">
          {mode === "window_running" ? "cumulative $" : mode === "groupby" ? "total $ by region" : "amount ($)"}
        </text>

        {collapses && (
          <text x={W - PAD} y={PAD + 10} textAnchor="end" fontSize={10}
                fill="var(--warning)" fontWeight="600">
            8 rows → 3
          </text>
        )}
        {isWindow && (
          <text x={W - PAD} y={PAD + 10} textAnchor="end" fontSize={10}
                fill="var(--brand-cyan)" fontWeight="600">
            +1 computed col
          </text>
        )}
      </svg>
    </VizFrame>
  );
}
