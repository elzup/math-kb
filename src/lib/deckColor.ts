export type DeckColorMode = 'color' | 'grayscale'

/**
 * Map a deck position to a stable colour so that a shuffle shows up as the
 * gradient getting mixed. The colour scale stops short of a full turn
 * (0-330deg) so the first and last cards stay distinguishable.
 */
export function deckColor(
  index: number,
  size: number,
  mode: DeckColorMode = 'color'
): string {
  const t = index / Math.max(1, size - 1)

  if (mode === 'grayscale') return `hsl(220, 10%, ${25 + t * 50}%)`

  return `hsl(${330 * t}, 72%, 52%)`
}
