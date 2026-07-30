import { useEffect, useRef } from 'react'
import type { ShuffleStep } from '@/lib/riffleShuffle'
import { generateDistinctColors } from '@/lib/riffleShuffle'

type Props = {
  steps: ShuffleStep[]
  width?: number
  cardWidth?: number
  cardHeight?: number
  gap?: number
  colorMode?: 'grayscale' | 'color'
}

function generateGrayscaleColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : i / (count - 1)
    const lightness = 25 + t * 50
    return `hsl(220, 10%, ${lightness}%)`
  })
}

export default function RiffleVisualizer({
  steps,
  width = 780,
  cardWidth = 12,
  cardHeight = 28,
  gap = 2,
  colorMode = 'grayscale',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || steps.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const deckSize = steps[0].deck.length
    const height = steps.length * (cardHeight + gap) + 48
    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    const colors =
      colorMode === 'color'
        ? generateDistinctColors(deckSize)
        : generateGrayscaleColors(deckSize)
    const startX = (width - deckSize * (cardWidth + gap)) / 2

    for (let row = 0; row < steps.length; row++) {
      const step = steps[row]
      const y = 36 + row * (cardHeight + gap)

      ctx.fillStyle = '#616161'
      ctx.font = '12px "Work Sans", system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${step.step}`, startX - 8, y + cardHeight / 2 + 4)

      for (let col = 0; col < deckSize; col++) {
        const card = step.deck[col]
        const x = startX + col * (cardWidth + gap)

        ctx.fillStyle = colors[card.originalIndex]
        ctx.fillRect(x, y, cardWidth, cardHeight)
      }
    }

    ctx.fillStyle = '#9e9e9e'
    ctx.font = '10px "Work Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (let col = 0; col < deckSize; col += 13) {
      const x = startX + col * (cardWidth + gap) + cardWidth / 2
      ctx.fillText(String(col), x, 24)
    }
  }, [steps, width, cardWidth, cardHeight, gap, colorMode])

  return (
    <canvas
      ref={canvasRef}
      className="plot"
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
