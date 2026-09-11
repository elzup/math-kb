import {
  CHAOS_TRIANGLE,
  chaosGameStep,
  midpoint,
  randomPointInTriangle,
} from '@/lib/chaosGame'

describe('chaos game', () => {
  it('finds the exact midpoint of two points', () => {
    expect(midpoint({ x: 0.2, y: 0.8 }, { x: 0.6, y: 0.2 })).toEqual({
      x: 0.4,
      y: 0.5,
    })
  })

  it('chooses one of the three vertices and advances halfway', () => {
    const from = { x: 0.3, y: 0.7 }
    const step = chaosGameStep(from, () => 0.5)

    expect(step.vertexIndex).toBe(1)
    expect(step.vertex).toBe(CHAOS_TRIANGLE[1])
    expect(step.next).toEqual(midpoint(from, CHAOS_TRIANGLE[1]))
  })

  it('reflects random coordinates back into the triangle', () => {
    const values = [0.9, 0.8]
    let index = 0
    const point = randomPointInTriangle(() => values[index++])
    const [top, left, right] = CHAOS_TRIANGLE
    const expected = {
      x: top.x + 0.1 * (left.x - top.x) + 0.2 * (right.x - top.x),
      y: top.y + 0.1 * (left.y - top.y) + 0.2 * (right.y - top.y),
    }

    expect(point.x).toBeCloseTo(expected.x, 12)
    expect(point.y).toBeCloseTo(expected.y, 12)
  })

  it('never leaves the triangle after repeated steps', () => {
    let point = randomPointInTriangle(() => 0.25)
    const choices = [0, 0.34, 0.67]

    for (let index = 0; index < 300; index++) {
      point = chaosGameStep(point, () => choices[index % choices.length]).next
      expect(point.y).toBeGreaterThanOrEqual(CHAOS_TRIANGLE[0].y)
      expect(point.y).toBeLessThanOrEqual(CHAOS_TRIANGLE[1].y)
      const halfWidth = ((point.y - 0.06) / 0.88) * 0.44
      expect(point.x).toBeGreaterThanOrEqual(0.5 - halfWidth - 1e-12)
      expect(point.x).toBeLessThanOrEqual(0.5 + halfWidth + 1e-12)
    }
  })
})
