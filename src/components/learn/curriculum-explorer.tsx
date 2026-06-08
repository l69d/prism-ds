"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, MousePointerClick, Search } from "lucide-react";
import { curriculum, stats } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { ModuleIcon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneText: Record<string, string> = {
  violet: "text-brand-violet",
  indigo: "text-brand-indigo",
  cyan: "text-brand-cyan",
  pink: "text-brand-pink",
};
const toneBg: Record<string, string> = {
  violet: "bg-brand-violet/12",
  indigo: "bg-brand-indigo/12",
  cyan: "bg-brand-cyan/12",
  pink: "bg-brand-pink/12",
};

export function CurriculumExplorer() {
  const { isComplete, count } = useProgress();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return curriculum;
    return curriculum
      .map((m) => ({
        ...m,
        concepts: m.concepts.filter(
          (c) =>
            c.title.toLowerCase().includes(needle) ||
            c.blurb.toLowerCase().includes(needle),
        ),
      }))
      .filter((m) => m.concepts.length > 0);
  }, [q]);

  const pct = Math.round((count / stats.concepts) * 100);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search concepts…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-violet/50 focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{count} / {stats.concepts} complete</span>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {filtered.map((mod) => (
          <section key={mod.id} id={mod.id} className="scroll-mt-20">
            <div className="mb-4 flex items-start gap-3">
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneBg[mod.tone], toneText[mod.tone])}>
                <ModuleIcon name={mod.icon} size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{mod.title}</h2>
                <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{mod.description}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mod.concepts.map((c) => {
                const done = isComplete(c.slug);
                return (
                  <Link
                    key={c.slug}
                    href={`/learn/${c.slug}`}
                    className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:border-brand-violet/40 hover:bg-card-muted/40 hover:shadow-lg hover:shadow-brand-violet/5"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {c.status === "live" ? (
                          <Badge tone={mod.tone}>Live</Badge>
                        ) : (
                          <Badge tone="muted">Soon</Badge>
                        )}
                        {c.hasViz ? <MousePointerClick size={13} className="text-brand-cyan" /> : null}
                      </div>
                      {done ? <Check size={15} className="text-success" /> : null}
                    </div>
                    <h3 className="font-semibold leading-snug text-foreground group-hover:text-brand-violet">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.blurb}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} /> {c.minutes} min</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">No concepts match &quot;{q}&quot;.</p>
        ) : null}
      </div>
    </div>
  );
}
