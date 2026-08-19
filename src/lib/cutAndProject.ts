import type { Point } from './point'

/**
 * A strip laid along the line y = slope * x through the origin. Lattice points
 * inside the strip are kept ("cut") and dropped onto the line ("project").
 */
export type Strip = {
  /** Slope of the line. Irrational values make the projection quasiperiodic. */
  slope: number
  /** Width of the strip, measured perpendicular to the line. */
  width: number
  /** Perpendicular shift of the strip away from the line. */
  offset: number
}

export type StripPoint = {
  lattice: Point
  /** Where the point lands on the line, measured from the origin. */
  parallel: number
  /** Signed distance from the line, i.e. where it sits inside the window. */
  perpendicular: number
}

/** `L` and `S` are the two canonical gaps; `X` is anything a wider strip adds. */
export type TileLabel = 'L' | 'S' | 'X'

export type Tile = {
  /** Lattice step taken from the previous accepted point. */
  step: Point
  length: number
  label: TileLabel
}

const LENGTH_TOLERANCE = 1e-9

export function lineNorm(slope: number): number {
  return Math.hypot(1, slope)
}

/**
 * The width that lets exactly one lattice point per unit cell through: the
 * unit square's shadow on the normal direction. Narrower strips leave gaps in
 * the projected sequence, wider ones let a second point squeeze in.
 */
export function canonicalWidth(slope: number): number {
  return (1 + Math.abs(slope)) / lineNorm(slope)
}

/** Coordinate along the line (the physical space of the projection). */
export function parallelOf(point: Point, slope: number): number {
  return (point.x + slope * point.y) / lineNorm(slope)
}

/** Signed distance from the line (the internal space of the projection). */
export function perpendicularOf(point: Point, slope: number): number {
  return (point.y - slope * point.x) / lineNorm(slope)
}

/**
 * Lattice points with 0 <= x <= columns that fall inside the strip, ordered by
 * where they land on the line. The window is half-open so that a rational
 * slope, whose lattice points can sit exactly on an edge, still yields one
 * well-defined sequence.
 */
export function stripPoints(strip: Strip, columns: number): StripPoint[] {
  const norm = lineNorm(strip.slope)
  const low = strip.offset - strip.width / 2
  const high = strip.offset + strip.width / 2
  const points: StripPoint[] = []

  for (let x = 0; x <= columns; x++) {
    const center = strip.slope * x
    const firstY = Math.ceil(center + low * norm)
    const lastY = Math.ceil(center + high * norm) - 1

    for (let y = firstY; y <= lastY; y++) {
      points.push({
        lattice: { x, y },
        parallel: (x + strip.slope * y) / norm,
        perpendicular: (y - strip.slope * x) / norm,
      })
    }
  }

  return points.sort((a, b) => a.parallel - b.parallel)
}

/**
 * Gaps between neighbouring projected points. A step of (1, 0) and a step of
 * (0, 1) are the only ones a canonical strip produces, so each gap is one of
 * two lengths; the longer is called L and the shorter S.
 */
export function tilesOf(points: readonly StripPoint[], slope: number): Tile[] {
  const norm = lineNorm(slope)
  const horizontalIsLong = 1 / norm >= Math.abs(slope) / norm

  return points.slice(1).map((point, index) => {
    const previous = points[index]
    const step = {
      x: point.lattice.x - previous.lattice.x,
      y: point.lattice.y - previous.lattice.y,
    }
    const isHorizontal = step.x === 1 && step.y === 0
    const isVertical = step.x === 0 && step.y === 1
    const label: TileLabel = isHorizontal
      ? horizontalIsLong
        ? 'L'
        : 'S'
      : isVertical
        ? horizontalIsLong
          ? 'S'
          : 'L'
        : 'X'

    return { step, length: point.parallel - previous.parallel, label }
  })
}

export function wordOf(tiles: readonly Tile[]): string {
  return tiles.map((tile) => tile.label).join('')
}

/** Distinct gap lengths, ascending. Two of them means the strip is canonical. */
export function distinctLengths(tiles: readonly Tile[]): number[] {
  return tiles
    .map((tile) => tile.length)
    .sort((a, b) => a - b)
    .filter(
      (length, index, sorted) =>
        index === 0 || length - sorted[index - 1] > LENGTH_TOLERANCE
    )
}

export type TileStats = {
  total: number
  long: number
  short: number
  other: number
  /** Count of L divided by count of S, or null while S has not appeared. */
  ratio: number | null
}

export function tileStats(tiles: readonly Tile[]): TileStats {
  const long = tiles.filter((tile) => tile.label === 'L').length
  const short = tiles.filter((tile) => tile.label === 'S').length

  return {
    total: tiles.length,
    long,
    short,
    other: tiles.length - long - short,
    ratio: short === 0 ? null : long / short,
  }
}

/**
 * The ratio the L and S counts settle on: with slope a < 1 the horizontal
 * steps are the long ones and appear 1 / a times as often.
 */
export function expectedRatio(slope: number): number {
  const magnitude = Math.abs(slope)
  return magnitude <= 1 ? 1 / magnitude : magnitude
}

/**
 * Smallest p with word[i] = word[i - p] everywhere, or null when no period
 * repeats at least three times — enough repetition to be worth reporting.
 */
export function smallestPeriod(word: string): number | null {
  const maxPeriod = Math.floor(word.length / 3)

  for (let period = 1; period <= maxPeriod; period++) {
    let repeats = true
    for (let i = period; i < word.length; i++) {
      if (word[i] !== word[i - period]) {
        repeats = false
        break
      }
    }
    if (repeats) return period
  }

  return null
}

/** The Fibonacci word, grown by the substitution L -> LS, S -> L. */
export function fibonacciWord(minLength: number): string {
  let word = 'L'
  while (word.length < minLength) {
    word = word.replace(/[LS]/g, (letter) => (letter === 'L' ? 'LS' : 'L'))
  }
  return word.slice(0, minLength)
}

/**
 * Where `word` first appears inside the Fibonacci word, or -1 when it never
 * does. Two strips over the same golden slope give different sequences, but
 * every finite piece of one appears in the other.
 */
export function fibonacciFactorIndex(word: string): number {
  return fibonacciWord(Math.max(word.length * 4, 64)).indexOf(word)
}

export type Rotation = {
  /** How far the internal coordinate slides at every step. */
  shift: number
  /** Length of the window it wraps around. */
  circumference: number
  /** shift / circumference, i.e. slope / (1 + slope). */
  number: number
}

/**
 * Walking one step along the projected sequence subtracts a fixed amount from
 * the internal coordinate, wrapping inside the window. The sequence is thus an
 * irrational rotation, which is why it never repeats yet stays uniform.
 */
export function rotationOf(slope: number): Rotation {
  const magnitude = Math.abs(slope)
  const shift = magnitude / lineNorm(slope)
  const circumference = canonicalWidth(slope)

  return { shift, circumference, number: shift / circumference }
}

export type WindowPartition = {
  low: number
  high: number
  /**
   * Where the window splits: a point below this must climb (a vertical step),
   * one above it moves right. The two parts are what fix the letter
   * frequencies, and the lower part is exactly as long as the rotation shift.
   */
  boundary: number
}

export function windowPartition(strip: Strip): WindowPartition {
  const low = strip.offset - strip.width / 2

  return {
    low,
    high: strip.offset + strip.width / 2,
    boundary: low + rotationOf(strip.slope).shift,
  }
}
