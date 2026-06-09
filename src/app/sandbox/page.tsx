import type { Metadata } from "next";
import { SandboxTabs } from "@/components/sandbox/sandbox-tabs";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sandbox",
  description:
    "A data-science playground: a function/heatmap plotter that fits your own data, plus a Concept Gallery of 90 interactive visualizers — one per concept — where you can tinker with the core idea and learn by doing.",
};

export default function SandboxPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 max-w-2xl">
        <Badge tone="cyan" className="mb-3">Playground</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Visualization <span className="text-gradient">Sandbox</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Learn by tinkering. Plot functions and distributions, fit a curve to your own pasted data, and
          render 2-variable heatmaps in the <span className="font-medium text-foreground">Function Plotter</span> —
          or open the <span className="font-medium text-foreground">Concept Gallery</span> to grab an
          interactive visualizer for any of the 90 concepts in the course and play with the idea directly.
        </p>
      </div>

      <SandboxTabs />
    </div>
  );
}
