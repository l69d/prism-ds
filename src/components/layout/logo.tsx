import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <defs>
            <linearGradient id="prism-logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--brand-violet)" />
              <stop offset="100%" stopColor="var(--brand-cyan)" />
            </linearGradient>
          </defs>
          <path d="M16 3 L29 26 L3 26 Z" fill="url(#prism-logo)" opacity="0.92" />
          <path d="M16 3 L16 26 L3 26 Z" fill="var(--brand-violet)" opacity="0.35" />
          <path d="M29 26 L24 14 L31 18 Z" fill="var(--brand-cyan)" opacity="0.55" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Prism
      </span>
    </Link>
  );
}
