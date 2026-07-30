export type Point2D = {
  x: number
  y: number
}

/**
 * Van der Corput sequence in a given base.
 * Reverses the digits of n written in base b after the radix point.
 */
export function vanDerCorput(n: number, base: number): number {
  let value = 0
  let denominator = 1
  let remaining = n

  while (remaining > 0) {
    denominator *= base
    const digit = remaining % base
    value += digit / denominator
    remaining = Math.floor(remaining / base)
  }

  return value
}

/**
 * Halton sequence in 2D using baseX and baseY (must be coprime).
 */
export function haltonSequence(count: number, baseX = 2, baseY = 3): Point2D[] {
  const points: Point2D[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      x: vanDerCorput(i, baseX),
      y: vanDerCorput(i, baseY),
    })
  }
  return points
}

/**
 * Hammersley set in 2D. First coordinate is n / (count - 1),
 * second is the Van der Corput sequence.
 */
export function hammersleySet(count: number, base = 2): Point2D[] {
  const points: Point2D[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      x: count === 1 ? 0 : i / (count - 1),
      y: vanDerCorput(i, base),
    })
  }
  return points
}

/**
 * Uniform random 2D points in [0, 1)^2.
 */
export function randomSequence(count: number): Point2D[] {
  const points: Point2D[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random(),
      y: Math.random(),
    })
  }
  return points
}

export type GridStats = {
  gridCount: number
  expectedPerCell: number
  maxDeviation: number
  stdDev: number
  emptyCells: number
  cells: number[]
}

/**
 * Measure uniformity of points by binning them into a gridCount x gridCount grid.
 * Returns normalized max deviation and standard deviation from the expected count.
 */
export function gridDiscrepancy(
  points: Point2D[],
  gridCount: number
): GridStats {
  const cells = Array.from({ length: gridCount * gridCount }, () => 0)

  for (const p of points) {
    const gx = Math.min(gridCount - 1, Math.floor(p.x * gridCount))
    const gy = Math.min(gridCount - 1, Math.floor(p.y * gridCount))
    cells[gy * gridCount + gx]++
  }

  const expectedPerCell = points.length / (gridCount * gridCount)
  let maxDeviation = 0
  let sumSquaredError = 0
  let emptyCells = 0

  for (const count of cells) {
    const deviation = Math.abs(count - expectedPerCell)
    maxDeviation = Math.max(maxDeviation, deviation)
    sumSquaredError += (count - expectedPerCell) ** 2
    if (count === 0) emptyCells++
  }

  const stdDev = Math.sqrt(sumSquaredError / cells.length)

  return {
    gridCount,
    expectedPerCell,
    maxDeviation: maxDeviation / points.length,
    stdDev: stdDev / points.length,
    emptyCells,
    cells,
  }
}

/**
 * Estimate the area of a quarter unit circle (π / 4) using the given 2D points.
 */
export function estimateQuarterCircleArea(points: Point2D[]): number {
  let inside = 0
  for (const p of points) {
    if (p.x * p.x + p.y * p.y <= 1) {
      inside++
    }
  }
  return inside / points.length
}

/**
 * Compute absolute error of a π estimate.
 */
export function piEstimateError(estimatedQuarterArea: number): number {
  return Math.abs(estimatedQuarterArea * 4 - Math.PI)
}

export type ConvergenceStats = {
  n: number
  halton: number
  randomMean: number
  randomMin: number
  randomMax: number
  randomStdDev: number
}

/**
 * Run a convergence experiment comparing Halton vs multiple random trials.
 * Returns the Halton error along with the mean/min/max/stdDev of random errors.
 */
export function runConvergenceExperiment(
  maxCount: number,
  step = 100,
  trials = 50
): ConvergenceStats[] {
  const results: ConvergenceStats[] = []

  for (let n = step; n <= maxCount; n += step) {
    const haltonPoints = haltonSequence(n)
    const halton = piEstimateError(estimateQuarterCircleArea(haltonPoints))

    const randomErrors: number[] = []
    for (let t = 0; t < trials; t++) {
      const randomPoints = randomSequence(n)
      randomErrors.push(
        piEstimateError(estimateQuarterCircleArea(randomPoints))
      )
    }

    const randomMean =
      randomErrors.reduce((sum, value) => sum + value, 0) / trials
    const randomMin = Math.min(...randomErrors)
    const randomMax = Math.max(...randomErrors)
    const randomVariance =
      randomErrors.reduce((sum, value) => sum + (value - randomMean) ** 2, 0) /
      trials
    const randomStdDev = Math.sqrt(randomVariance)

    results.push({
      n,
      halton,
      randomMean,
      randomMin,
      randomMax,
      randomStdDev,
    })
  }

  return results
}
