import {
  dragonPoints,
  dragonTurns,
  turnAt,
  turnDetail,
} from '@/lib/dragonCurve'
import { boundsOf } from '@/lib/point'

const ORDERS = [1, 2, 3, 4, 8, 12]

/** (1+i)^n, the known endpoint of the order-n dragon in the complex plane. */
function gaussianPower(n: number) {
  let re = 1
  let im = 0
  for (let i = 0; i < n; i++) {
    ;[re, im] = [re - im, re + im]
  }
  return { x: re, y: im }
}

/** Jest tells -0 from 0, and negating a zero coordinate produces -0. */
function normalizeZero(value: number): number {
  return value === 0 ? 0 : value
}

function edgeKey(a: { x: number; y: number }, b: { x: number; y: number }) {
  const forward = `${a.x},${a.y},${b.x},${b.y}`
  const backward = `${b.x},${b.y},${a.x},${a.y}`
  return forward < backward ? forward : backward
}

describe('paperfolding sequence', () => {
  it('starts R R L R R L L', () => {
    expect(Array.from({ length: 7 }, (_, i) => turnAt(i + 1)).join('')).toBe(
      'RRLRRLL'
    )
  })

  it('turns right at every power of two', () => {
    // n = 2^k has odd part 1, and 1 mod 4 = 1.
    for (const index of [1, 2, 4, 8, 16, 1024]) {
      expect(turnAt(index)).toBe('R')
    }
  })

  it('exposes the reasoning behind a fold', () => {
    expect(turnDetail(12)).toEqual({
      index: 12,
      binary: '1100',
      oddPart: 3,
      remainder: 3,
      turn: 'L',
    })
  })

  it.each(ORDERS)('order %i has 2^n - 1 folds', (order) => {
    expect(dragonTurns(order)).toHaveLength(2 ** order - 1)
  })
})

describe('dragon curve', () => {
  it.each(ORDERS)('order %i has 2^n segments', (order) => {
    expect(dragonPoints(order)).toHaveLength(2 ** order + 1)
  })

  it.each(ORDERS)('order %i moves one lattice step at a time', (order) => {
    const points = dragonPoints(order)

    for (let i = 1; i < points.length; i++) {
      const distance =
        Math.abs(points[i].x - points[i - 1].x) +
        Math.abs(points[i].y - points[i - 1].y)
      expect(distance).toBe(1)
    }
  })

  it.each(ORDERS)('order %i ends at (1+i)^n', (order) => {
    const points = dragonPoints(order)
    const expected = gaussianPower(order)

    // The walk uses screen coordinates, so the imaginary axis is flipped.
    expect(points[points.length - 1]).toEqual({
      x: normalizeZero(expected.x),
      y: normalizeZero(-expected.y),
    })
  })

  it.each(ORDERS)('order %i never retraces an edge', (order) => {
    const points = dragonPoints(order)
    const edges = new Set(
      points.slice(1).map((point, i) => edgeKey(points[i], point))
    )

    expect(edges.size).toBe(2 ** order)
  })

  it.each(ORDERS)('order %i starts with the previous order', (order) => {
    // Self-similarity: the second half is the first half turned 90 degrees.
    expect(dragonPoints(order).slice(0, 2 ** (order - 1) + 1)).toEqual(
      dragonPoints(order - 1)
    )
  })
})

describe('boundsOf', () => {
  it('measures the drawn extent', () => {
    expect(boundsOf(dragonPoints(4))).toEqual({
      minX: -4,
      minY: -2,
      maxX: 1,
      maxY: 1,
    })
  })
})
