"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, MousePointerClick } from "lucide-react";
import { type Concept, type Module, getAdjacent } from "@/content/curriculum";
import { useProgress } from "@/lib/progress";
import { useDifficulty } from "@/lib/difficulty";
import { DifficultyToggle } from "@/components/layout/difficulty-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConceptLayout({
  concept,
  module: mod,
  children,
}: {
  concept: Concept;
  module: Module;
  children: React.ReactNode;
}) {
  const { isComplete, toggle } = useProgress();
  const { level } = useDifficulty();
  const { prev, next } = getAdjacent(concept.slug);
  const done = isComplete(concept.slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground">Learn</Link>
        <span>/</span>
        <span className="text-brand-violet">{mod.title}</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={mod.tone}>{mod.short}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} /> {concept.minutes} min</span>
        {concept.hasViz ? (
          <span className="inline-flex items-center gap-1 text-xs text-brand-cyan"><MousePointerClick size={12} /> interactive</span>
        ) : null}
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{concept.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{concept.blurb}</p>

      <div className="my-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Reading the <span className="font-semibold" style={{ color: level === "basic" ? "var(--brand-cyan)" : "var(--brand-violet)" }}>{level}</span> version
        </span>
        <DifficultyToggle />
      </div>

      <div className="prose-prism">{children}</div>

      <button
        onClick={() => toggle(concept.slug)}
        className={cn(
          "mt-10 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
          done ? "border-success/50 bg-success/10 text-success" : "border-border hover:border-brand-violet/50 hover:bg-muted",
        )}
      >
        <Check size={16} /> {done ? "Completed" : "Mark as complete"}
      </button>

      <div className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="group flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-brand-violet/50 hover:bg-muted">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={12} /> Previous</span>
            <span className="mt-1 font-medium text-foreground">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="group flex flex-col rounded-xl border border-border p-4 text-right transition-colors hover:border-brand-violet/50 hover:bg-muted sm:items-end">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">Next <ArrowRight size={12} /></span>
            <span className="mt-1 font-medium text-foreground">{next.title}</span>
          </Link>
        ) : <span />}
      </div>
    </article>
  );
}
