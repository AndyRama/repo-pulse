const MS_PER_DAY = 86_400_000;

/** Difference between two dates in fractional days (b - a). */
export function daysBetween(a: Date | string, b: Date | string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY;
}

/**
 * Percentile using linear interpolation between closest ranks.
 * `p` is in [0, 100]. Returns null for an empty input.
 */
export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new RangeError(`percentile must be between 0 and 100, got ${p}`);
  }
  const sorted = [...values].sort((x, y) => x - y);
  if (sorted.length === 1) return sorted[0] as number;
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lo = sorted[lower] as number;
  const hi = sorted[upper] as number;
  return lo + (hi - lo) * (rank - lower);
}

export function median(values: readonly number[]): number | null {
  return percentile(values, 50);
}

/** n / d, or null when the denominator is zero. */
export function ratio(n: number, d: number): number | null {
  return d === 0 ? null : n / d;
}

/**
 * Maps `value` onto 0..1, where `best` gives 1 and `worst` gives 0
 * (linear in between, clamped). Works whether best < worst or best > worst.
 */
export function scale(value: number, best: number, worst: number): number {
  if (best === worst) return value === best ? 1 : 0;
  const t = (value - worst) / (best - worst);
  return Math.min(1, Math.max(0, t));
}

export function round(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
