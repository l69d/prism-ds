"use client";

import { useState, useMemo } from "react";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

type JoinType = "inner" | "left" | "anti";
type ViewMode = "join" | "groupby";

const ORDERS = [
  { id: 1, user_id: 1, amount: 120 },
  { id: 2, user_id: 2, amount: 85 },
  { id: 3, user_id: 1, amount: 200 },
  { id: 4, user_id: 4, amount: 55 },
  { id: 5, user_id: 3, amount: 310 },
  { id: 6, user_id: 4, amount: 90 },
];

const USERS = [
  { user_id: 1, name: "Alice" },
  { user_id: 2, name: "Bob" },
  { user_id: 3, name: "Carol" },
  { user_id: 5, name: "Dave" },
];

const CYAN = "var(--brand-cyan)";
const PINK = "var(--brand-pink)";
const VIOLET = "var(--brand-violet)";

function joinRows(jt: JoinType) {
  if (jt === "inner") {
    return ORDERS.flatMap((o) => {
      const u = USERS.find((u) => u.user_id === o.user_id);
      return u ? [{ ...o, name: u.name, matched: true }] : [];
    });
  }
  if (jt === "left") {
    return ORDERS.map((o) => {
      const u = USERS.find((u) => u.user_id === o.user_id);
      return { ...o, name: u ? u.name : null, matched: !!u };
    });
  }
  // anti
  return ORDERS.filter((o) => !USERS.find((u) => u.user_id === o.user_id)).map(
    (o) => ({ ...o, name: null, matched: false })
  );
}

function groupRows(rows: ReturnType<typeof joinRows>) {
  const map: Record<string, { name: string | null; count: number; total: number }> = {};
  for (const r of rows) {
    const key = r.name ?? "(null)";
    if (!map[key]) map[key] = { name: r.name, count: 0, total: 0 };
    map[key].count++;
    map[key].total += r.amount;
  }
  return Object.entries(map).map(([k, v]) => ({ key: k, ...v }));
}

