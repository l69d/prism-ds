import Link from "next/link";
import { ArrowRight, Sprout, Rocket, MousePointerClick, Layers, Microscope, Server } from "lucide-react";
import { curriculum, stats, allConcepts } from "@/content/curriculum";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleIcon } from "@/components/ui/icon";
import { GradientDescentViz } from "@/components/viz/gradient-descent-viz";
import { cn } from "@/lib/utils";

const toneText: Record<string, string> = {
  violet: "text-brand-violet", indigo: "text-brand-indigo",
  cyan: "text-brand-cyan", pink: "text-brand-pink",
};
const toneBg: Record<string, string> = {
  violet: "bg-brand-violet/12", indigo: "bg-brand-indigo/12",
  cyan: "bg-brand-cyan/12", pink: "bg-brand-pink/12",
};

const features = [
  { icon: Sprout, title: "Two depths, one toggle", body: "Every concept has a Basic version for intuition and an Advanced version with the math, code, and edge cases. Switch any time." },
  { icon: MousePointerClick, title: "Learn by playing", body: "Drag a regression line, roll a ball down a loss surface, watch k-means converge. Interactive viz beats static diagrams." },
  { icon: Layers, title: "Truly end-to-end", body: "From your first histogram to deploying and monitoring models in production — the whole skill tree in one place." },
  { icon: Microscope, title: "Intuition first", body: "Short, visual explanations that build a mental model — then the rigor for when you need it." },
];

const featured = allConcepts.filter((c) => c.status === "live").slice(0, 6);

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70 bg-grid">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-violet/20 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="violet" className="mx-auto mb-5">
              {stats.interactive} interactive concepts · {stats.modules} modules
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
              Data science,
              <br />
              <span className="text-gradient">made visual.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              A holistic place to learn everything from your first EDA to deploying production models.
              Important ideas explained <strong className="text-foreground">short, intuitive, and visual</strong> —
              each in a Basic and an Advanced depth.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/learn/exploratory-data-analysis" size="lg">
                Start learning <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="/learn" variant="secondary" size="lg">
                Browse the curriculum
              </ButtonLink>
            </div>
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Sprout size={13} className="text-brand-cyan" /> Basic</span>
              <span className="inline-flex items-center gap-1"><Rocket size={13} className="text-brand-violet" /> Advanced</span>
              <span className="inline-flex items-center gap-1"><Server size={13} /> to production</span>
            </div>
          </div>

          {/* Live teaser */}
          <div className="mx-auto mt-14 max-w-3xl">
            <p className="mb-2 text-center text-xs uppercase tracking-wide text-muted-foreground">
              Try it — this is a real lesson visualization
            </p>
            <GradientDescentViz />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/70 px-4 sm:grid-cols-4 sm:px-6">
          {[
            { n: stats.concepts + "+", l: "concepts" },
            { n: stats.modules, l: "modules" },
            { n: stats.interactive, l: "interactive viz" },
            { n: "2", l: "depths each" },
          ].map((s, i) => (
            <div key={i} className="px-2 py-8 text-center">
              <div className="text-3xl font-bold text-gradient">{s.n}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet/12 text-brand-violet">
                <f.icon size={20} />
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="border-y border-border/70 bg-card-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Everything, mapped</h2>
            <p className="mt-2 text-muted-foreground">
              Twelve modules covering the entire field — pick a starting point or follow it end to end.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((m) => (
              <Link key={m.id} href={`/learn#${m.id}`} className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand-violet/40 hover:shadow-lg hover:shadow-brand-violet/5">
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneBg[m.tone], toneText[m.tone])}>
                  <ModuleIcon name={m.icon} size={22} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-brand-violet">{m.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                  <span className="mt-2 inline-block text-xs text-muted-foreground">{m.concepts.length} concepts</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured lessons */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Start with these</h2>
            <p className="mt-2 text-muted-foreground">Fully interactive lessons, live right now.</p>
          </div>
          <Link href="/learn" className="hidden shrink-0 items-center gap-1 text-sm text-brand-cyan hover:underline sm:flex">
            All concepts <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <Link key={c.slug} href={`/learn/${c.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand-violet/40 hover:shadow-lg hover:shadow-brand-violet/5">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={c.module.tone}>{c.module.short}</Badge>
                <MousePointerClick size={13} className="text-brand-cyan" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-brand-violet">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build real data-science skill, visually.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            No sign-up, no fluff. Just intuitive, interactive lessons from the basics to production.
          </p>
          <div className="mt-7">
            <ButtonLink href="/learn/exploratory-data-analysis" size="lg">
              Start with EDA <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
