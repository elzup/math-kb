import { useEffect, useRef } from 'react'
import { type DeckColorMode, deckColor } from '@/lib/deckColor'

type Props = {
  /** One row per shuffle: `steps[k][slot]` is the card's original position. */
  steps: readonly (readonly number[])[]
  colorMode?: DeckColorMode
  width?: number
  rowHeight?: number
  gap?: number
}

const LABEL_GUTTER = 34
const TOP_MARGIN = 8

export default function ShuffleStackPlot({
  steps,
  colorMode = 'grayscale',
  width = 780,
  rowHeight = 22,
  gap = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || steps.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const muted = rootStyle.getPropertyValue('--text-muted').trim() || '#616161'

    const deckSize = steps[0].length
    const slotWidth = (width - LABEL_GUTTER) / deckSize
    const height = steps.length * (rowHeight + gap) + TOP_MARGIN

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    // Thin rows cannot carry a readable label on every line.
    const labelEvery =
      rowHeight >= 14 ? 1 : rowHeight >= 6 ? 5 : Math.ceil(steps.length / 20)

    ctx.font = '12px "Work Sans", system-ui, sans-serif'
    ctx.textAlign = 'right'

    steps.forEach((deck, row) => {
      const y = TOP_MARGIN + row * (rowHeight + gap)

      if (row % labelEvery === 0) {
        ctx.fillStyle = muted
        ctx.fillText(`${row}`, LABEL_GUTTER - 8, y + rowHeight / 2 + 4)
      }

      for (let slot = 0; slot < deckSize; slot++) {
        ctx.fillStyle = deckColor(deck[slot], deckSize, colorMode)
        // Overdraw by a hair so sub-pixel slots do not leave seams.
        ctx.fillRect(
          LABEL_GUTTER + slot * slotWidth,
          y,
          slotWidth + 0.5,
          rowHeight
        )
      }
    })
  }, [steps, colorMode, width, rowHeight, gap])

  return (
    <canvas
      ref={canvasRef}
      className="plot"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
