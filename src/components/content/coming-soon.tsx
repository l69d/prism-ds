"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Sparkles, Target } from "lucide-react";
import { type Concept, type Module, getAdjacent } from "@/content/curriculum";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({ concept, module: mod }: { concept: Concept; module: Module }) {
  const { prev, next } = getAdjacent(concept.slug);
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
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{concept.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{concept.blurb}</p>

      <div className="my-8 rounded-2xl border border-brand-violet/30 bg-gradient-to-br from-brand-violet/10 to-brand-cyan/5 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-violet">
          <Sparkles size={16} /> Full interactive lesson in progress
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This concept is part of the Prism curriculum and is being written with the same
          depth and interactive visualizations as the live lessons. Here&apos;s what it will cover:
        </p>
      </div>

      {concept.objectives?.length ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Target size={16} className="text-brand-cyan" /> What you&apos;ll learn</div>
          <ul className="flex flex-col gap-2">
            {concept.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet" /> {o}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-border bg-card-muted/40 p-4 text-sm text-muted-foreground">
        Want this one next? The live lessons —
        {" "}<Link href="/learn/exploratory-data-analysis" className="text-brand-cyan hover:underline">EDA</Link>,
        {" "}<Link href="/learn/gradient-descent" className="text-brand-cyan hover:underline">gradient descent</Link>,
        {" "}<Link href="/learn/bias-variance-tradeoff" className="text-brand-cyan hover:underline">bias-variance</Link> and more —
        {" "}show the format you can expect here.
      </div>

      <div className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="flex flex-col rounded-xl border border-border p-4 transition-colors hover:border-brand-violet/50 hover:bg-muted">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={12} /> Previous</span>
            <span className="mt-1 font-medium text-foreground">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="flex flex-col rounded-xl border border-border p-4 text-right transition-colors hover:border-brand-violet/50 hover:bg-muted sm:items-end">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">Next <ArrowRight size={12} /></span>
            <span className="mt-1 font-medium text-foreground">{next.title}</span>
          </Link>
        ) : <span />}
      </div>
    </article>
  );
}
