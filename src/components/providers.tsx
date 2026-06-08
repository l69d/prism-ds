"use client";

import { type ReactNode } from "react";
import { DifficultyProvider } from "@/lib/difficulty";
import { ProgressProvider } from "@/lib/progress";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DifficultyProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </DifficultyProvider>
  );
}
