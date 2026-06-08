"use client";

import { type ReactNode } from "react";
import { useDifficulty } from "@/lib/difficulty";

/** Shown only in Basic mode. */
export function Basic({ children }: { children: ReactNode }) {
  const { level } = useDifficulty();
  return level === "basic" ? <>{children}</> : null;
}

/** Shown only in Advanced mode. */
export function Advanced({ children }: { children: ReactNode }) {
  const { level } = useDifficulty();
  return level === "advanced" ? <>{children}</> : null;
}

/** Inline depth marker — extra rigor that appears only in Advanced. */
export function MoreDepth({ children }: { children: ReactNode }) {
  const { level } = useDifficulty();
  if (level !== "advanced") return null;
  return (
    <div className="my-5 rounded-xl border border-dashed border-brand-cyan/40 bg-brand-cyan/5 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-cyan">
        Going deeper
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
