import type { Point } from './point'

export type { Point }

/**
 * Rotate / reflect a quadrant so that its sub-curve lines up with its
 * neighbours. This is the `rot` helper of the classic d2xy / xy2d algorithm,
 * rewritten to return a new point instead of mutating in place.
 */
function rotateQuadrant(size: number, point: Point, rx: number, ry: number) {
  if (ry !== 0) return point

  const flipped =
    rx === 1 ? { x: size - 1 - point.x, y: size - 1 - point.y } : point

  // Reflect across the diagonal.
  return { x: flipped.y, y: flipped.x }
}

/** Grid coordinate visited at step `index` of the order-`order` Hilbert curve. */
export function hilbertIndexToPoint(order: number, index: number): Point {
  const side = 2 ** order
  let point: Point = { x: 0, y: 0 }
  let rest = index

  for (let size = 1; size < side; size *= 2) {
    const rx = 1 & Math.floor(rest / 2)
    const ry = 1 & (rest ^ rx)
    const rotated = rotateQuadrant(size, point, rx, ry)

    point = { x: rotated.x + size * rx, y: rotated.y + size * ry }
    rest = Math.floor(rest / 4)
  }

  return point
}

/** Inverse of {@link hilbertIndexToPoint}. */
export function hilbertPointToIndex(order: number, x: number, y: number) {
  const side = 2 ** order
  let point: Point = { x, y }
  let index = 0

  // `size >= 1`, not `> 0`: halving a float never reaches 0, and the extra
  // sub-integer rounds would spin ~1000 times contributing nothing.
  for (let size = side / 2; size >= 1; size /= 2) {
    const rx = (point.x & size) > 0 ? 1 : 0
    const ry = (point.y & size) > 0 ? 1 : 0

    index += size * size * ((3 * rx) ^ ry)
    point = rotateQuadrant(side, point, rx, ry)
  }

  return index
}

/** Every grid coordinate, in the order the curve visits them. */
export function hilbertPoints(order: number): Point[] {
  return Array.from({ length: 4 ** order }, (_, index) =>
    hilbertIndexToPoint(order, index)
  )
}

/**
 * The shuffle you get by laying a deck out on a 2^order x 2^order grid in
 * row-major order and picking it back up along the Hilbert curve.
 *
 * See `permutation.ts` for what to do with the result.
 */
export function hilbertShuffle(order: number): number[] {
  const side = 2 ** order
  return hilbertPoints(order).map((point) => point.y * side + point.x)
}
