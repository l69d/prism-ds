"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { SegButton, VizButton, Slider } from "@/components/viz/controls";
import { RotateCcw } from "lucide-react";

type Mode = "melt" | "pivot";

const PRODUCTS = ["Widget", "Gadget", "Doohickey", "Gizmo", "Thingamajig"];
const QTRS = ["Q1", "Q2", "Q3", "Q4"];
const ROW_COLORS = [
  "var(--brand-cyan)",
  "var(--brand-pink)",
  "var(--brand-violet)",
  "var(--brand-indigo)",
  "var(--warning)",
];

interface WideRow { product: string; q1: number; q2: number; q3: number; q4: number; }
interface LongRow { product: string; quarter: string; sales: number; srcRow: number; }

function buildWide(seed: number, nRows: number, nCols: number): WideRow[] {
  const rand = rng(seed);
  return range(nRows).map((i) => ({
    product: PRODUCTS[i],
    q1: nCols >= 1 ? Math.round(10 + rand() * 90) : 0,
    q2: nCols >= 2 ? Math.round(10 + rand() * 90) : 0,
    q3: nCols >= 3 ? Math.round(10 + rand() * 90) : 0,
    q4: nCols >= 4 ? Math.round(10 + rand() * 90) : 0,
  }));
}

function wideToLong(wide: WideRow[], nCols: number): LongRow[] {
  const long: LongRow[] = [];
  wide.forEach((row, ri) => {
    const vals = [row.q1, row.q2, row.q3, row.q4];
    range(nCols).forEach((ci) => {
      long.push({ product: row.product, quarter: QTRS[ci], sales: vals[ci], srcRow: ri });
    });
  });
  return long;
}

