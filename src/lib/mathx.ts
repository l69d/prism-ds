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

/** Inverse standard-normal CDF (Acklam's algorithm). Returns z with P(Z<=z)=p. */
export function normalInv(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425, phigh = 1 - plow;
  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= phigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/** Beta(a,b) density on a grid, numerically normalized (a,b > 0). */
export function betaPdfGrid(a: number, b: number, n = 120) {
  const xs = linspace(0.0001, 0.9999, n);
  const raw = xs.map((x) => Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)));
  const dx = xs[1] - xs[0];
  const area = raw.reduce((s, v) => s + v * dx, 0) || 1;
  return { xs, ys: raw.map((v) => v / area) };
}

/** Solve a linear system A x = y (Gaussian elimination with partial pivot). */
export function solveLinear(A: number[][], y: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c] || 1e-9;
    for (let j = c; j <= n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row[n]);
}

/** Least-squares polynomial fit; returns coefficients low->high order. */
export function polyfit(xs: number[], ys: number[], degree: number): number[] {
  const cols = degree + 1;
  const X = xs.map((x) => Array.from({ length: cols }, (_, j) => x ** j));
  const XtX = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) => X.reduce((s, row) => s + row[i] * row[j], 0)),
  );
  for (let i = 0; i < cols; i++) XtX[i][i] += 1e-7;
  const Xty = Array.from({ length: cols }, (_, i) => X.reduce((s, row, k) => s + row[i] * ys[k], 0));
  return solveLinear(XtX, Xty);
}

export const polyval = (c: number[], x: number) => c.reduce((s, ci, i) => s + ci * x ** i, 0);

/** Coefficient of determination R^2 between observed ys and predictions. */
export function rSquared(ys: number[], preds: number[]): number {
  const m = mean(ys);
  const ssTot = ys.reduce((s, y) => s + (y - m) ** 2, 0) || 1e-9;
  const ssRes = ys.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
  return 1 - ssRes / ssTot;
}
