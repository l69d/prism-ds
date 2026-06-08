import type { Metadata } from "next";
import { FunctionSandbox } from "@/components/sandbox/function-sandbox";
import { Badge } from "@/components/ui/badge";
import { Move, Search, TrendingUp, Activity, Share2, FunctionSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "A visualization sandbox for data scientists — plot functions and distributions, pan/zoom, fit curves to noisy data, overlay derivatives, and share your plot.",
};

const features = [
  { icon: FunctionSquare, t: "Multi-expression plotting", d: "Type any formula in x with live parameters a–d and a stats function library (normal, sigmoid, relu, gelu…)." },
  { icon: Move, t: "Pan & zoom", d: "Drag the canvas to pan, scroll to zoom around the cursor, or use the fit / reset controls." },
  { icon: TrendingUp, t: "Curve fitting", d: "Scatter noisy samples and fit a least-squares polynomial — watch R² and overfitting as you raise the degree." },
  { icon: Activity, t: "Derivatives", d: "Toggle a numerical derivative overlay on any expression to see its slope everywhere." },
  { icon: Search, t: "Hover readout", d: "Move over the plot to read off the value of every curve at that x." },
  { icon: Share2, t: "Shareable links", d: "Encode your expressions, parameters, and view into the URL with one click." },
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
          A data scientist&apos;s graphing playground. Plot functions and distributions, tweak live
          parameters, pan and zoom, fit curves to noisy data, overlay derivatives, and share the result.
          Tap a preset below to get started.
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
