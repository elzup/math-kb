/**
 * A shuffle written as a permutation: `perm[slot]` is the position the card now
 * sitting in `slot` started from. Riffle shuffles and the Hilbert-curve shuffle
 * are both expressed this way so they can share the machinery below.
 */
export type Permutation = readonly number[]

export function identityPermutation(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i)
}

export function applyPermutation<T>(
  items: readonly T[],
  perm: Permutation
): T[] {
  return perm.map((from) => items[from])
}

/** Apply the same permutation `times` times. */
export function applyPermutationTimes<T>(
  items: readonly T[],
  perm: Permutation,
  times: number
): T[] {
  let result = [...items]
  for (let i = 0; i < times; i++) {
    result = applyPermutation(result, perm)
  }
  return result
}

export function isIdentity(perm: Permutation): boolean {
  return perm.every((from, slot) => from === slot)
}

/**
 * Deck states from the starting order up to and including the return to it.
 * `orbit[k]` is the deck after k shuffles. Stops early at `maxSteps`, so the
 * last entry is only the original order when the deck actually got back there.
 */
export function permutationOrbit(perm: Permutation, maxSteps = 10000) {
  const states: number[][] = [identityPermutation(perm.length)]

  for (let step = 1; step <= maxSteps; step++) {
    const next = applyPermutation(states[step - 1], perm)
    states.push(next)
    if (isIdentity(next)) break
  }

  return states
}

/** Disjoint cycles of the permutation, each listed from its smallest member. */
export function permutationCycles(perm: Permutation): number[][] {
  const seen = new Array<boolean>(perm.length).fill(false)
  const cycles: number[][] = []

  for (let start = 0; start < perm.length; start++) {
    if (seen[start]) continue

    const cycle: number[] = []
    let position = start
    while (!seen[position]) {
      seen[position] = true
      cycle.push(position)
      position = perm[position]
    }
    cycles.push(cycle)
  }

  return cycles
}

function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b)
}

/**
 * How many repeats restore the original order — the lcm of the cycle lengths.
 * An lcm of cycle lengths can exceed Number.MAX_SAFE_INTEGER for larger decks,
 * so it is accumulated as a bigint.
 */
export function permutationOrder(perm: Permutation): bigint {
  return permutationCycles(perm).reduce((acc, cycle) => {
    const length = BigInt(cycle.length)
    return (acc / gcd(acc, length)) * length
  }, 1n)
}

/** How far each card travels, by slot. */
export function permutationDisplacements(perm: Permutation): number[] {
  return perm.map((from, slot) => Math.abs(from - slot))
}

export type PermutationStats = {
  size: number
  cycleCount: number
  longestCycle: number
  fixedPoints: number
  order: bigint
  maxDisplacement: number
  meanDisplacement: number
}

export function permutationStats(perm: Permutation): PermutationStats {
  const cycles = permutationCycles(perm)
  const displacements = permutationDisplacements(perm)

  return {
    size: perm.length,
    cycleCount: cycles.length,
    longestCycle: Math.max(...cycles.map((cycle) => cycle.length)),
    fixedPoints: cycles.filter((cycle) => cycle.length === 1).length,
    order: permutationOrder(perm),
    maxDisplacement: Math.max(...displacements),
    meanDisplacement:
      displacements.reduce((sum, d) => sum + d, 0) / displacements.length,
  }
}
