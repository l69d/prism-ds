"use client";

import { useState, type ReactNode } from "react";
import { Briefcase, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";

const tones: Record<Difficulty, string> = {
  easy: "bg-success/12 text-success border-success/25",
  medium: "bg-warning/12 text-warning border-warning/25",
  hard: "bg-danger/12 text-danger border-danger/25",
};

export function InterviewProblem({
  question,
  difficulty = "medium",
  tag,
  children,
}: {
  question: string;
  difficulty?: Difficulty;
  tag?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-card-muted/30">
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-violet/12 text-brand-violet">
          <Briefcase size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", tones[difficulty])}>
              {difficulty}
            </span>
            {tag ? <span className="text-[11px] text-muted-foreground">{tag}</span> : null}
          </div>
          <p className="font-medium text-foreground">{question}</p>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-cyan hover:underline"
            aria-expanded={open}
          >
            {open ? "Hide solution" : "Show solution"}
            <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
          </button>
          {open ? (
            <div className="mt-3 border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
