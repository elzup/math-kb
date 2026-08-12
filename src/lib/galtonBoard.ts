import { type RngState, nextRandom, seedRng } from './rng'

/**
 * A Galton board on a triangular lattice, stepped in discrete time.
 *
 * Level `r` holds `r + 1` cells; a ball at (r, i) drops to (r + 1, i) on a
 * left bounce or (r + 1, i + 1) on a right bounce. Levels 0..rows-1 are peg
 * cells and hold at most one ball each — that exclusion is the only thing
 * that couples the balls to one another. Leaving the last peg row drops the
 * ball into bin `slot`, and bins never push back.
 *
 * A ball rattles on its peg for a random time: on each tick it hops with
 * probability `hopProbability` and otherwise stays. Dwell alone does not touch
 * which bin a ball reaches, only when it gets there — but it lets a fast ball
 * catch up with a slow one, which is what makes two balls meet at all.
 *
 * With one ball on the board at a time the exclusion never fires, every bounce
 * is an independent fair coin, and the landing bin is exactly Binomial(rows,
 * 1/2). Releasing balls faster than they drain makes the middle of the board
 * congested, so a blocked ball is deflected to whichever side is free instead
 * of tossing a fair coin, and the landing distribution is no longer binomial.
 */

export type Ball = {
  id: number
  level: number
  slot: number
}

/**
 * `'sequential'` releases the next ball only once the board is empty.
 * A number is the tick interval between releases; 1 is maximum congestion.
 */
export type Injection = 'sequential' | number

export type GaltonOptions = {
  rows: number
  balls: number
  seed: number
  injection: Injection
  /** Chance that a ball leaves its peg on a given tick. 1 means never dwell. */
  hopProbability?: number
}

export const DEFAULT_HOP_PROBABILITY = 0.5

export type GaltonState = {
  tick: number
  balls: readonly Ball[]
  bins: readonly number[]
  released: number
  landed: number
  /** Total number of ball-ticks lost to both target cells being occupied. */
  blockedSteps: number
  rng: RngState
  done: boolean
}

/** Index of a cell in the flattened triangular lattice. */
export function cellIndex(level: number, slot: number): number {
  return (level * (level + 1)) / 2 + slot
}

export function initialGaltonState(options: GaltonOptions): GaltonState {
  if (options.rows < 1 || !Number.isInteger(options.rows)) {
    throw new Error('rows must be a positive integer')
  }

  return {
    tick: 0,
    balls: [],
    bins: Array.from({ length: options.rows + 1 }, () => 0),
    released: 0,
    landed: 0,
    blockedSteps: 0,
    rng: seedRng(options.seed),
    done: options.balls === 0,
  }
}

function shouldRelease(
  state: GaltonState,
  options: GaltonOptions,
  ballsInFlight: readonly Ball[]
): boolean {
  if (state.released >= options.balls) return false
  // Level 0 has a single cell, so anything sitting there blocks the entrance.
  if (ballsInFlight.some((ball) => ball.level === 0)) return false
  if (options.injection === 'sequential') return ballsInFlight.length === 0
  return state.tick % Math.max(1, options.injection) === 0
}

/**
 * Bottom-up order, so a cell freed this tick is available to the ball above
 * it — the usual update order for an exclusion process. Balls sharing a level
 * are shuffled, because a fixed left-to-right order would hand the left ball a
 * standing right of way and bias the result on its own.
 */
function resolutionOrder(
  balls: readonly Ball[],
  rng: RngState
): { ordered: Ball[]; rng: RngState } {
  const sorted = [...balls].sort((a, b) => b.level - a.level || a.slot - b.slot)
  const ordered: Ball[] = []
  let state = rng
  let start = 0

  while (start < sorted.length) {
    let end = start
    while (end < sorted.length && sorted[end].level === sorted[start].level) {
      end++
    }

    const group = sorted.slice(start, end)
    for (let i = group.length - 1; i > 0; i--) {
      const draw = nextRandom(state)
      state = draw.state
      const j = Math.floor(draw.value * (i + 1))
      const swapped = group[i]
      group[i] = group[j]
      group[j] = swapped
    }

    ordered.push(...group)
    start = end
  }

  return { ordered, rng: state }
}

