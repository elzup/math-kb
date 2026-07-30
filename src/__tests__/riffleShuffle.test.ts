import {
  perfectInShuffle,
  perfectOutShuffle,
  simulateUntilReturn,
} from '@/lib/riffleShuffle'

describe('perfect shuffle cycles', () => {
  it('52 cards return to original order after 8 out-shuffles', () => {
    const result = simulateUntilReturn(perfectOutShuffle, 52)
    expect(result.cycleLength).toBe(8)
  })

  it('52 cards return to original order after 52 in-shuffles', () => {
    const result = simulateUntilReturn(perfectInShuffle, 52)
    expect(result.cycleLength).toBe(52)
  })

  it('8 cards return to original order after 3 out-shuffles', () => {
    const result = simulateUntilReturn(perfectOutShuffle, 8)
    expect(result.cycleLength).toBe(3)
  })
})
