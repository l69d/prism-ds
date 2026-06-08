import * as React from "react";
import { Info, Lightbulb, TriangleAlert, CircleCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "info" | "insight" | "warning" | "success" | "pitfall";

const config: Record<Kind, { icon: React.ElementType; cls: string; label: string }> = {
  info: { icon: Info, cls: "border-info/30 bg-info/8 text-info", label: "Note" },
  insight: { icon: Lightbulb, cls: "border-brand-violet/30 bg-brand-violet/8 text-brand-violet", label: "Intuition" },
  warning: { icon: TriangleAlert, cls: "border-warning/30 bg-warning/8 text-warning", label: "Watch out" },
  success: { icon: CircleCheck, cls: "border-success/30 bg-success/8 text-success", label: "Takeaway" },
  pitfall: { icon: Flame, cls: "border-danger/30 bg-danger/8 text-danger", label: "Common pitfall" },
};

export function Callout({
  kind = "info",
  title,
  children,
  className,
}: {
  kind?: Kind;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls, label } = config[kind];
  return (
    <div className={cn("my-5 flex gap-3 rounded-xl border p-4", cls, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-foreground">
        <div className={cn("mb-1 text-sm font-semibold", cls.split(" ").pop())}>
          {title ?? label}
        </div>
        <div className="prose-tight text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
