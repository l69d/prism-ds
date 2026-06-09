"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, BookOpen, Sparkles, Loader2, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { galleryEntries } from "./gallery-registry";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "border-brand-violet/40 bg-brand-violet/12 text-brand-violet"
          : "border-border bg-card-muted/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ConceptGallery() {
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string>("All");
  const [selected, setSelected] = useState<string | null>(null);

  // Module list in curriculum order.
  const modules = useMemo(() => {
    const seen: string[] = [];
    for (const e of galleryEntries) if (!seen.includes(e.module)) seen.push(e.module);
    return seen;
  }, []);

  // Deep-link: open a concept from the URL hash on mount.
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.replace(/^#viz=/, ""));
    if (h && galleryEntries.some((e) => e.slug === h)) setSelected(h);
  }, []);

  const open = (slug: string) => {
    setSelected(slug);
    if (typeof window !== "undefined") {
      window.location.hash = `viz=${slug}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const close = () => {
    setSelected(null);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return galleryEntries.filter((e) => {
      if (activeModule !== "All" && e.module !== activeModule) return false;
      if (!q) return true;
      return (e.title + " " + e.blurb + " " + e.module + " " + e.hint)
        .toLowerCase()
        .includes(q);
    });
  }, [query, activeModule]);

  const current = selected
    ? galleryEntries.find((e) => e.slug === selected) ?? null
    : null;

  if (current) {
    const C = current.Comp;
    return (
      <div className="my-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-brand-violet/40 hover:bg-card"
          >
            <ArrowLeft size={14} /> All concepts
          </button>
          <Badge tone={current.tone}>{current.module}</Badge>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {current.title}
          </h2>
          <Link
            href={`/learn/${current.slug}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-brand-violet hover:underline"
          >
            <BookOpen size={14} /> Read the lesson
          </Link>
        </div>
        <p className="mb-1 text-sm text-muted-foreground">{current.blurb}</p>
        <Suspense
          fallback={
            <div className="my-6 flex h-72 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading visualizer…
            </div>
          }
        >
          <C />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="my-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 90 interactive concepts…"
            className="w-full rounded-xl border border-border bg-card-muted/40 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-violet/50"
          />
        </div>
        <button
          onClick={() => {
            const pool = filtered.length ? filtered : galleryEntries;
            open(pool[Math.floor(Math.random() * pool.length)].slug);
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-brand-violet/40 hover:bg-card"
        >
          <Shuffle size={14} /> Surprise me
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Pill active={activeModule === "All"} onClick={() => setActiveModule("All")}>
          All · {galleryEntries.length}
        </Pill>
        {modules.map((m) => (
          <Pill key={m} active={activeModule === m} onClick={() => setActiveModule(m)}>
            {m}
          </Pill>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <button
            key={e.slug}
            onClick={() => open(e.slug)}
            className="group flex flex-col rounded-xl border border-border bg-card-muted/40 p-4 text-left transition-all hover:border-brand-violet/40 hover:bg-card hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge tone={e.tone}>{e.module}</Badge>
              <Sparkles
                size={14}
                className="text-brand-violet opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground">{e.title}</div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {e.hint || e.blurb}
            </p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card-muted/30 p-10 text-center text-sm text-muted-foreground">
          No concepts match “{query}”.
        </div>
      )}
    </div>
  );
}
