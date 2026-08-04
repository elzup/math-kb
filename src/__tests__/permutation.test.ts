import {
  applyPermutation,
  applyPermutationTimes,
  identityPermutation,
  isIdentity,
  permutationCycles,
  permutationDisplacements,
  permutationOrbit,
  permutationOrder,
  permutationStats,
} from '@/lib/permutation'

const ROTATE_LEFT = [1, 2, 0]

describe('applyPermutation', () => {
  it('pulls each slot from the position the permutation names', () => {
    expect(applyPermutation(['a', 'b', 'c'], ROTATE_LEFT)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('leaves the deck alone for the identity', () => {
    const deck = ['a', 'b', 'c']
    expect(applyPermutation(deck, identityPermutation(3))).toEqual(deck)
  })

  it('composes with itself', () => {
    expect(applyPermutationTimes(['a', 'b', 'c'], ROTATE_LEFT, 2)).toEqual([
      'c',
      'a',
      'b',
    ])
    expect(applyPermutationTimes(['a', 'b', 'c'], ROTATE_LEFT, 3)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('does not mutate its input', () => {
    const deck = ['a', 'b', 'c']
    applyPermutationTimes(deck, ROTATE_LEFT, 2)
    expect(deck).toEqual(['a', 'b', 'c'])
  })
})

describe('isIdentity', () => {
  it('recognises the untouched deck', () => {
    expect(isIdentity(identityPermutation(5))).toBe(true)
    expect(isIdentity(ROTATE_LEFT)).toBe(false)
  })
})

describe('permutationOrbit', () => {
  it('runs from the start back to the start', () => {
    expect(permutationOrbit(ROTATE_LEFT)).toEqual([
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
      [0, 1, 2],
    ])
  })

  it('stops at maxSteps without returning', () => {
    const orbit = permutationOrbit(ROTATE_LEFT, 2)

    expect(orbit).toHaveLength(3)
    expect(isIdentity(orbit[orbit.length - 1])).toBe(false)
  })
})

describe('permutationCycles', () => {
  it('splits the identity into fixed points', () => {
    expect(permutationCycles([0, 1, 2])).toEqual([[0], [1], [2]])
  })

  it('collects a full cycle', () => {
    expect(permutationCycles(ROTATE_LEFT)).toEqual([[0, 1, 2]])
  })

  it('covers every position exactly once', () => {
    const perm = [3, 2, 1, 0, 5, 4]
    expect(
      permutationCycles(perm)
        .flat()
        .sort((a, b) => a - b)
    ).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('permutationOrder', () => {
  it('is 1 for the identity', () => {
    expect(permutationOrder(identityPermutation(4))).toBe(1n)
  })

  it('is the lcm of the cycle lengths', () => {
    // One 2-cycle and one 3-cycle -> lcm(2, 3) = 6.
    expect(permutationOrder([1, 0, 3, 4, 2])).toBe(6n)
  })
})

describe('permutationStats', () => {
  it('summarises cycles and displacement', () => {
    const stats = permutationStats([1, 0, 3, 4, 2])

    expect(stats).toMatchObject({
      size: 5,
      cycleCount: 2,
      longestCycle: 3,
      fixedPoints: 0,
      order: 6n,
      maxDisplacement: 2,
    })
    expect(permutationDisplacements([1, 0, 3, 4, 2])).toEqual([1, 1, 1, 1, 2])
  })
})
