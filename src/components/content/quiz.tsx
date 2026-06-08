"use client";

import { useState } from "react";
import { Check, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { text: string; correct?: boolean; why?: string };

export function Quiz({
  question,
  options,
}: {
  question: string;
  options: Option[];
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="my-6 rounded-2xl border border-border bg-card-muted/40 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <HelpCircle size={16} className="text-brand-cyan" /> Quick check
      </div>
      <p className="mb-4 text-[15px] font-medium text-foreground">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => {
          const isPicked = picked === i;
          const reveal = answered && (isPicked || o.correct);
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                !answered && "border-border hover:border-brand-violet/50 hover:bg-muted",
                reveal && o.correct && "border-success/50 bg-success/10",
                answered && isPicked && !o.correct && "border-danger/50 bg-danger/10",
                answered && !isPicked && !o.correct && "border-border opacity-60",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {reveal && o.correct ? (
                  <Check size={16} className="text-success" />
                ) : answered && isPicked && !o.correct ? (
                  <X size={16} className="text-danger" />
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full border border-muted-foreground/40" />
                )}
              </span>
              <span>
                <span className="text-foreground">{o.text}</span>
                {reveal && o.why ? (
                  <span className="mt-1 block text-xs text-muted-foreground">{o.why}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <button
          onClick={() => setPicked(null)}
          className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
