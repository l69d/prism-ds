import type { Metadata } from "next";
import { FunctionSandbox } from "@/components/sandbox/function-sandbox";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "A visualization sandbox for data scientists — plot functions and distributions, tweak parameters live, and scatter noisy data to feel curve-fitting.",
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
          A data scientist&apos;s graphing playground. Type expressions in <span className="font-mono text-sm">x</span> with
          live parameters <span className="font-mono text-sm">a b c d</span>, drop in stats functions like{" "}
          <span className="font-mono text-sm">normal(x, 0, c)</span> or <span className="font-mono text-sm">sigmoid(a*x)</span>,
          and scatter noisy samples to get a feel for fitting. Hover the plot to read off values.
        </p>
      </div>

      <FunctionSandbox />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Distributions", e: "normal(x, d, c)" },
          { t: "Activations", e: "sigmoid(a*x) , relu(x) , gelu(x)" },
          { t: "Signal + noise", e: "a*sin(b*x) + d  (toggle scatter)" },
          { t: "Decay", e: "a*exp(-b*x)" },
          { t: "Logistic growth", e: "a / (1 + exp(-b*(x-d)))" },
          { t: "Polynomial", e: "a*x^3 + b*x^2 + c*x + d" },
        ].map((ex) => (
          <div key={ex.t} className="rounded-xl border border-border bg-card-muted/40 p-3">
            <div className="text-xs font-semibold text-foreground">{ex.t}</div>
            <code className="mt-1 block font-mono text-xs text-brand-cyan">{ex.e}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
