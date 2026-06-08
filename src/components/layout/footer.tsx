import Link from "next/link";
import { Logo } from "./logo";
import { stats } from "@/content/curriculum";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Data science, made visual. {stats.concepts}+ concepts from your
              first EDA to deploying models in production — explained intuitively,
              with interactive visualizations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <div className="mb-2 font-semibold text-foreground">Learn</div>
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                <li><Link href="/learn" className="hover:text-foreground">All concepts</Link></li>
                <li><Link href="/roadmap" className="hover:text-foreground">Roadmap</Link></li>
                <li><Link href="/learn/exploratory-data-analysis" className="hover:text-foreground">Start with EDA</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-2 font-semibold text-foreground">Popular</div>
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                <li><Link href="/learn/gradient-descent" className="hover:text-foreground">Gradient Descent</Link></li>
                <li><Link href="/learn/bias-variance-tradeoff" className="hover:text-foreground">Bias-Variance</Link></li>
                <li><Link href="/learn/neural-networks" className="hover:text-foreground">Neural Networks</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-2 font-semibold text-foreground">About</div>
              <ul className="flex flex-col gap-1.5 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">What is Prism</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border/70 pt-6 text-xs text-muted-foreground">
          Built with Next.js · Prism — open, visual data-science learning.
        </div>
      </div>
    </footer>
  );
}
