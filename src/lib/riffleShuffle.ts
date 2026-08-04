import {
  identityPermutation,
  isIdentity,
  type Permutation,
  permutationOrbit,
} from './permutation'

export type ShuffleStep = {
  step: number
  deck: number[]
  risingSequenceCount: number
}

function perfectShufflePermutation(size: number, startWith: 'left' | 'right') {
  if (size % 2 !== 0) {
    throw new Error('Perfect shuffle requires an even deck size')
  }

  const half = size / 2
  const [first, second] = startWith === 'left' ? [0, half] : [half, 0]

  return identityPermutation(size).map((slot) =>
    slot % 2 === 0 ? first + slot / 2 : second + (slot - 1) / 2
  )
}

/** Out-shuffle: the top card stays on top. */
export function perfectOutPermutation(size: number): number[] {
  return perfectShufflePermutation(size, 'left')
}

/** In-shuffle: the top card moves one place down. */
export function perfectInPermutation(size: number): number[] {
  return perfectShufflePermutation(size, 'right')
}

/**
 * Number of runs that are still in the original order when the deck is read
 * from the top. A perfect shuffle at most doubles it; back at the start it is 1.
 */
export function countRisingSequences(deck: Permutation): number {
  if (deck.length === 0) return 0

  const positions = new Array<number>(deck.length)
  for (let slot = 0; slot < deck.length; slot++) {
    positions[deck[slot]] = slot
  }

  let count = 1
  for (let card = 1; card < positions.length; card++) {
    if (positions[card] < positions[card - 1]) count++
  }

  return count
}

/**
 * Every deck state from the start until the shuffle brings it back.
 * `cycleLength` is -1 when `maxSteps` ran out first.
 */
export function simulateUntilReturn(perm: Permutation, maxSteps = 10000) {
  const states = permutationOrbit(perm, maxSteps)
  const returned = states.length > 1 && isIdentity(states[states.length - 1])

  return {
    cycleLength: returned ? states.length - 1 : -1,
    steps: states.map<ShuffleStep>((deck, step) => ({
      step,
      deck,
      risingSequenceCount: countRisingSequences(deck),
    })),
  }
}
