import {
  hilbertIndexToPoint,
  hilbertPointToIndex,
  hilbertPoints,
  hilbertShuffle,
} from '@/lib/hilbertCurve'
import {
  applyPermutation,
  applyPermutationTimes,
  identityPermutation,
  permutationOrder,
} from '@/lib/permutation'

const ORDERS = [1, 2, 3, 4, 5]

describe('hilbert curve', () => {
  it.each(ORDERS)('order %i visits every cell exactly once', (order) => {
    const points = hilbertPoints(order)
    const keys = new Set(points.map((p) => `${p.x},${p.y}`))

    expect(points).toHaveLength(4 ** order)
    expect(keys.size).toBe(4 ** order)
  })

  it.each(ORDERS)('order %i moves one step at a time', (order) => {
    const points = hilbertPoints(order)

    for (let i = 1; i < points.length; i++) {
      const distance =
        Math.abs(points[i].x - points[i - 1].x) +
        Math.abs(points[i].y - points[i - 1].y)
      expect(distance).toBe(1)
    }
  })

  it.each(ORDERS)('order %i round-trips index <-> point', (order) => {
    for (let index = 0; index < 4 ** order; index++) {
      const point = hilbertIndexToPoint(order, index)
      expect(hilbertPointToIndex(order, point.x, point.y)).toBe(index)
    }
  })

  it('starts at the origin', () => {
    expect(hilbertIndexToPoint(3, 0)).toEqual({ x: 0, y: 0 })
  })

  it('matches the known order-1 U shape', () => {
    expect(hilbertPoints(1)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
    ])
  })
})

describe('hilbert shuffle', () => {
  it.each(ORDERS)('order %i is a permutation of the deck', (order) => {
    const perm = hilbertShuffle(order)

    expect([...perm].sort((a, b) => a - b)).toEqual(
      identityPermutation(4 ** order)
    )
  })

  it('reorders a deck by picking it up along the curve', () => {
    // Order 1 lays 0..3 out row-major, the curve visits (0,0) (0,1) (1,1) (1,0).
    expect(hilbertShuffle(1)).toEqual([0, 2, 3, 1])
    expect(applyPermutation(['a', 'b', 'c', 'd'], hilbertShuffle(1))).toEqual([
      'a',
      'c',
      'd',
      'b',
    ])
  })

  it.each(ORDERS)('order %i never moves the top card', (order) => {
    // The curve always starts at (0, 0), which is row-major position 0.
    expect(hilbertShuffle(order)[0]).toBe(0)
  })

  // Orders 1-4 only: order 5 needs 410,667,840 repeats, far too slow to replay.
  it.each([
    1, 2, 3, 4,
  ])('order %i returns to the start after its order', (order) => {
    const perm = hilbertShuffle(order)
    const deck = identityPermutation(4 ** order)
    const times = Number(permutationOrder(perm))

    expect(applyPermutationTimes(deck, perm, times)).toEqual(deck)
    expect(applyPermutationTimes(deck, perm, times - 1)).not.toEqual(deck)
  })

  it('has the expected cycle structure for small orders', () => {
    // 3 shuffles for a 2x2 grid, 30 for 4x4.
    expect(permutationOrder(hilbertShuffle(1))).toBe(3n)
    expect(permutationOrder(hilbertShuffle(2))).toBe(30n)
  })
})
