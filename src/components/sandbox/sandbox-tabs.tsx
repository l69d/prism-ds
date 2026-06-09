"use client";

import { useEffect, useState } from "react";
import {
  Move,
  TrendingUp,
  Activity,
  Share2,
  FunctionSquare,
  LayoutGrid,
  Table,
  Crosshair,
  Save,
} from "lucide-react";
import { FunctionSandbox } from "./function-sandbox";
import { ConceptGallery } from "./concept-gallery";
import { cn } from "@/lib/utils";

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

function Tab({
  active,
  onClick,
  icon: Icon,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Move;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon size={15} />
      {children}
      {count != null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-brand-violet/15 text-brand-violet" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function SandboxTabs() {
  const [tab, setTab] = useState<"plotter" | "gallery">("plotter");

  // Deep link: #viz=<slug> opens straight into the gallery.
  useEffect(() => {
    if (window.location.hash.startsWith("#viz=")) setTab("gallery");
  }, []);

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-border bg-card-muted/40 p-1">
        <Tab active={tab === "plotter"} onClick={() => setTab("plotter")} icon={FunctionSquare}>
          Function Plotter
        </Tab>
        <Tab active={tab === "gallery"} onClick={() => setTab("gallery")} icon={LayoutGrid} count={90}>
          Concept Gallery
        </Tab>
      </div>

      {tab === "plotter" ? (
        <>
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
        </>
      ) : (
        <ConceptGallery />
      )}
    </div>
  );
}
