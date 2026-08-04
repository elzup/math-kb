import { identityPermutation } from '@/lib/permutation'
import {
  countRisingSequences,
  perfectInPermutation,
  perfectOutPermutation,
  simulateUntilReturn,
} from '@/lib/riffleShuffle'

describe('perfect shuffle permutations', () => {
  it('interleaves an 8 card deck keeping the top card on top', () => {
    expect(perfectOutPermutation(8)).toEqual([0, 4, 1, 5, 2, 6, 3, 7])
  })

  it('interleaves an 8 card deck pushing the top card down', () => {
    expect(perfectInPermutation(8)).toEqual([4, 0, 5, 1, 6, 2, 7, 3])
  })

  it('rejects odd deck sizes', () => {
    expect(() => perfectOutPermutation(7)).toThrow(
      'Perfect shuffle requires an even deck size'
    )
  })
})

describe('perfect shuffle cycles', () => {
  it('52 cards return to original order after 8 out-shuffles', () => {
    const result = simulateUntilReturn(perfectOutPermutation(52))
    expect(result.cycleLength).toBe(8)
  })

  it('52 cards return to original order after 52 in-shuffles', () => {
    const result = simulateUntilReturn(perfectInPermutation(52))
    expect(result.cycleLength).toBe(52)
  })

  it('8 cards return to original order after 3 out-shuffles', () => {
    const result = simulateUntilReturn(perfectOutPermutation(8))
    expect(result.cycleLength).toBe(3)
  })

  it('reports -1 when the deck does not come back in time', () => {
    expect(simulateUntilReturn(perfectInPermutation(52), 10).cycleLength).toBe(
      -1
    )
  })
})

describe('countRisingSequences', () => {
  it('is 1 for a deck in order', () => {
    expect(countRisingSequences(identityPermutation(52))).toBe(1)
  })

  it('counts the runs still in original order', () => {
    expect(countRisingSequences([0, 2, 1, 3])).toBe(2)
    expect(countRisingSequences([3, 2, 1, 0])).toBe(4)
  })

  it('at most doubles after one perfect shuffle', () => {
    const { steps } = simulateUntilReturn(perfectOutPermutation(52))

    steps.forEach((step, index) => {
      if (index === 0) return
      expect(step.risingSequenceCount).toBeLessThanOrEqual(
        steps[index - 1].risingSequenceCount * 2
      )
    })
    expect(steps[steps.length - 1].risingSequenceCount).toBe(1)
  })
})
