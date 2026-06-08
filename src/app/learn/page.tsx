import type { Metadata } from "next";
import Link from "next/link";
import { curriculum, stats } from "@/content/curriculum";
import { CurriculumExplorer } from "@/components/learn/curriculum-explorer";

export const metadata: Metadata = {
  title: "Learn",
  description: `Browse all ${stats.concepts} data-science concepts across ${stats.modules} modules — from EDA to production ML.`,
};

export default function LearnPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          The complete <span className="text-gradient">data science</span> curriculum
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {stats.concepts} concepts across {stats.modules} modules, from your first EDA to deploying
          models in production. {stats.live} are live with interactive visualizations — the rest are
          on the way. Every lesson has a Basic and an Advanced depth.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {curriculum.map((m) => (
          <Link
            key={m.id}
            href={`#${m.id}`}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground"
          >
            {m.short}
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <CurriculumExplorer />
      </div>
    </div>
  );
}
