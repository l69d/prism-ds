import type { Metadata } from "next";
import Link from "next/link";
import { Sprout, Rocket, MousePointerClick, Layers } from "lucide-react";
import { stats } from "@/content/curriculum";

export const metadata: Metadata = {
  title: "About",
  description: "What Prism is, who it's for, and the philosophy behind learning data science visually.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        About <span className="text-gradient">Prism</span>
      </h1>
      <div className="prose-prism mt-6">
        <p>
          Prism is a holistic, visual place to learn data science — {stats.concepts} concepts across
          {" "}{stats.modules} modules, spanning everything from your first exploratory plot to
          deploying and monitoring models in production.
        </p>
        <p>
          Most resources are either too shallow (a glossary of buzzwords) or too heavy (a 600-page
          textbook). Prism aims for the middle: <strong>short, intuitive explanations backed by
          interactive visualizations</strong>, with a second layer of rigor for when you want it.
        </p>

        <h2>The Basic / Advanced toggle</h2>
        <p>
          Every concept is written twice. The <strong>Basic</strong> version builds intuition with
          plain language and pictures. The <strong>Advanced</strong> version adds the math, the code,
          the assumptions, and the senior-level edge cases. Flip the switch in the header on any lesson —
          it remembers your choice.
        </p>

        <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <Sprout className="text-brand-cyan" size={20} />
            <div className="mt-2 font-semibold text-foreground">Basic</div>
            <p className="mt-1 text-sm text-muted-foreground">Intuition, analogies, and visuals. For when you want the idea fast.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Rocket className="text-brand-violet" size={20} />
            <div className="mt-2 font-semibold text-foreground">Advanced</div>
            <p className="mt-1 text-sm text-muted-foreground">Equations, code, derivations, and the gotchas that bite in practice.</p>
          </div>
        </div>

        <h2>Why interactive?</h2>
        <p>
          You understand gradient descent the moment you crank the learning rate too high and watch it
          diverge. You understand overfitting when you drag a polynomial through every noisy point and
          see the test error climb. <MousePointerClick className="inline" size={15} /> Interaction turns
          passive reading into a feel for the mechanics.
        </p>

        <h2>Who it&apos;s for</h2>
        <p>
          People who already know a little — a student past the basics, an analyst moving into ML, an
          engineer leveling toward senior. If you can read a bit of Python and remember some high-school
          math, you&apos;re ready.
        </p>

        <h2>Coverage</h2>
        <p className="flex items-center gap-2">
          <Layers className="text-brand-violet" size={18} />
          <span>EDA · statistics · classical ML · deep learning · NLP &amp; LLMs · time series · causal inference · MLOps &amp; production · communication.</span>
        </p>
      </div>

      <div className="mt-10">
        <Link href="/learn" className="font-medium text-brand-cyan hover:underline">Browse the full curriculum →</Link>
      </div>
    </div>
  );
}
