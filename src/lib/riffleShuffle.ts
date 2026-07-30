export type Card = {
  originalIndex: number
  currentIndex: number
}

export type Deck = Card[]

export type ShuffleStep = {
  step: number
  deck: Deck
  risingSequenceCount: number
}

export function countRisingSequences(deck: Deck): number {
  if (deck.length === 0) return 0

  const positions = new Array(deck.length)
  for (let i = 0; i < deck.length; i++) {
    positions[deck[i].originalIndex] = i
  }

  let count = 1
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] < positions[i - 1]) {
      count++
    }
  }

  return count
}

function interleavePerfect(
  left: Deck,
  right: Deck,
  startWith: 'left' | 'right'
): Deck {
  const result: Deck = []
  const half = left.length
  for (let i = 0; i < half; i++) {
    if (startWith === 'left') {
      result.push(left[i])
      result.push(right[i])
    } else {
      result.push(right[i])
      result.push(left[i])
    }
  }
  return result
}

export function perfectOutShuffle(deck: Deck): Deck {
  const n = deck.length
  if (n % 2 !== 0) {
    throw new Error('Perfect shuffle requires an even deck size')
  }
  const half = n / 2
  const left = deck.slice(0, half)
  const right = deck.slice(half)
  return interleavePerfect(left, right, 'left')
}

export function perfectInShuffle(deck: Deck): Deck {
  const n = deck.length
  if (n % 2 !== 0) {
    throw new Error('Perfect shuffle requires an even deck size')
  }
  const half = n / 2
  const left = deck.slice(0, half)
  const right = deck.slice(half)
  return interleavePerfect(left, right, 'right')
}

export function isOriginalOrder(deck: Deck): boolean {
  return deck.every((card, index) => card.originalIndex === index)
}

export function simulateUntilReturn(
  shuffle: (deck: Deck) => Deck,
  deckSize: number,
  maxSteps = 10000
): { cycleLength: number; steps: ShuffleStep[] } {
  let deck: Deck = Array.from({ length: deckSize }, (_, i) => ({
    originalIndex: i,
    currentIndex: i,
  }))

  const steps: ShuffleStep[] = [
    {
      step: 0,
      deck: deck.map((card, i) => ({ ...card, currentIndex: i })),
      risingSequenceCount: countRisingSequences(deck),
    },
  ]

  for (let step = 1; step <= maxSteps; step++) {
    deck = shuffle(deck)
    steps.push({
      step,
      deck: deck.map((card, i) => ({ ...card, currentIndex: i })),
      risingSequenceCount: countRisingSequences(deck),
    })
    if (isOriginalOrder(deck)) {
      return { cycleLength: step, steps }
    }
  }

  return { cycleLength: -1, steps }
}

export function generateDistinctColors(count: number): string[] {
  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const hue = Math.round((i / count) * 360)
    colors.push(`hsl(${hue}, 70%, 55%)`)
  }
  return colors
}
