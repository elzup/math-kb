import type { Point } from './point'

export const CHAOS_TRIANGLE: readonly [Point, Point, Point] = [
  { x: 0.5, y: 0.06 },
  { x: 0.06, y: 0.94 },
  { x: 0.94, y: 0.94 },
]

export type ChaosGameStep = {
  from: Point
  vertex: Point
  vertexIndex: number
  next: Point
}

export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

export function randomPointInTriangle(
  random: () => number = Math.random
): Point {
  const first = random()
  const second = random()
  const isOutside = first + second > 1
  const u = isOutside ? 1 - first : first
  const v = isOutside ? 1 - second : second
  const [top, left, right] = CHAOS_TRIANGLE

  return {
    x: top.x + u * (left.x - top.x) + v * (right.x - top.x),
    y: top.y + u * (left.y - top.y) + v * (right.y - top.y),
  }
}

export function chaosGameStep(
  from: Point,
  random: () => number = Math.random
): ChaosGameStep {
  const vertexIndex = Math.min(
    CHAOS_TRIANGLE.length - 1,
    Math.floor(random() * CHAOS_TRIANGLE.length)
  )
  const vertex = CHAOS_TRIANGLE[vertexIndex]

  return {
    from,
    vertex,
    vertexIndex,
    next: midpoint(from, vertex),
  }
}
