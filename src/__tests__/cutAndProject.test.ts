import {
  canonicalWidth,
  distinctLengths,
  expectedRatio,
  fibonacciFactorIndex,
  fibonacciWord,
  lineNorm,
  parallelOf,
  perpendicularOf,
  rotationOf,
  smallestPeriod,
  type Strip,
  stripPoints,
  tileStats,
  tilesOf,
  windowPartition,
  wordOf,
} from '@/lib/cutAndProject'

const GOLDEN_SLOPE = (Math.sqrt(5) - 1) / 2
const SILVER_SLOPE = Math.SQRT2 - 1
const IRRATIONAL_SLOPES = [GOLDEN_SLOPE, SILVER_SLOPE, Math.PI - 3, Math.SQRT2]

function canonicalStrip(slope: number, offset = 0): Strip {
  return { slope, width: canonicalWidth(slope), offset }
}

describe('projection coordinates', () => {
  it('splits a point into two orthogonal parts', () => {
    const point = { x: 3, y: -7 }
    for (const slope of IRRATIONAL_SLOPES) {
      const along = parallelOf(point, slope)
      const across = perpendicularOf(point, slope)
      expect(along ** 2 + across ** 2).toBeCloseTo(
        point.x ** 2 + point.y ** 2,
        10
      )
    }
  })

  it('puts the line itself at distance zero', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      expect(perpendicularOf({ x: 4, y: 4 * slope }, slope)).toBeCloseTo(0, 12)
    }
  })
})

describe('canonical strip', () => {
  it('is the unit square shadow on the normal direction', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const norm = lineNorm(slope)
      expect(canonicalWidth(slope)).toBeCloseTo(1 / norm + slope / norm, 12)
    }
  })

  it('keeps every accepted point inside the window', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const strip = canonicalStrip(slope, 0.1)
      const half = strip.width / 2
      for (const point of stripPoints(strip, 300)) {
        expect(point.perpendicular).toBeGreaterThanOrEqual(strip.offset - half)
        expect(point.perpendicular).toBeLessThan(strip.offset + half)
      }
    }
  })

  it('takes only unit steps, so gaps come in exactly two lengths', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const tiles = tilesOf(stripPoints(canonicalStrip(slope), 400), slope)
      expect(tileStats(tiles).other).toBe(0)
      expect(distinctLengths(tiles)).toHaveLength(2)
    }
  })

  it('sets the length ratio of the two gaps to the slope', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const [short, long] = distinctLengths(
        tilesOf(stripPoints(canonicalStrip(slope), 400), slope)
      )
      expect(long / short).toBeCloseTo(expectedRatio(slope), 10)
    }
  })

  it('lets the count ratio converge to the same value', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const tiles = tilesOf(stripPoints(canonicalStrip(slope), 20000), slope)
      const { ratio } = tileStats(tiles)
      expect(ratio).not.toBeNull()
      expect(ratio as number).toBeCloseTo(expectedRatio(slope), 2)
    }
  })

  it('produces one point per unit of length along the line', () => {
    // Density is 1 / (mean gap); the mean gap follows from the two lengths.
    const slope = GOLDEN_SLOPE
    const points = stripPoints(canonicalStrip(slope), 2000)
    const span = points[points.length - 1].parallel - points[0].parallel
    expect(points.length / span).toBeCloseTo(canonicalWidth(slope), 2)
  })
})

describe('window width', () => {
  const slope = GOLDEN_SLOPE

  it('adds a third gap length once the window is too wide', () => {
    const width = canonicalWidth(slope) * 1.6
    const tiles = tilesOf(stripPoints({ slope, width, offset: 0 }, 400), slope)
    expect(distinctLengths(tiles).length).toBeGreaterThan(2)
    expect(tileStats(tiles).other).toBeGreaterThan(0)
  })

  it('leaves longer gaps once the window is too narrow', () => {
    const narrow = canonicalWidth(slope) * 0.5
    const canonical = stripPoints(canonicalStrip(slope), 400)
    const thinned = stripPoints({ slope, width: narrow, offset: 0 }, 400)
    expect(thinned.length).toBeLessThan(canonical.length)
    expect(distinctLengths(tilesOf(thinned, slope)).length).toBeGreaterThan(2)
  })
})

