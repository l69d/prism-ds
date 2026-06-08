import {
  Compass, Sigma, Dices, Database, BarChart3, Brain, Network,
  MessageSquare, LineChart, GitFork, Server, Trophy, type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const map: Record<string, ComponentType<LucideProps>> = {
  Compass, Sigma, Dices, Database, BarChart3, Brain, Network,
  MessageSquare, LineChart, GitFork, Server, Trophy,
};

export function ModuleIcon({ name, ...props }: { name: string } & LucideProps) {
  const I = map[name] ?? Compass;
  return <I {...props} />;
}
