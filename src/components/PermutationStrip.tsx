import { useEffect, useRef } from 'react'
import { deckColor } from '@/lib/deckColor'

type Props = {
  /** Original deck position of the card now sitting at each slot. */
  values: readonly number[]
  /** Draw only the first n slots; the rest are left blank. */
  visibleCount?: number
  markIndex?: number | null
  height?: number
}

const WIDTH = 800

export default function PermutationStrip({
  values,
  visibleCount = values.length,
  markIndex = null,
  height = 56,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const text = rootStyle.getPropertyValue('--text').trim() || '#0f172a'

    const slotWidth = WIDTH / values.length
    const shown = Math.min(Math.max(visibleCount, 0), values.length)

    ctx.clearRect(0, 0, WIDTH, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, WIDTH, height)

    for (let slot = 0; slot < shown; slot++) {
      ctx.fillStyle = deckColor(values[slot], values.length)
      // Overdraw by a hair so sub-pixel slots do not leave seams.
      ctx.fillRect(slot * slotWidth, 0, slotWidth + 0.5, height)
    }

    if (markIndex !== null && markIndex >= 0 && markIndex < values.length) {
      ctx.strokeStyle = text
      ctx.lineWidth = 2
      ctx.strokeRect(
        markIndex * slotWidth - 1,
        1,
        Math.max(slotWidth + 2, 3),
        height - 2
      )
    }
  }, [values, visibleCount, markIndex, height])

  return (
    <canvas ref={canvasRef} width={WIDTH} height={height} className="chart" />
  )
}