/** One tick of the board. */
export function stepGaltonBoard(
  state: GaltonState,
  options: GaltonOptions
): GaltonState {
  if (state.done) return state

  const { rows } = options
  const hopProbability = options.hopProbability ?? DEFAULT_HOP_PROBABILITY
  const occupied = new Set(
    state.balls.map((ball) => cellIndex(ball.level, ball.slot))
  )

  const start = resolutionOrder(state.balls, state.rng)
  const ordered = start.ordered

  const bins = [...state.bins]
  const moved: Ball[] = []
  let rng = start.rng
  let blockedSteps = state.blockedSteps
  let landed = state.landed

  for (const ball of ordered) {
    const dwell = nextRandom(rng)
    rng = dwell.state
    if (dwell.value >= hopProbability) {
      moved.push(ball)
      continue
    }

    const draw = nextRandom(rng)
    rng = draw.state

    const goesRight = draw.value < 0.5
    const preferred = ball.slot + (goesRight ? 1 : 0)
    const alternate = ball.slot + (goesRight ? 0 : 1)
    const target = ball.level + 1

    if (target === rows) {
      occupied.delete(cellIndex(ball.level, ball.slot))
      bins[preferred] += 1
      landed += 1
      continue
    }

    const isFree = (slot: number) => !occupied.has(cellIndex(target, slot))
    const slot = isFree(preferred)
      ? preferred
      : isFree(alternate)
        ? alternate
        : null

    if (slot === null) {
      blockedSteps += 1
      moved.push(ball)
      continue
    }

    occupied.delete(cellIndex(ball.level, ball.slot))
    occupied.add(cellIndex(target, slot))
    moved.push({ id: ball.id, level: target, slot })
  }

  const releasing = shouldRelease(state, options, moved)
  const balls = releasing
    ? [...moved, { id: state.released, level: 0, slot: 0 }]
    : moved
  const released = state.released + (releasing ? 1 : 0)

  return {
    tick: state.tick + 1,
    balls,
    bins,
    released,
    landed,
    blockedSteps,
    rng,
    done: released >= options.balls && balls.length === 0,
  }
}

/** Generous upper bound on the ticks a run can need, used as a runaway guard. */
export function tickBudget(options: GaltonOptions): number {
  const hop = Math.max(options.hopProbability ?? DEFAULT_HOP_PROBABILITY, 0.05)
  const interval =
    options.injection === 'sequential'
      ? options.rows + 1
      : Math.max(1, options.injection)
  return Math.ceil(
    (options.balls * interval * 3) / hop + options.rows * options.rows + 512
  )
}

export type GaltonRun = {
  bins: number[]
  ticks: number
  blockedSteps: number
  /** False only if the tick guard ran out, which the invariants forbid. */
  completed: boolean
}

export function runGaltonBoard(options: GaltonOptions): GaltonRun {
  const budget = tickBudget(options)
  let state = initialGaltonState(options)

  while (!state.done && state.tick < budget) {
    state = stepGaltonBoard(state, options)
  }

  return {
    bins: [...state.bins],
    ticks: state.tick,
    blockedSteps: state.blockedSteps,
    completed: state.done,
  }
}

/**
 * Every state of a run, for tests that need to check an invariant on each
 * tick. Only use it with small ball counts.
 */
export function galtonStates(options: GaltonOptions): GaltonState[] {
  const budget = tickBudget(options)
  const states = [initialGaltonState(options)]

  while (!states[states.length - 1].done && states.length <= budget) {
    states.push(stepGaltonBoard(states[states.length - 1], options))
  }

  return states
}
