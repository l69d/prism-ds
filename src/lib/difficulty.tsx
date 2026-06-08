"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Level = "basic" | "advanced";
const KEY = "prism-difficulty";

type Ctx = {
  level: Level;
  setLevel: (l: Level) => void;
  toggle: () => void;
  ready: boolean;
};

const DifficultyContext = createContext<Ctx | null>(null);

export function DifficultyProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<Level>("basic");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Level | null;
      if (saved === "basic" || saved === "advanced") setLevelState(saved);
    } catch {}
    setReady(true);
  }, []);

  const setLevel = (l: Level) => {
    setLevelState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  };

  const toggle = () => setLevel(level === "basic" ? "advanced" : "basic");

  return (
    <DifficultyContext.Provider value={{ level, setLevel, toggle, ready }}>
      {children}
    </DifficultyContext.Provider>
  );
}

export function useDifficulty() {
  const ctx = useContext(DifficultyContext);
  if (!ctx) throw new Error("useDifficulty must be used within DifficultyProvider");
  return ctx;
}