export default function Viz() {
  const [mode, setMode] = useState<Mode>("melt");
  const [nRows, setNRows] = useState(3);
  const [nCols, setNcols] = useState(3);
  const [activeRow, setActiveRow] = useState<number>(0);
  const [seed, setSeed] = useState(42);

  const wide = useMemo(() => buildWide(seed, nRows, nCols), [seed, nRows, nCols]);
  const long = useMemo(() => wideToLong(wide, nCols), [wide, nCols]);

  const activeLongRows = long.filter((r) => r.srcRow === activeRow);
  const wideShape = `${nRows} × ${1 + nCols}`;
  const longShape = `${nRows * nCols} × 3`;

  const colHeaders = ["product", ...QTRS.slice(0, nCols)];
  const longHeaders = ["product", "quarter", "sales"];

  const isWideActive = (ri: number) => ri === activeRow;
  const isLongActive = (r: LongRow) => r.srcRow === activeRow;
  const isLongCellHighlight = (r: LongRow, col: string) => {
    if (!isLongActive(r)) return false;
    if (col === "quarter" || col === "sales") return true;
    return false;
  };

  return (
    <VizFrame
      title="Reshaping Data"
      hint="click a row in the wide table to trace how it explodes into long format"
      controls={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Direction:</span>
            <SegButton active={mode === "melt"} onClick={() => setMode("melt")}>Wide → Long (melt)</SegButton>
            <SegButton active={mode === "pivot"} onClick={() => setMode("pivot")}>Long → Wide (pivot)</SegButton>
            <VizButton onClick={() => { setSeed((s) => s + 7); setActiveRow(0); }} className="ml-auto">
              <RotateCcw size={13} /> Reseed
            </VizButton>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-28">
              <Slider label="Products (rows)" min={2} max={5} step={1} value={nRows}
                onChange={(v) => { setNRows(v); setActiveRow(0); }} format={(v) => String(v)} />
            </div>
            <div className="flex-1 min-w-28">
              <Slider label="Quarter cols" min={2} max={4} step={1} value={nCols}
                onChange={(v) => { setNcols(v); setActiveRow(0); }} format={(v) => String(v)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <span className="text-muted-foreground">
              Wide shape: <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>{wideShape}</span>
            </span>
            <span className="text-muted-foreground">
              Long shape: <span className="font-mono" style={{ color: "var(--brand-pink)" }}>{longShape}</span>
            </span>
            <span className="text-muted-foreground">
              Each wide row → <span className="font-mono text-foreground">{nCols} long rows</span>
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-1.5">
          {mode === "melt" ? (
            <code className="text-xs" style={{ color: "var(--brand-cyan)" }}>
              {`df.melt(id_vars=["product"], value_vars=${JSON.stringify(QTRS.slice(0, nCols))}, var_name="quarter", value_name="sales")`}
            </code>
          ) : (
            <code className="text-xs" style={{ color: "var(--brand-pink)" }}>
              {`df.pivot(index="product", columns="quarter", values="sales")`}
            </code>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-x-auto">
          {/* Wide table */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--brand-cyan)" }}>
                Wide {wideShape}
              </span>
              {mode === "melt" && <span className="text-xs text-muted-foreground">(input)</span>}
              {mode === "pivot" && <span className="text-xs" style={{ color: "var(--success)" }}>(output)</span>}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {colHeaders.map((c) => (
                    <th key={c} className="pb-1 pr-2 text-left font-semibold text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wide.map((row, ri) => {
                  const active = isWideActive(ri);
                  const color = ROW_COLORS[ri % ROW_COLORS.length];
                  return (
                    <tr
                      key={ri}
                      onClick={() => setActiveRow(ri)}
                      className="cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/30"
                      style={{ background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : undefined }}
                    >
                      {colHeaders.map((c) => {
                        const val = c === "product" ? row.product : (row as unknown as Record<string, unknown>)[c];
                        const isQuarterCol = c !== "product";
                        return (
                          <td
                            key={c}
                            className="py-1 pr-2 font-mono"
                            style={{
                              color: active && isQuarterCol ? color : "var(--foreground)",
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {isQuarterCol ? `$${val}` : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Long table */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--brand-pink)" }}>
                Long {longShape}
              </span>
              {mode === "melt" && <span className="text-xs" style={{ color: "var(--success)" }}>(output)</span>}
              {mode === "pivot" && <span className="text-xs text-muted-foreground">(input)</span>}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {longHeaders.map((c) => (
                    <th key={c} className="pb-1 pr-2 text-left font-semibold text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {long.map((r, li) => {
                  const active = isLongActive(r);
                  const color = ROW_COLORS[r.srcRow % ROW_COLORS.length];
                  return (
                    <tr
                      key={li}
                      className="border-b border-border/30 transition-colors"
                      style={{ background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : undefined }}
                    >
                      {longHeaders.map((col) => {
                        const val = (r as unknown as Record<string, unknown>)[col];
                        const highlight = isLongCellHighlight(r, col);
                        return (
                          <td
                            key={col}
                            className="py-1 pr-2 font-mono"
                            style={{
                              color: active ? (highlight ? color : `color-mix(in srgb, ${color} 70%, var(--foreground))`) : "var(--foreground)",
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {col === "sales" ? `$${val}` : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          {mode === "melt" ? (
            <>
              Row{" "}
              <span className="font-mono font-semibold" style={{ color: ROW_COLORS[activeRow % ROW_COLORS.length] }}>
                {wide[activeRow]?.product}
              </span>{" "}
              had <span className="font-mono text-foreground">{nCols}</span> quarter columns →{" "}
              explodes into{" "}
              <span className="font-mono font-semibold" style={{ color: ROW_COLORS[activeRow % ROW_COLORS.length] }}>
                {nCols} long rows
              </span>.{" "}
              The <em>variable name</em> becomes a value; shape goes from {wideShape} → {longShape}.
            </>
          ) : (
            <>
              Each group of <span className="font-mono text-foreground">{nCols}</span> long rows for a product{" "}
              collapses into <span className="font-mono text-foreground">1 wide row</span>.{" "}
              The <em>quarter</em> column becomes column headers; shape goes from {longShape} → {wideShape}.
            </>
          )}
        </div>

        {/* Visual arrow indicator */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {range(nCols).map((ci) => {
            const lr = activeLongRows[ci];
            if (!lr) return null;
            const color = ROW_COLORS[activeRow % ROW_COLORS.length];
            return (
              <div key={ci} className="flex items-center gap-1">
                <span className="rounded px-1.5 py-0.5 font-mono text-xs font-semibold"
                  style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
                  {lr.quarter}: ${lr.sales}
                </span>
              </div>
            );
          })}
          <span className="text-xs text-muted-foreground ml-1">← active row cells</span>
        </div>
      </div>
    </VizFrame>
  );
}
