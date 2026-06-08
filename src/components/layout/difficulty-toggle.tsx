"use client";

import { Sprout, Rocket } from "lucide-react";
import { useDifficulty, type Level } from "@/lib/difficulty";
import { cn } from "@/lib/utils";

const opts: { level: Level; label: string; icon: typeof Sprout }[] = [
  { level: "basic", label: "Basic", icon: Sprout },
  { level: "advanced", label: "Advanced", icon: Rocket },
];

export function DifficultyToggle({ className }: { className?: string }) {
  const { level, setLevel } = useDifficulty();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border bg-card p-0.5",
        className,
      )}
      role="group"
      aria-label="Difficulty level"
    >
      {opts.map(({ level: l, label, icon: Icon }) => (
        <button
          key={l}
          onClick={() => setLevel(l)}
          aria-pressed={level === l}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all",
            level === l
              ? l === "basic"
                ? "bg-brand-cyan/15 text-brand-cyan"
                : "bg-brand-violet/15 text-brand-violet"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
