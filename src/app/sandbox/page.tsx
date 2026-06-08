import type { Metadata } from "next";
import { FunctionSandbox } from "@/components/sandbox/function-sandbox";
import { Badge } from "@/components/ui/badge";
import { Move, TrendingUp, Activity, Share2, FunctionSquare, LayoutGrid, Table, Crosshair, Save } from "lucide-react";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "A visualization sandbox for data scientists — plot functions and distributions, render 2-variable heatmaps, fit your own pasted data, mark roots and intersections, pan/zoom, overlay derivatives, save and share plots.",
};

const features = [
  { icon: FunctionSquare, t: "Multi-expression plotting", d: "Type any formula in x with live parameters a–d and a stats function library (normal, sigmoid, relu, gelu…)." },
  { icon: LayoutGrid, t: "2-variable heatmaps", d: "Switch to z = f(x, y) and see it as a viridis heatmap with contour lines and a hover readout of z." },
  { icon: Table, t: "Fit your own data", d: "Paste CSV or columns of x,y (or a single column) and fit a least-squares polynomial to it — no synthetic data needed." },
  { icon: TrendingUp, t: "Curve fitting", d: "Scatter noisy samples or use your data, then watch R² and overfitting as you raise the polynomial degree." },
  { icon: Crosshair, t: "Roots & intersections", d: "Mark every zero crossing of each curve and every point where two curves cross, found by bisection." },
  { icon: Activity, t: "Derivatives", d: "Toggle a numerical derivative overlay on any expression to see its slope everywhere." },
  { icon: Move, t: "Pan & zoom", d: "Drag the canvas to pan, scroll to zoom around the cursor, or use the fit / reset controls — in both modes." },
  { icon: Save, t: "Saved plots", d: "Name and store plots in your browser, then reload them with one click anytime." },
  { icon: Share2, t: "Shareable links", d: "Encode the full state — expressions, params, data, view — into the URL to share or bookmark." },
];

export default function SandboxPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 max-w-2xl">
        <Badge tone="cyan" className="mb-3">Playground</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Visualization <span className="text-gradient">Sandbox</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A data scientist&apos;s graphing playground. Plot functions and distributions, render 2-variable
          heatmaps, fit a curve to your own pasted data, mark roots and intersections, overlay derivatives,
          then save or share the result. Tap a preset below to get started.
        </p>
      </div>

      <FunctionSandbox />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-xl border border-border bg-card-muted/40 p-4">
            <f.icon size={18} className="text-brand-violet" />
            <div className="mt-2 text-sm font-semibold text-foreground">{f.t}</div>
            <p className="mt-1 text-xs text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
