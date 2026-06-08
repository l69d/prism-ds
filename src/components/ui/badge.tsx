import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "cyan" | "muted" | "success" | "warning" | "pink" | "indigo";

const tones: Record<Tone, string> = {
  violet: "bg-brand-violet/12 text-brand-violet border-brand-violet/25",
  indigo: "bg-brand-indigo/12 text-brand-indigo border-brand-indigo/25",
  cyan: "bg-brand-cyan/12 text-brand-cyan border-brand-cyan/25",
  pink: "bg-brand-pink/12 text-brand-pink border-brand-pink/25",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function Badge({
  tone = "muted",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
