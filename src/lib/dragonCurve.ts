import type { Point } from './point'

export type Turn = 'L' | 'R'

/** Strip the factors of 2, leaving the odd part of a positive integer. */
function oddPart(value: number): number {
  let odd = value
  while (odd % 2 === 0) odd /= 2
  return odd
}

/**
 * The regular paperfolding sequence, 1-indexed. Write the fold number as
 * m * 2^k with m odd: it is a right turn when m = 1 (mod 4) and a left turn
 * when m = 3 (mod 4). The sequence starts R R L R R L L.
 */
export function turnAt(index: number): Turn {
  return oddPart(index) % 4 === 1 ? 'R' : 'L'
}

export type TurnDetail = {
  index: number
  binary: string
  oddPart: number
  remainder: number
  turn: Turn
}

export function turnDetail(index: number): TurnDetail {
  const odd = oddPart(index)

  return {
    index,
    binary: index.toString(2),
    oddPart: odd,
    remainder: odd % 4,
    turn: odd % 4 === 1 ? 'R' : 'L',
  }
}

/** Every fold of an order-`order` dragon: 2^order - 1 of them. */
export function dragonTurns(order: number): Turn[] {
  return Array.from({ length: 2 ** order - 1 }, (_, i) => turnAt(i + 1))
}

function turnDirection(direction: Point, turn: Turn): Point {
  // Screen coordinates run y-downwards, so a right turn is (x, y) -> (y, -x).
  return turn === 'R'
    ? { x: direction.y, y: -direction.x }
    : { x: -direction.y, y: direction.x }
}

/**
 * Lattice points of the order-`order` dragon, walking east from the origin.
 * Returns 2^order + 1 points, one more than the number of segments.
 */
export function dragonPoints(order: number): Point[] {
  const segments = 2 ** order
  const points: Point[] = [{ x: 0, y: 0 }]

  let direction: Point = { x: 1, y: 0 }
  let current: Point = { x: 0, y: 0 }

  for (let step = 0; step < segments; step++) {
    if (step > 0) direction = turnDirection(direction, turnAt(step))
    current = { x: current.x + direction.x, y: current.y + direction.y }
    points.push(current)
  }

  return points
}
