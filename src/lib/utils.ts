import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Linear map of x from [a,b] -> [c,d]. */
export function mapRange(x: number, a: number, b: number, c: number, d: number) {
  if (b === a) return c;
  return c + ((x - a) * (d - c)) / (b - a);
}

export const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));

export function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
