"use client";

import { useState, useMemo } from "react";
import { rng } from "@/lib/mathx";
import { range } from "@/lib/utils";
import { VizFrame } from "@/components/viz/viz-frame";
import { Slider, SegButton, ControlGroup } from "@/components/viz/controls";

type Op = "select" | "filter" | "groupby" | "transform";

const DEPTS = ["Eng", "Mkt", "Ops", "Eng", "Mkt", "Eng", "Ops", "Mkt", "Eng", "Ops", "Eng", "Mkt"];
const NAMES = ["Alice","Bob","Carol","Dave","Eve","Frank","Grace","Hank","Iris","Jake","Lena","Max"];

function buildData(seed: number) {
  const rand = rng(seed);
  return range(12).map((i) => ({
    id: i + 1,
    name: NAMES[i],
    dept: DEPTS[i],
    salary: Math.round(40 + rand() * 60),
    score: Math.round(50 + rand() * 50),
  }));
}

type Row = ReturnType<typeof buildData>[number];

const DEPT_COLOR: Record<string, string> = {
  Eng: "var(--brand-cyan)",
  Mkt: "var(--brand-pink)",
  Ops: "var(--brand-violet)",
};

export default function Viz() {
  const [op, setOp] = useState<Op>("select");
  const [salaryMin, setSalaryMin] = useState(55);
  const [showScore, setShowScore] = useState(true);
  const [showDept, setShowDept] = useState(true);
  const [seed] = useState(42);

  const data = useMemo(() => buildData(seed), [seed]);

  const result = useMemo(() => {
    if (op === "select") {
      return data.map((r) => ({
        name: r.name,
        ...(showDept ? { dept: r.dept } : {}),
        salary: r.salary,
        ...(showScore ? { score: r.score } : {}),
      }));
    }
    if (op === "filter") {
      return data
        .filter((r) => r.salary >= salaryMin)
        .map((r) => ({ name: r.name, dept: r.dept, salary: r.salary, score: r.score }));
    }
    if (op === "groupby") {
      const groups: Record<string, Row[]> = {};
      for (const r of data) {
        if (!groups[r.dept]) groups[r.dept] = [];
        groups[r.dept].push(r);
      }
      return Object.entries(groups).map(([dept, rows]) => ({
        dept,
        count: rows.length,
        avg_salary: Math.round(rows.reduce((s, r) => s + r.salary, 0) / rows.length),
        avg_score: Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length),
      }));
    }
    // transform
    return data.map((r) => ({
      name: r.name,
      dept: r.dept,
      salary: r.salary,
      salary_k: (r.salary / 100).toFixed(2),
      norm_score: ((r.score - 50) / 50).toFixed(2),
    }));
  }, [op, data, salaryMin, showScore, showDept]);

  const cols = result.length > 0 ? Object.keys(result[0]) : [];
  const visibleRows = op === "groupby" ? result : result.slice(0, 8);

  const rowCount = op === "filter"
    ? data.filter((r) => r.salary >= salaryMin).length
    : op === "groupby"
    ? 3
    : 12;

  const codeSnippets: Record<Op, string> = {
    select: `df[["name"${showDept ? ', "dept"' : ""}, "salary"${showScore ? ', "score"' : ""}]]`,
    filter: `df[df["salary"] >= ${salaryMin}]`,
    groupby: `df.groupby("dept")[["salary","score"]]\n   .mean().round(0)`,
    transform: `df.assign(\n  salary_k=df.salary/100,\n  norm_score=(df.score-50)/50\n)`,
  };
  const codeSnippet = codeSnippets[op];

  const filterPct = Math.round((data.filter((r) => r.salary >= salaryMin).length / data.length) * 100);

  return (
    <VizFrame
      title="Pandas Essentials"
      hint="pick an operation and adjust controls"
      controls={
        <ControlGroup>
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground">Operation</p>
            <div className="flex flex-wrap gap-1.5">
              {(["select", "filter", "groupby", "transform"] as Op[]).map((o) => (
                <SegButton key={o} active={op === o} onClick={() => setOp(o)}>
                  .{o}()
                </SegButton>
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            {op === "select" && (
              <>
                <p className="text-xs font-medium text-muted-foreground">Columns to keep</p>
                <div className="flex gap-2">
                  <SegButton active={showDept} onClick={() => setShowDept((v) => !v)}>dept</SegButton>
                  <SegButton active={showScore} onClick={() => setShowScore((v) => !v)}>score</SegButton>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shape: <span className="font-mono text-foreground">12 × {2 + (showDept ? 1 : 0) + (showScore ? 1 : 0)}</span>
                </p>
              </>
            )}
            {op === "filter" && (
              <>
                <Slider
                  label="salary ≥"
                  min={40} max={95} step={1}
                  value={salaryMin}
                  onChange={setSalaryMin}
                  format={(v) => `$${v}k`}
                />
                <p className="text-xs text-muted-foreground">
                  Rows kept: <span className="font-mono text-foreground">{rowCount} / 12</span>
                  {" "}(<span style={{ color: "var(--brand-cyan)" }}>{filterPct}%</span>)
                </p>
              </>
            )}
            {op === "groupby" && (
              <p className="text-xs text-muted-foreground">
                Groups: <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>Eng · Mkt · Ops</span>
                <br />12 rows → <span className="font-mono text-foreground">3 aggregate rows</span>
              </p>
            )}
            {op === "transform" && (
              <p className="text-xs text-muted-foreground">
                New cols: <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>salary_k, norm_score</span>
                <br />Shape unchanged: <span className="font-mono text-foreground">12 × 5</span>
              </p>
            )}
          </div>
        </ControlGroup>
      }
    >
      <div className="space-y-3">
        <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
          <code className="whitespace-pre text-xs" style={{ color: "var(--brand-cyan)" }}>
            {`df.`}{codeSnippet}
          </code>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {cols.map((c) => (
                  <th
                    key={c}
                    className="pb-1.5 pr-4 text-left font-semibold"
                    style={{ color: "var(--brand-cyan)" }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30"
                >
                  {cols.map((c) => {
                    const val = (row as Record<string, unknown>)[c];
                    const isDept = c === "dept";
                    const deptStr = typeof val === "string" ? val : "";
                    return (
                      <td
                        key={c}
                        className="py-1 pr-4 font-mono"
                        style={{
                          color: isDept ? DEPT_COLOR[deptStr] ?? "var(--foreground)" : "var(--foreground)",
                        }}
                      >
                        {typeof val === "number"
                          ? c === "salary" || c === "avg_salary"
                            ? `$${val}k`
                            : val
                          : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {op !== "groupby" && result.length > 8 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              … {result.length - 8} more rows hidden
            </p>
          )}
          {op === "filter" && result.length === 0 && (
            <p className="mt-2 text-xs" style={{ color: "var(--warning)" }}>
              No rows match — try lowering the salary threshold.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          <span>
            cols: <span className="font-mono text-foreground">{cols.length}</span>
          </span>
          <span>
            rows: <span className="font-mono" style={{ color: "var(--brand-cyan)" }}>{rowCount}</span>
          </span>
          <span>
            op: <span className="font-mono" style={{ color: "var(--brand-pink)" }}>.{op}()</span>
          </span>
        </div>
      </div>
    </VizFrame>
  );
}
