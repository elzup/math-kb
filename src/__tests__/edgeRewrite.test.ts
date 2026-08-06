import { dragonPoints } from '@/lib/dragonCurve'
import {
  branchingFactor,
  KOCH_TEMPLATE,
  maxIterationsFor,
  MINKOWSKI_TEMPLATE,
  RIGHT_ANGLE_TEMPLATE,
  rewriteCurve,
  rewriteOnce,
  similarityDimension,
  templateSegments,
} from '@/lib/edgeRewrite'
import type { Point } from '@/lib/point'

/**
 * Put a polyline in a canonical frame — start at (0,0), end at (1,0) — so two
 * curves can be compared regardless of their scale, rotation or position.
 */
function normalize(points: readonly Point[]): Point[] {
  const first = points[0]
  const last = points[points.length - 1]
  const dx = last.x - first.x
  const dy = last.y - first.y
  const lengthSquared = dx * dx + dy * dy

  return points.map((point) => {
    const ux = point.x - first.x
    const uy = point.y - first.y
    return {
      x: (ux * dx + uy * dy) / lengthSquared,
      y: (uy * dx - ux * dy) / lengthSquared,
    }
  })
}

function isSameShape(a: readonly Point[], b: readonly Point[]): boolean {
  if (a.length !== b.length) return false

  const left = normalize(a)
  const right = normalize(b)
  return left.every(
    (point, i) =>
      Math.abs(point.x - right[i].x) < 1e-9 &&
      Math.abs(point.y - right[i].y) < 1e-9
  )
}

describe('rewriteOnce', () => {
  it('replaces one segment with the template', () => {
    const rewritten = rewriteOnce(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      RIGHT_ANGLE_TEMPLATE,
      'fixed'
    )

    expect(rewritten).toEqual([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 0 },
    ])
  })

  it('mirrors every other segment when alternating', () => {
    const start = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]

    const fixed = rewriteOnce(start, RIGHT_ANGLE_TEMPLATE, 'fixed')
    const alternating = rewriteOnce(start, RIGHT_ANGLE_TEMPLATE, 'alternating')

    // First segment is untouched by the flag, the second one flips.
    expect(alternating[1]).toEqual(fixed[1])
    expect(alternating[3]).toEqual({ x: 1.5, y: -0.5 })
    expect(fixed[3]).toEqual({ x: 1.5, y: 0.5 })
  })
})

describe('rewriteCurve', () => {
  it.each([
    1, 2, 3, 4, 6, 8, 10,
  ])('right angles alternating reproduce the order-%i dragon', (order) => {
    // The paperfolding walk and the edge rewriting are two descriptions of
    // the same curve; they agree up to scale and rotation.
    expect(
      isSameShape(
        rewriteCurve(RIGHT_ANGLE_TEMPLATE, 'alternating', order),
        dragonPoints(order)
      )
    ).toBe(true)
  })

  it('right angles held fixed give a different curve (Levy C)', () => {
    expect(
      isSameShape(
        rewriteCurve(RIGHT_ANGLE_TEMPLATE, 'fixed', 6),
        dragonPoints(6)
      )
    ).toBe(false)
  })

  it.each([1, 2, 3, 4, 5])('koch has 4^%i segments', (iterations) => {
    expect(rewriteCurve(KOCH_TEMPLATE, 'fixed', iterations)).toHaveLength(
      4 ** iterations + 1
    )
  })

  it('keeps the koch curve on one side of its baseline', () => {
    const points = rewriteCurve(KOCH_TEMPLATE, 'fixed', 4)
    expect(points.every((point) => point.y >= -1e-9)).toBe(true)
  })

  it('sends the koch curve to both sides when alternating', () => {
    const points = rewriteCurve(KOCH_TEMPLATE, 'alternating', 4)
    expect(points.some((point) => point.y > 1e-9)).toBe(true)
    expect(points.some((point) => point.y < -1e-9)).toBe(true)
  })

  it('always spans the original segment end to end', () => {
    const points = rewriteCurve(RIGHT_ANGLE_TEMPLATE, 'alternating', 5)
    expect(points[0]).toEqual({ x: 0, y: 0 })
    expect(points[points.length - 1].x).toBeCloseTo(1)
    expect(points[points.length - 1].y).toBeCloseTo(0)
  })
})

describe('template measurements', () => {
  it('counts how many segments one segment becomes', () => {
    expect(branchingFactor(RIGHT_ANGLE_TEMPLATE)).toBe(2)
    expect(branchingFactor(KOCH_TEMPLATE)).toBe(4)
    expect(branchingFactor(MINKOWSKI_TEMPLATE)).toBe(8)
  })

  it('reads off lengths and turns', () => {
    const segments = templateSegments(RIGHT_ANGLE_TEMPLATE)

    expect(segments).toHaveLength(2)
    expect(segments[0].length).toBeCloseTo(Math.SQRT1_2)
    expect(segments[0].turn).toBeCloseTo(45)
    expect(segments[1].turn).toBeCloseTo(-90)
  })

  it('gives the similarity dimension of the classic generators', () => {
    // Right angles: 2 copies at 1/sqrt(2) fill the plane.
    expect(similarityDimension(RIGHT_ANGLE_TEMPLATE)).toBeCloseTo(2)
    // Koch: log 4 / log 3.
    expect(similarityDimension(KOCH_TEMPLATE)).toBeCloseTo(1.261859)
    // Minkowski: log 8 / log 4.
    expect(similarityDimension(MINKOWSKI_TEMPLATE)).toBeCloseTo(1.5)
  })

  it('declines to guess a dimension for uneven templates', () => {
    expect(
      similarityDimension([
        { x: 0, y: 0 },
        { x: 0.2, y: 0.4 },
        { x: 1, y: 0 },
      ])
    ).toBeNull()
  })

  it('caps iterations so the point count stays drawable', () => {
    expect(maxIterationsFor(RIGHT_ANGLE_TEMPLATE)).toBe(16)
    expect(maxIterationsFor(KOCH_TEMPLATE)).toBe(8)
    expect(maxIterationsFor(MINKOWSKI_TEMPLATE)).toBe(5)
  })

  it('keeps generated point counts under the cap', () => {
    for (const template of [
      RIGHT_ANGLE_TEMPLATE,
      KOCH_TEMPLATE,
      MINKOWSKI_TEMPLATE,
    ]) {
      const order = maxIterationsFor(template)
      expect(branchingFactor(template) ** order).toBeLessThanOrEqual(200_000)
    }
  })
})