export default function Viz() {
  const [joinType, setJoinType] = useState<JoinType>("inner");
  const [view, setView] = useState<ViewMode>("join");
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const joined = useMemo(() => joinRows(joinType), [joinType]);
  const grouped = useMemo(() => groupRows(joined), [joined]);

  const unmatchedCount = joined.filter((r) => !r.matched).length;

  const handleJoinChange = (jt: JoinType) => {
    setJoinType(jt);
    setHighlighted(null);
  };

  // Layout constants
  const W = 640, H = 340, PAD = 16;
  const rowH = 36, rowGap = 2;
  const leftX = PAD + 10, rightX = W / 2 + 10, resultX = W * 0.72;
  const colW = W / 2 - PAD - 24;
  const headerH = 24;
  const startY = 52;

  const ordersColor = CYAN;
  const usersColor = PINK;

  // highlight matching user rows
  const highlightedUserId = highlighted !== null ? ORDERS[highlighted]?.user_id : null;
  const matchingUserIdx = highlightedUserId !== null
    ? USERS.findIndex((u) => u.user_id === highlightedUserId)
    : -1;

  const joinLabel = joinType === "inner"
    ? "Only rows with a match in both tables"
    : joinType === "left"
    ? "All left rows — right side is NULL when no match"
    : "Only rows with NO match in right table";

  return (
    <VizFrame
      title="Joins & Aggregations"
      hint="click an order row to trace it"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-muted-foreground mr-1">View:</span>
            <SegButton active={view === "join"} onClick={() => setView("join")}>Join</SegButton>
            <SegButton active={view === "groupby"} onClick={() => setView("groupby")}>GROUP BY name</SegButton>
            <VizButton onClick={() => setHighlighted(null)} className="ml-auto">
              <RotateCcw size={12} /> Reset
            </VizButton>
          </div>
          {view === "join" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-medium text-muted-foreground mr-1">Join type:</span>
              <SegButton active={joinType === "inner"} onClick={() => handleJoinChange("inner")}>INNER</SegButton>
              <SegButton active={joinType === "left"} onClick={() => handleJoinChange("left")}>LEFT</SegButton>
              <SegButton active={joinType === "anti"} onClick={() => handleJoinChange("anti")}>ANTI</SegButton>
            </div>
          )}
          <div className="flex gap-4 text-xs">
            {view === "join" ? (
              <>
                <span>
                  <span className="font-mono font-bold" style={{ color: CYAN }}>{joined.length}</span>
                  <span className="text-muted-foreground ml-1">result rows</span>
                </span>
                {joinType === "left" && (
                  <span>
                    <span className="font-mono font-bold" style={{ color: PINK }}>{unmatchedCount}</span>
                    <span className="text-muted-foreground ml-1">with NULL name</span>
                  </span>
                )}
                <span className="text-muted-foreground italic">{joinLabel}</span>
              </>
            ) : (
              <>
                <span>
                  <span className="font-mono font-bold" style={{ color: VIOLET }}>{grouped.length}</span>
                  <span className="text-muted-foreground ml-1">groups from {joined.length} rows</span>
                </span>
                <span className="text-muted-foreground italic">GROUP BY collapses rows → one row per group</span>
              </>
            )}
          </div>
        </div>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 260 }}>
        {/* --- JOIN VIEW --- */}
        {view === "join" && (
          <>
            {/* Left table header */}
            <rect x={leftX} y={PAD} width={colW} height={headerH} rx={4} fill={ordersColor} opacity={0.18} />
            <text x={leftX + colW / 2} y={PAD + 15} textAnchor="middle" fontSize={11} fontWeight="600" fill={ordersColor}>orders (left)</text>

            {/* Right table header */}
            <rect x={rightX} y={PAD} width={colW} height={headerH} rx={4} fill={usersColor} opacity={0.18} />
            <text x={rightX + colW / 2} y={PAD + 15} textAnchor="middle" fontSize={11} fontWeight="600" fill={usersColor}>users (right)</text>

            {/* Order rows */}
            {ORDERS.map((o, i) => {
              const y = startY + i * (rowH + rowGap);
              const isHl = highlighted === i;
              const isMatch = !!USERS.find((u) => u.user_id === o.user_id);
              return (
                <g key={"o" + i} style={{ cursor: "pointer" }} onClick={() => setHighlighted(isHl ? null : i)}>
                  <rect x={leftX} y={y} width={colW} height={rowH} rx={3}
                    fill={isHl ? ordersColor : "var(--card)"}
                    stroke={isHl ? ordersColor : "var(--border)"}
                    strokeWidth={isHl ? 1.5 : 1} opacity={isHl ? 0.22 : 1} />
                  <rect x={leftX} y={y} width={colW} height={rowH} rx={3}
                    fill={isHl ? ordersColor : "transparent"} opacity={0.1} />
                  <text x={leftX + 8} y={y + 14} fontSize={10} fill="var(--muted-foreground)">user_id:</text>
                  <text x={leftX + 56} y={y + 14} fontSize={11} fontWeight="600" fill={isHl ? ordersColor : "var(--foreground)"}>{o.user_id}</text>
                  <text x={leftX + 8} y={y + 27} fontSize={10} fill="var(--muted-foreground)">amt: <tspan fontWeight="500" fill="var(--foreground)">{o.amount}</tspan></text>
                  {!isMatch && (
                    <text x={leftX + colW - 8} y={y + 21} textAnchor="end" fontSize={9} fill="var(--warning)" opacity={0.9}>no match</text>
                  )}
                </g>
              );
            })}

            {/* User rows */}
            {USERS.map((u, i) => {
              const y = startY + i * (rowH + rowGap);
              const isHl = matchingUserIdx === i && highlighted !== null;
              return (
                <g key={"u" + i}>
                  <rect x={rightX} y={y} width={colW} height={rowH} rx={3}
                    fill={isHl ? usersColor : "var(--card)"}
                    stroke={isHl ? usersColor : "var(--border)"}
                    strokeWidth={isHl ? 1.5 : 1} />
                  <rect x={rightX} y={y} width={colW} height={rowH} rx={3} fill={isHl ? usersColor : "transparent"} opacity={0.1} />
                  <text x={rightX + 8} y={y + 14} fontSize={10} fill="var(--muted-foreground)">user_id:</text>
                  <text x={rightX + 56} y={y + 14} fontSize={11} fontWeight="600" fill={isHl ? usersColor : "var(--foreground)"}>{u.user_id}</text>
                  <text x={rightX + 8} y={y + 27} fontSize={10} fill="var(--muted-foreground)">name: <tspan fontWeight="500" fill="var(--foreground)">{u.name}</tspan></text>
                </g>
              );
            })}

            {/* Connector line when highlighted */}
            {highlighted !== null && matchingUserIdx >= 0 && (
              <line
                x1={leftX + colW}
                y1={startY + highlighted * (rowH + rowGap) + rowH / 2}
                x2={rightX}
                y2={startY + matchingUserIdx * (rowH + rowGap) + rowH / 2}
                stroke={ordersColor} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
              />
            )}

            {/* Result label */}
            <text x={resultX + 38} y={PAD + 15} textAnchor="middle" fontSize={11} fontWeight="600" fill={VIOLET}>result</text>
            <rect x={resultX} y={PAD} width={76} height={headerH} rx={4} fill={VIOLET} opacity={0.14} />

            {/* Result rows */}
            {joined.map((r, i) => {
              const y = startY + i * (rowH + rowGap);
              const isHl = highlighted !== null && ORDERS.findIndex((o) => o.id === r.id) === highlighted;
              return (
                <g key={"r" + i}>
                  <rect x={resultX} y={y} width={76} height={rowH} rx={3}
                    fill={r.matched ? (isHl ? VIOLET : "var(--card)") : "var(--warning)"}
                    stroke={isHl ? VIOLET : (r.matched ? "var(--border)" : "var(--warning)")}
                    strokeWidth={isHl ? 1.5 : 1}
                    opacity={r.matched ? (isHl ? 0.18 : 1) : 0.18} />
                  {r.matched && <rect x={resultX} y={y} width={76} height={rowH} rx={3} fill={isHl ? VIOLET : "transparent"} opacity={0.1} />}
                  <text x={resultX + 6} y={y + 14} fontSize={10} fill="var(--muted-foreground)">
                    {r.name !== null ? r.name : "NULL"}
                  </text>
                  <text x={resultX + 6} y={y + 27} fontSize={10} fill="var(--muted-foreground)">
                    {r.amount}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* --- GROUPBY VIEW --- */}
        {view === "groupby" && (
          <>
            <text x={W / 2} y={22} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">
              {joined.length} joined rows → GROUP BY name → {grouped.length} groups
            </text>

            {/* Before rows (mini) */}
            {joined.map((r, i) => {
              const cols = 3;
              const bw = 88, bh = 22, gap = 4;
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = PAD + col * (bw + gap);
              const y = 36 + row * (bh + gap);
              const grp = grouped.find((g) => (g.name ?? "(null)") === (r.name ?? "(null)"));
              const grpIdx = grouped.indexOf(grp!);
              const grpColors = [CYAN, PINK, VIOLET, "var(--warning)", "var(--success)"];
              const c = grpColors[grpIdx % grpColors.length];
              return (
                <g key={"b" + i}>
                  <rect x={x} y={y} width={bw} height={bh} rx={3} fill={c} opacity={0.13} stroke={c} strokeWidth={0.8} />
                  <text x={x + 4} y={y + 13} fontSize={9} fill="var(--muted-foreground)">{r.name ?? "NULL"}</text>
                  <text x={x + bw - 4} y={y + 13} textAnchor="end" fontSize={9} fontWeight="600" fill={c}>{r.amount}</text>
                </g>
              );
            })}

            {/* Arrow */}
            <text x={W / 2 - 4} y={H / 2 + 4} fontSize={18} fill="var(--muted-foreground)" opacity={0.5}>→</text>

            {/* After groups */}
            {grouped.map((g, i) => {
              const grpColors = [CYAN, PINK, VIOLET, "var(--warning)", "var(--success)"];
              const c = grpColors[i % grpColors.length];
              const gw = 110, gh = 46, gap = 8;
              const cols = 2;
              const col = i % cols;
              const row = Math.floor(i / cols);
              const startGX = W / 2 + 30;
              const startGY = 36;
              const x = startGX + col * (gw + gap);
              const y = startGY + row * (gh + gap);
              return (
                <g key={"g" + i}>
                  <rect x={x} y={y} width={gw} height={gh} rx={5} fill={c} opacity={0.15} stroke={c} strokeWidth={1.2} />
                  <text x={x + gw / 2} y={y + 15} textAnchor="middle" fontSize={11} fontWeight="700" fill={c}>{g.key}</text>
                  <text x={x + 8} y={y + 31} fontSize={9} fill="var(--muted-foreground)">count: <tspan fontWeight="600" fill="var(--foreground)">{g.count}</tspan></text>
                  <text x={x + gw - 8} y={y + 31} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">sum: <tspan fontWeight="600" fill="var(--foreground)">{g.total}</tspan></text>
                </g>
              );
            })}

            {/* Legend */}
            <text x={PAD + 4} y={H - 12} fontSize={9} fill="var(--muted-foreground)">
              {joined.length} rows (colored by group) — each group reduces to COUNT + SUM
            </text>
          </>
        )}
      </svg>
    </VizFrame>
  );
}