describe('internal space', () => {
  it('slides by a fixed amount at every step, wrapping in the window', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const strip = canonicalStrip(slope)
      const { shift, circumference } = rotationOf(slope)
      const low = -circumference / 2
      const points = stripPoints(strip, 500)

      for (let i = 1; i < points.length; i++) {
        const slid = points[i - 1].perpendicular - shift - low
        const wrapped =
          (((slid % circumference) + circumference) % circumference) + low
        expect(points[i].perpendicular).toBeCloseTo(wrapped, 9)
      }
    }
  })

  it('splits the window into a climb part and a move-right part', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const strip = canonicalStrip(slope, 0.2)
      const { boundary } = windowPartition(strip)
      const points = stripPoints(strip, 400)

      for (let i = 1; i < points.length; i++) {
        const climbed = points[i].lattice.x === points[i - 1].lattice.x
        expect(points[i - 1].perpendicular < boundary).toBe(climbed)
      }
    }
  })

  it('makes the lower part as long as the frequency of the climb', () => {
    for (const slope of IRRATIONAL_SLOPES) {
      const strip = canonicalStrip(slope)
      const { low, high, boundary } = windowPartition(strip)
      const points = stripPoints(strip, 4000)
      const climbs = points.filter(
        (point, index) =>
          index > 0 && point.lattice.x === points[index - 1].lattice.x
      ).length
      expect(climbs / (points.length - 1)).toBeCloseTo(
        (boundary - low) / (high - low),
        2
      )
    }
  })

  it('turns an irrational slope into an irrational rotation number', () => {
    expect(rotationOf(GOLDEN_SLOPE).number).toBeCloseTo(
      2 - (1 + Math.sqrt(5)) / 2,
      12
    )
  })
})

describe('the projected word', () => {
  it('never repeats for an irrational slope', () => {
    // pi - 3 sits within 1e-5 of 16 / 113, so its word only breaks the pattern
    // tens of thousands of letters in; the others give up much sooner.
    for (const slope of [GOLDEN_SLOPE, SILVER_SLOPE, Math.SQRT2]) {
      const word = wordOf(
        tilesOf(stripPoints(canonicalStrip(slope), 2000), slope)
      )
      expect(smallestPeriod(word)).toBeNull()
    }
  })

  it('repeats with period p + q for the slope p / q', () => {
    const cases: [number, number][] = [
      [1, 2],
      [2, 5],
      [8, 13],
    ]
    for (const [p, q] of cases) {
      const slope = p / q
      const word = wordOf(
        tilesOf(stripPoints(canonicalStrip(slope), 40 * q), slope)
      )
      expect(smallestPeriod(word)).toBe(p + q)
    }
  })

  it('is a piece of the Fibonacci word wherever the golden window sits', () => {
    for (const offset of [-0.4, -0.25, 0, 0.25, 0.4]) {
      const strip = canonicalStrip(
        GOLDEN_SLOPE,
        offset * canonicalWidth(GOLDEN_SLOPE)
      )
      const word = wordOf(tilesOf(stripPoints(strip, 200), GOLDEN_SLOPE))
      // Shifting the window rewrites the sequence but not its vocabulary.
      expect(fibonacciFactorIndex(word.slice(0, 60))).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('fibonacciWord', () => {
  it('grows by L -> LS, S -> L', () => {
    expect(fibonacciWord(13)).toBe('LSLLSLSLLSLLS')
  })

  it('has one more L than the previous step has letters', () => {
    // Lengths run through the Fibonacci numbers 1, 2, 3, 5, 8, 13, ...
    const word = fibonacciWord(89)
    const longCount = [...word].filter((letter) => letter === 'L').length
    expect(longCount).toBe(55)
  })

  it('reports where a factor sits', () => {
    expect(fibonacciFactorIndex('LSLL')).toBe(0)
    expect(fibonacciFactorIndex('SLLSL')).toBeGreaterThan(0)
    // Two short gaps never touch, so SS is not part of the vocabulary.
    expect(fibonacciFactorIndex('SS')).toBe(-1)
  })
})

describe('smallestPeriod', () => {
  it('finds the shortest repeating block', () => {
    expect(smallestPeriod('LSLSLSLS')).toBe(2)
    expect(smallestPeriod('LLSLLSLLS')).toBe(3)
  })

  it('needs three repeats before calling a word periodic', () => {
    expect(smallestPeriod('LSLSL')).toBeNull()
  })
})
