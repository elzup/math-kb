/**
 * Exact reference distributions and the goodness-of-fit machinery used to
 * check a simulated histogram against them.
 *
 * Everything here is deliberately closed-form or a convergent series: the
 * point of the page is that the verification itself does not lean on another
 * simulation.
 */

const LANCZOS_G = 7
const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]

/** Lanczos approximation of ln Γ(x), accurate to ~1e-15 for x > 0. */
export function lnGamma(x: number): number {
  if (x < 0.5) {
    // Reflection keeps the series inside its region of good accuracy.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x)
  }

  const z = x - 1
  let series = LANCZOS_COEFFICIENTS[0]
  for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i++) {
    series += LANCZOS_COEFFICIENTS[i] / (z + i)
  }

  const t = z + LANCZOS_G + 0.5
  return (
    0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(series)
  )
}

const GAMMA_ITERATION_LIMIT = 300
const GAMMA_EPSILON = 1e-16
const TINY = 1e-300

/** Regularized lower incomplete gamma P(a, x) by its power series. */
function gammaSeries(a: number, x: number): number {
  let term = 1 / a
  let sum = term
  let denominator = a

  for (let i = 0; i < GAMMA_ITERATION_LIMIT; i++) {
    denominator += 1
    term *= x / denominator
    sum += term
    if (Math.abs(term) < Math.abs(sum) * GAMMA_EPSILON) break
  }

  return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a))
}

/** Regularized upper incomplete gamma Q(a, x) by the Lentz continued fraction. */
function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a
  let c = 1 / TINY
  let d = 1 / b
  let result = d

  for (let i = 1; i <= GAMMA_ITERATION_LIMIT; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < TINY) d = TINY
    c = b + an / c
    if (Math.abs(c) < TINY) c = TINY
    d = 1 / d
    const delta = d * c
    result *= delta
    if (Math.abs(delta - 1) < GAMMA_EPSILON) break
  }

  return result * Math.exp(-x + a * Math.log(x) - lnGamma(a))
}

/** Regularized lower incomplete gamma P(a, x). */
export function regularizedGammaP(a: number, x: number): number {
  if (x <= 0) return 0
  // The series converges fast below the peak, the fraction above it.
  return x < a + 1 ? gammaSeries(a, x) : 1 - gammaContinuedFraction(a, x)
}

/** Regularized upper incomplete gamma Q(a, x) = 1 - P(a, x). */
export function regularizedGammaQ(a: number, x: number): number {
  if (x <= 0) return 1
  return x < a + 1 ? 1 - gammaSeries(a, x) : gammaContinuedFraction(a, x)
}

/** Standard normal density. */
export function normalPdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
}

/**
 * Standard normal CDF via Φ(z) = ½(1 + sign(z) · P(½, z²/2)), which reuses the
 * incomplete gamma above instead of a low-order erf polynomial.
 */
export function normalCdf(z: number): number {
  const half = 0.5 * regularizedGammaP(0.5, (z * z) / 2)
  return z >= 0 ? 0.5 + half : 0.5 - half
}

/** Upper tail probability of the χ² distribution with `df` degrees of freedom. */
export function chiSquarePValue(statistic: number, df: number): number {
  if (df <= 0) return Number.NaN
  if (statistic <= 0) return 1
  return regularizedGammaQ(df / 2, statistic / 2)
}

/**
 * Probability mass of Binomial(n, 1/2), index k = number of right turns.
 *
 * Up to n = 50 both C(n, k) and 2^n are exact doubles, so the returned values
 * are the exact rationals. Above that the ratio is evaluated in log space and
 * carries the usual ~1e-15 relative error.
 */
export function binomialPmf(n: number): number[] {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('binomialPmf requires a non-negative integer')
  }

  if (n <= 50) {
    const denominator = 2 ** n
    let coefficient = 1
    const pmf: number[] = []
    for (let k = 0; k <= n; k++) {
      pmf.push(coefficient / denominator)
      coefficient = (coefficient * (n - k)) / (k + 1)
    }
    return pmf
  }

  const logDenominator = n * Math.LN2
  return Array.from({ length: n + 1 }, (_, k) =>
    Math.exp(
      lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1) - logDenominator
    )
  )
}

/**
 * The de Moivre-Laplace approximation of Binomial(n, 1/2) with the ½
 * continuity correction, i.e. the normal probability of the interval that the
 * integer k stands for.
 */
export function normalApproxPmf(n: number): number[] {
  const mean = n / 2
  const sd = Math.sqrt(n / 4)
  return Array.from({ length: n + 1 }, (_, k) => {
    const upper = normalCdf((k + 0.5 - mean) / sd)
    const lower = normalCdf((k - 0.5 - mean) / sd)
    return upper - lower
  })
}

export function toCdf(pmf: readonly number[]): number[] {
  const cdf: number[] = []
  let running = 0
  for (const p of pmf) {
    running += p
    cdf.push(running)
  }
  return cdf
}

/** Largest gap between two CDFs sampled on the same support. */
export function maxCdfGap(a: readonly number[], b: readonly number[]): number {
  const cdfA = toCdf(a)
  const cdfB = toCdf(b)
  return cdfA.reduce(
    (worst, value, index) => Math.max(worst, Math.abs(value - cdfB[index])),
    0
  )
}

export type Moments = {
  total: number
  mean: number
  variance: number
}

/** Mean and (population) variance of a histogram over the values 0..m-1. */
export function histogramMoments(counts: readonly number[]): Moments {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return { total: 0, mean: Number.NaN, variance: Number.NaN }

  const mean =
    counts.reduce((sum, count, value) => sum + count * value, 0) / total
  const variance =
    counts.reduce((sum, count, value) => sum + count * (value - mean) ** 2, 0) /
    total

  return { total, mean, variance }
}

export type ChiSquareGroup = {
  /** Inclusive range of original bins merged into this group. */
  from: number
  to: number
  observed: number
  expected: number
}

export type ChiSquareResult = {
  statistic: number
  df: number
  pValue: number
  groups: ChiSquareGroup[]
}

/**
 * Pearson's χ² against a fully specified distribution (no fitted parameters,
 * so df = groups - 1). Bins whose expected count falls under `minExpected` are
 * merged with their neighbour, which is what keeps the χ² approximation of the
 * multinomial log-likelihood honest in the tails.
 */
export function chiSquareTest(
  observed: readonly number[],
  expectedProbs: readonly number[],
  minExpected = 5
): ChiSquareResult {
  if (observed.length !== expectedProbs.length) {
    throw new Error('observed and expectedProbs must have the same length')
  }

  const total = observed.reduce((sum, count) => sum + count, 0)
  const groups: ChiSquareGroup[] = []

  let pending: ChiSquareGroup | null = null
  for (let index = 0; index < observed.length; index++) {
    const base = pending ?? { from: index, to: index, observed: 0, expected: 0 }
    const merged: ChiSquareGroup = {
      from: base.from,
      to: index,
      observed: base.observed + observed[index],
      expected: base.expected + expectedProbs[index] * total,
    }

    if (merged.expected >= minExpected) {
      groups.push(merged)
      pending = null
    } else {
      pending = merged
    }
  }

  if (pending) {
    const last = groups.pop()
    groups.push(
      last
        ? {
            from: last.from,
            to: pending.to,
            observed: last.observed + pending.observed,
            expected: last.expected + pending.expected,
          }
        : pending
    )
  }

  const statistic = groups.reduce(
    (sum, group) =>
      sum + (group.observed - group.expected) ** 2 / group.expected,
    0
  )
  const df = groups.length - 1

  return { statistic, df, pValue: chiSquarePValue(statistic, df), groups }
}
