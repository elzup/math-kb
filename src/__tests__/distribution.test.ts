import {
  binomialPmf,
  chiSquarePValue,
  chiSquareTest,
  histogramMoments,
  lnGamma,
  maxCdfGap,
  normalApproxPmf,
  normalCdf,
  toCdf,
} from '@/lib/distribution'

describe('lnGamma', () => {
  it('matches the closed forms at half and integer arguments', () => {
    expect(lnGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 14)
    expect(lnGamma(1)).toBeCloseTo(0, 14)
    expect(lnGamma(11)).toBeCloseTo(Math.log(3628800), 12)
  })
})

describe('binomialPmf', () => {
  it('is the exact Pascal row over 2^n', () => {
    expect(binomialPmf(0)).toEqual([1])
    expect(binomialPmf(1)).toEqual([0.5, 0.5])
    expect(binomialPmf(4)).toEqual([1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16])
  })

  it('sums to exactly 1 while the dyadic rationals stay exact', () => {
    for (const n of [1, 5, 12, 30, 50]) {
      expect(binomialPmf(n).reduce((sum, p) => sum + p, 0)).toBe(1)
    }
  })

  it('stays normalized in the log-space branch above n = 50', () => {
    expect(binomialPmf(200).reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 11)
  })

  it('is symmetric about n / 2', () => {
    const pmf = binomialPmf(17)
    for (let k = 0; k <= 17; k++) {
      expect(pmf[k]).toBeCloseTo(pmf[17 - k], 15)
    }
  })

  it('rejects arguments that are not non-negative integers', () => {
    expect(() => binomialPmf(-1)).toThrow()
    expect(() => binomialPmf(2.5)).toThrow()
  })
})

describe('normalCdf', () => {
  it('reproduces published values to full double precision', () => {
    expect(normalCdf(0)).toBe(0.5)
    expect(normalCdf(1)).toBeCloseTo(0.8413447460685429, 14)
    expect(normalCdf(1.96)).toBeCloseTo(0.9750021048517795, 14)
    expect(normalCdf(-3)).toBeCloseTo(0.0013498980316301, 14)
  })

  it('is symmetric', () => {
    for (const z of [0.3, 1.2, 2.7, 4.1]) {
      expect(normalCdf(-z)).toBeCloseTo(1 - normalCdf(z), 14)
    }
  })
})

describe('chiSquarePValue', () => {
  it('inverts the published 5 % critical values', () => {
    expect(chiSquarePValue(3.841458820694124, 1)).toBeCloseTo(0.05, 12)
    expect(chiSquarePValue(5.991464547107979, 2)).toBeCloseTo(0.05, 12)
    expect(chiSquarePValue(18.307038053275146, 10)).toBeCloseTo(0.05, 12)
  })

  it('is 1 at the origin and decreasing', () => {
    expect(chiSquarePValue(0, 5)).toBe(1)
    expect(chiSquarePValue(20, 5)).toBeLessThan(chiSquarePValue(10, 5))
  })
})

describe('de Moivre-Laplace', () => {
  /**
   * With the continuity correction the CDF error of the normal approximation
   * is O(1/n), not O(1/sqrt n): n * error settles on a constant.
   */
  it('has a CDF error that shrinks like 1 / n', () => {
    const gaps = [32, 64, 128, 256, 512].map((n) => ({
      n,
      gap: maxCdfGap(binomialPmf(n), normalApproxPmf(n)),
    }))

    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i].gap).toBeLessThan(gaps[i - 1].gap)
      expect(gaps[i].gap * gaps[i].n).toBeCloseTo(
        gaps[i - 1].gap * gaps[i - 1].n,
        2
      )
    }

    for (const { n, gap } of gaps) {
      expect(gap).toBeLessThan(0.03 / n)
    }
  })

  it('keeps the approximation normalized over the support', () => {
    const total = normalApproxPmf(20).reduce((sum, p) => sum + p, 0)
    // The tails outside 0..n are the only mass the discrete support drops.
    expect(1 - total).toBeGreaterThan(0)
    expect(1 - total).toBeLessThan(1e-4)
  })
})

describe('toCdf / maxCdfGap', () => {
  it('accumulates and compares', () => {
    expect(toCdf([0.2, 0.3, 0.5])).toEqual([0.2, 0.5, 1])
    expect(maxCdfGap([0.5, 0.5], [0.5, 0.5])).toBe(0)
    expect(maxCdfGap([0.6, 0.4], [0.5, 0.5])).toBeCloseTo(0.1, 15)
  })
})

describe('histogramMoments', () => {
  it('reports the mean and population variance over the bin index', () => {
    const { total, mean, variance } = histogramMoments([1, 0, 1])
    expect(total).toBe(2)
    expect(mean).toBe(1)
    expect(variance).toBe(1)
  })

  it('matches n/2 and n/4 for the binomial itself', () => {
    const n = 16
    const scale = 2 ** n
    const counts = binomialPmf(n).map((p) => p * scale)
    const { mean, variance } = histogramMoments(counts)
    expect(mean).toBeCloseTo(n / 2, 10)
    expect(variance).toBeCloseTo(n / 4, 10)
  })
})

describe('chiSquareTest', () => {
  it('is 0 with p = 1 when the observation is the expectation', () => {
    const pmf = binomialPmf(6)
    const counts = pmf.map((p) => p * 100000)
    const result = chiSquareTest(counts, pmf)
    expect(result.statistic).toBeCloseTo(0, 10)
    expect(result.pValue).toBeCloseTo(1, 10)
  })

  it('pools the tails so every group expects at least 5', () => {
    const pmf = binomialPmf(12)
    const counts = pmf.map((p) => Math.round(p * 400))
    const { groups, df } = chiSquareTest(counts, pmf)

    for (const group of groups) {
      expect(group.expected).toBeGreaterThanOrEqual(5)
    }
    expect(groups[0].from).toBe(0)
    expect(groups[groups.length - 1].to).toBe(12)
    expect(df).toBe(groups.length - 1)
    // 400 balls cannot expect 5 in all 13 bins, so pooling has to happen.
    expect(groups.length).toBeLessThan(13)
  })

  it('flags a distribution that is too flat', () => {
    const pmf = binomialPmf(10)
    const uniform = Array.from({ length: 11 }, () => 1000)
    expect(chiSquareTest(uniform, pmf).pValue).toBeLessThan(1e-10)
  })

  it('rejects mismatched lengths', () => {
    expect(() => chiSquareTest([1, 2], [0.5])).toThrow()
  })
})
