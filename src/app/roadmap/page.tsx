import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { curriculum } from "@/content/curriculum";
import { ModuleIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "A staged path through data science — from beginner foundations to senior, production-grade skills.",
};

const stages = [
  { name: "Get your bearings", tag: "Beginner", blurb: "How the field works and the math that powers it.", modules: ["foundations", "math"] },
  { name: "Reason with data", tag: "Core", blurb: "Inference, wrangling, and communicating what you find.", modules: ["stats", "wrangling", "dataviz"] },
  { name: "Model", tag: "Intermediate", blurb: "The workhorse ML algorithms and honest evaluation.", modules: ["ml"] },
  { name: "Go deep", tag: "Advanced", blurb: "Neural networks, language models, and sequences.", modules: ["dl", "nlp", "timeseries"] },
  { name: "Senior & production", tag: "Senior", blurb: "Causality, shipping, scaling, and influence.", modules: ["causal", "mlops", "career"] },
];

const toneText: Record<string, string> = {
  violet: "text-brand-violet", indigo: "text-brand-indigo",
  cyan: "text-brand-cyan", pink: "text-brand-pink",
};
const toneBg: Record<string, string> = {
  violet: "bg-brand-violet/12", indigo: "bg-brand-indigo/12",
  cyan: "bg-brand-cyan/12", pink: "bg-brand-pink/12",
};

export default function RoadmapPage() {
  const byId = Object.fromEntries(curriculum.map((m) => [m.id, m]));
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Your <span className="text-gradient">learning path</span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Data science is a tree, not a line — but if you want an order, this is a sensible one. Five
        stages from total beginner to the production-grade skills senior roles expect.
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {stages.map((stage, i) => (
          <div key={stage.name} className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-brand-violet/40 bg-card text-sm font-bold text-brand-violet">
              {i + 1}
            </div>
            {i < stages.length - 1 ? (
              <div className="absolute left-4 top-9 h-[calc(100%+1.5rem)] w-px bg-border" />
            ) : null}
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{stage.name}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{stage.tag}</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{stage.blurb}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {stage.modules.map((id) => {
                const m = byId[id];
                if (!m) return null;
                return (
                  <Link key={id} href={`/learn#${id}`} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-brand-violet/40">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneBg[m.tone], toneText[m.tone])}>
                      <ModuleIcon name={m.icon} size={18} />
                    </span>
                    <div>
                      <div className="font-medium text-foreground group-hover:text-brand-violet">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.concepts.length} concepts</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-brand-violet/30 bg-gradient-to-br from-brand-violet/10 to-brand-cyan/5 p-6 text-center">
        <p className="text-foreground">Ready to begin?</p>
        <Link href="/learn/exploratory-data-analysis" className="mt-3 inline-flex items-center gap-1.5 font-medium text-brand-cyan hover:underline">
          Start with Exploratory Data Analysis <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
