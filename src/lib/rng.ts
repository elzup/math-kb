/**
 * mulberry32 in pure form: the state is a value, not a closure, so a
 * simulation step can stay a pure function of its input state and still be
 * bit-for-bit reproducible across reruns.
 */
export type RngState = number

export type RngDraw = {
  value: number
  state: RngState
}

export function seedRng(seed: number): RngState {
  return seed | 0
}

/** Uniform value in [0, 1) together with the state that follows it. */
export function nextRandom(state: RngState): RngDraw {
  const advanced = (state + 0x6d2b79f5) | 0
  let t = advanced
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: advanced }
}
