"use client";

import * as React from "react";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";

export function VizFrame({
  title,
  hint,
  children,
  controls,
  className,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("my-6 overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {(title || hint) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          {title ? <span className="text-sm font-semibold text-foreground">{title}</span> : <span />}
          {hint ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hand size={12} /> {hint}
            </span>
          ) : null}
        </div>
      )}
      <div className="p-4">{children}</div>
      {controls ? (
        <div className="border-t border-border/60 bg-card-muted/30 p-4">{controls}</div>
      ) : null}
    </div>
  );
}
