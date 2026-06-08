"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const KEY = "prism-progress";

type Ctx = {
  completed: Set<string>;
  toggle: (slug: string) => void;
  isComplete: (slug: string) => boolean;
  count: number;
  ready: boolean;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  const persist = (next: Set<string>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {}
  };

  const toggle = useCallback((slug: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      persist(next);
      return next;
    });
  }, []);

  const isComplete = useCallback((slug: string) => completed.has(slug), [completed]);

  return (
    <ProgressContext.Provider
      value={{ completed, toggle, isComplete, count: completed.size, ready }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
