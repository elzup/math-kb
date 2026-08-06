import type { Point } from './point'

/**
 * A replacement polyline in the local frame of one segment: it runs from (0, 0)
 * to (1, 0), and any y offset bulges to one side of the segment.
 */
export type Template = readonly Point[]

/**
 * Whether every segment gets the template the same way round, or every other
 * segment gets it mirrored. This single flag is the difference between the
 * Heighway dragon (alternating) and the Levy C curve (fixed).
 */
export type Orientation = 'fixed' | 'alternating'

/** Two sides of a right angle: the generator shared by dragon and Levy C. */
export const RIGHT_ANGLE_TEMPLATE: Template = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0.5 },
  { x: 1, y: 0 },
]

/** The Koch bump: the middle third replaced by two sides of a triangle. */
export const KOCH_TEMPLATE: Template = [
  { x: 0, y: 0 },
  { x: 1 / 3, y: 0 },
  { x: 0.5, y: Math.sqrt(3) / 6 },
  { x: 2 / 3, y: 0 },
  { x: 1, y: 0 },
]

/** Eight quarter-length steps: the Minkowski sausage. */
export const MINKOWSKI_TEMPLATE: Template = [
  { x: 0, y: 0 },
  { x: 0.25, y: 0 },
  { x: 0.25, y: 0.25 },
  { x: 0.5, y: 0.25 },
  { x: 0.5, y: 0 },
  { x: 0.5, y: -0.25 },
  { x: 0.75, y: -0.25 },
  { x: 0.75, y: 0 },
  { x: 1, y: 0 },
]

/** A shallower two-step bump; the Cesaro family between flat and right-angled. */
export const SHALLOW_BUMP_TEMPLATE: Template = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0.25 },
  { x: 1, y: 0 },
]

export const TEMPLATE_PRESETS: {
  id: string
  label: string
  template: Template
}[] = [
  { id: 'right-angle', label: '直角', template: RIGHT_ANGLE_TEMPLATE },
  { id: 'koch', label: 'コッホ', template: KOCH_TEMPLATE },
  { id: 'minkowski', label: 'ミンコフスキー', template: MINKOWSKI_TEMPLATE },
  { id: 'shallow', label: '浅い山', template: SHALLOW_BUMP_TEMPLATE },
]

/** How many segments one segment turns into. */
export function branchingFactor(template: Template): number {
  return Math.max(1, template.length - 1)
}

/**
 * Point counts grow like branching^iterations, so cap the slider at whatever
 * still draws in reasonable time.
 */
export function maxIterationsFor(template: Template, maxPoints = 200_000) {
  const branching = branchingFactor(template)
  if (branching < 2) return 1

  return Math.max(
    1,
    Math.min(16, Math.floor(Math.log(maxPoints) / Math.log(branching)))
  )
}

export type SegmentInfo = {
  index: number
  length: number
  /** Heading relative to the previous sub-segment, in degrees. */
  turn: number
}

export function templateSegments(template: Template): SegmentInfo[] {
  let previousAngle = 0

  return template.slice(1).map((point, i) => {
    const dx = point.x - template[i].x
    const dy = point.y - template[i].y
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    const raw = angle - previousAngle
    previousAngle = angle

    return {
      index: i,
      length: Math.hypot(dx, dy),
      // Normalise into (-180, 180] so a turn reads as left or right.
      turn: raw - 360 * Math.round(raw / 360),
    }
  })
}

/**
 * log N / log(1/r) — only meaningful when every sub-segment shrinks by the same
 * ratio, so this returns null for uneven templates.
 */
export function similarityDimension(template: Template): number | null {
  const lengths = templateSegments(template).map((segment) => segment.length)
  if (lengths.length < 2) return null

  const min = Math.min(...lengths)
  const max = Math.max(...lengths)
  if (max - min > 1e-6 || max >= 1 || max <= 0) return null

  return Math.log(lengths.length) / Math.log(1 / max)
}

/**
 * Place the template along the segment `from` -> `to`. The local x axis runs
 * along the segment and the local y axis is its left normal, so the whole
 * template scales and rotates with the segment it replaces.
 */
function placeTemplate(
  from: Point,
  to: Point,
  template: Template,
  mirrored: boolean
): Point[] {
  const along = { x: to.x - from.x, y: to.y - from.y }
  const normal = { x: -along.y, y: along.x }
  const side = mirrored ? -1 : 1

  return template.map((local) => ({
    x: from.x + local.x * along.x + side * local.y * normal.x,
    y: from.y + local.x * along.y + side * local.y * normal.y,
  }))
}

/** Replace every segment of `points` with the template. */
export function rewriteOnce(
  points: readonly Point[],
  template: Template,
  orientation: Orientation
): Point[] {
  const result: Point[] = [points[0]]

  for (let i = 0; i < points.length - 1; i++) {
    const mirrored = orientation === 'alternating' && i % 2 === 1
    const placed = placeTemplate(points[i], points[i + 1], template, mirrored)
    // Drop the leading point; it is the previous segment's endpoint.
    result.push(...placed.slice(1))
  }

  return result
}

/** Start from a unit segment and rewrite it `iterations` times. */
export function rewriteCurve(
  template: Template,
  orientation: Orientation,
  iterations: number
): Point[] {
  let points: Point[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]

  for (let i = 0; i < iterations; i++) {
    points = rewriteOnce(points, template, orientation)
  }

  return points
}
