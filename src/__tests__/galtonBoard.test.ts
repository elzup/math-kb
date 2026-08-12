import {
  binomialPmf,
  chiSquareTest,
  histogramMoments,
} from '@/lib/distribution'
import {
  type GaltonOptions,
  cellIndex,
  galtonStates,
  initialGaltonState,
  runGaltonBoard,
} from '@/lib/galtonBoard'

const ROWS = 12
const BALLS = 5000
const PMF = binomialPmf(ROWS)

const sequential = (seed: number, over: Partial<GaltonOptions> = {}) =>
  runGaltonBoard({
    rows: ROWS,
    balls: BALLS,
    seed,
    injection: 'sequential',
    ...over,
  })

const crowded = (seed: number, over: Partial<GaltonOptions> = {}) =>
  runGaltonBoard({ rows: ROWS, balls: BALLS, seed, injection: 1, ...over })

describe('board bookkeeping', () => {
  it('needs at least one peg row', () => {
    expect(() =>
      initialGaltonState({ rows: 0, balls: 1, seed: 1, injection: 1 })
    ).toThrow('rows must be a positive integer')
  })

  it('finishes inside the tick budget and keeps every ball', () => {
    for (const run of [sequential(1), crowded(1)]) {
      expect(run.completed).toBe(true)
      expect(run.bins).toHaveLength(ROWS + 1)
      expect(run.bins.reduce((sum, count) => sum + count, 0)).toBe(BALLS)
    }
  })

  it('conserves balls on every tick', () => {
    const options: GaltonOptions = { rows: 8, balls: 60, seed: 3, injection: 1 }
    for (const state of galtonStates(options)) {
      const landed = state.bins.reduce((sum, count) => sum + count, 0)
      expect(landed).toBe(state.landed)
      expect(landed + state.balls.length).toBe(state.released)
      expect(state.released).toBeLessThanOrEqual(options.balls)
    }
  })

  it('is reproducible from the seed alone', () => {
    expect(crowded(11).bins).toEqual(crowded(11).bins)
    expect(crowded(11).bins).not.toEqual(crowded(12).bins)
  })
})

describe('exclusion', () => {
  it('never puts two balls in one cell', () => {
    const states = galtonStates({
      rows: 8,
      balls: 120,
      seed: 5,
      injection: 1,
    })

    for (const state of states) {
      const cells = state.balls.map((ball) => cellIndex(ball.level, ball.slot))
      expect(new Set(cells).size).toBe(cells.length)
      for (const ball of state.balls) {
        expect(ball.slot).toBeGreaterThanOrEqual(0)
        expect(ball.slot).toBeLessThanOrEqual(ball.level)
      }
    }
  })

  it('keeps a single ball on the board in sequential mode', () => {
    const states = galtonStates({
      rows: 8,
      balls: 20,
      seed: 5,
      injection: 'sequential',
    })
    for (const state of states) {
      expect(state.balls.length).toBeLessThanOrEqual(1)
    }
    expect(states[states.length - 1].blockedSteps).toBe(0)
  })

  /**
   * Without dwell every ball drops exactly one level per tick, so a level can
   * never hold two of them and the exclusion rule is unreachable. Dwell is
   * what lets a ball catch up with the one below it.
   */
  it('cannot fire at all when no ball ever dwells', () => {
    const run = crowded(5, { hopProbability: 1 })
    expect(run.blockedSteps).toBe(0)
    expect(chiSquareTest(run.bins, PMF).pValue).toBeGreaterThan(0.01)
  })
})

describe('one ball at a time', () => {
  it('lands exactly on Binomial(rows, 1/2)', () => {
    for (const seed of [1, 2, 3]) {
      const run = sequential(seed)
      expect(chiSquareTest(run.bins, PMF).pValue).toBeGreaterThan(0.01)
    }
  })

  it('has the binomial mean and variance', () => {
    const { mean, variance } = histogramMoments(sequential(4).bins)
    expect(mean).toBeCloseTo(ROWS / 2, 1)
    expect(variance).toBeCloseTo(ROWS / 4, 1)
  })

  it('reduces to a fair coin with a single peg row', () => {
    const run = runGaltonBoard({
      rows: 1,
      balls: 4000,
      seed: 9,
      injection: 'sequential',
    })
    expect(chiSquareTest(run.bins, binomialPmf(1)).pValue).toBeGreaterThan(0.01)
  })
})

describe('balls that interfere', () => {
  it('is rejected against the binomial at any usable significance', () => {
    for (const seed of [1, 2, 3]) {
      expect(chiSquareTest(crowded(seed).bins, PMF).pValue).toBeLessThan(1e-6)
    }
  })

  it('spreads wider than the binomial instead of narrower', () => {
    const { variance } = histogramMoments(crowded(4).bins)
    expect(variance).toBeGreaterThan((ROWS / 4) * 1.15)
  })

  it('stays symmetric, so the deflection has no side of its own', () => {
    const { mean } = histogramMoments(crowded(4).bins)
    expect(mean).toBeCloseTo(ROWS / 2, 1)
  })

  it('blocks balls, which the sequential run never does', () => {
    expect(crowded(4).blockedSteps).toBeGreaterThan(0)
    expect(sequential(4).blockedSteps).toBe(0)
  })

  it('deviates further the shorter the release interval', () => {
    const variances = [8, 4, 2, 1].map(
      (injection) =>
        histogramMoments(
          runGaltonBoard({
            rows: ROWS,
            balls: BALLS,
            seed: 6,
            injection,
          }).bins
        ).variance
    )

    for (let i = 1; i < variances.length; i++) {
      expect(variances[i]).toBeGreaterThan(variances[i - 1])
    }
    expect(variances[0]).toBeGreaterThan(ROWS / 4)
  })
})
