/* Small math/stats helpers for the interactive visualizations. */

/** Deterministic PRNG (mulberry32) so SSR and client agree until interaction. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box-Muller, driven by a uniform generator. */
export function gaussian(rand: () => number, mean = 0, sd = 1) {
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function linspace(a: number, b: number, n: number) {
  if (n <= 1) return [a];
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + i * step);
}

export function normalPdf(x: number, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function normalCdf(x: number, mu = 0, sigma = 1) {
  // Abramowitz-Stegun erf approximation
  const z = (x - mu) / (sigma * Math.SQRT2);
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return 0.5 * (1 + Math.sign(z) * y);
}

function logFactorial(n: number) {
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log(i);
  return s;
}

export function binomialPmf(k: number, n: number, p: number) {
  if (k < 0 || k > n) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  const logC = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

export function poissonPmf(k: number, lambda: number) {
  if (k < 0) return 0;
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k));
}

export function exponentialPdf(x: number, lambda: number) {
  return x < 0 ? 0 : lambda * Math.exp(-lambda * x);
}

export const mean = (xs: number[]) =>
  xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

export function std(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

export function pearson(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export function histogram(data: number[], bins: number, lo?: number, hi?: number) {
  const min = lo ?? Math.min(...data);
  const max = hi ?? Math.max(...data);
  const width = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const x of data) {
    let b = Math.floor((x - min) / width);
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    counts[b]++;
  }
  return { counts, min, max, width };
}
