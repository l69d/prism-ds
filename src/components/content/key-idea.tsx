import * as React from "react";
import { Sparkles } from "lucide-react";

export function KeyIdea({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-brand-violet/30 bg-gradient-to-br from-brand-violet/10 to-brand-cyan/5 p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-violet">
        <Sparkles size={16} /> The big idea
      </div>
      <div className="text-[15px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}
