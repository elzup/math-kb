import { useEffect, useRef } from 'react'
import { deckColor } from '@/lib/deckColor'
import type { Point } from '@/lib/hilbertCurve'

type Props = {
  points: readonly Point[]
  order: number
  /** How many steps of the curve have been walked so far. */
  progress?: number
  size?: number
}

export default function HilbertCurvePlot({
  points,
  order,
  progress = points.length,
  size = 420,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const border = rootStyle.getPropertyValue('--border').trim() || '#e2e8f0'
    const text = rootStyle.getPropertyValue('--text').trim() || '#0f172a'

    const side = 2 ** order
    const cell = size / side
    const walked = Math.min(Math.max(progress, 0), points.length)

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, size, size)

    // Cells are laid out row-major, so the rainbow reads left to right, top to
    // bottom. Cells the curve has not reached yet stay washed out.
    points.forEach((point, step) => {
      const rowMajor = point.y * side + point.x
      ctx.globalAlpha = step < walked ? 1 : 0.18
      ctx.fillStyle = deckColor(rowMajor, points.length)
      ctx.fillRect(point.x * cell, point.y * cell, cell, cell)
    })
    ctx.globalAlpha = 1

    if (side <= 16) {
      ctx.strokeStyle = border
      ctx.lineWidth = 1
      for (let i = 0; i <= side; i++) {
        const t = i * cell
        ctx.beginPath()
        ctx.moveTo(t, 0)
        ctx.lineTo(t, size)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, t)
        ctx.lineTo(size, t)
        ctx.stroke()
      }
    }

    const center = (point: Point) => ({
      x: point.x * cell + cell / 2,
      y: point.y * cell + cell / 2,
    })

    ctx.strokeStyle = text
    ctx.lineWidth = Math.max(1, cell / 8)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    points.slice(0, walked).forEach((point, step) => {
      const { x, y } = center(point)
      if (step === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    const head = points[walked - 1]
    if (head) {
      const { x, y } = center(head)
      ctx.fillStyle = text
      ctx.beginPath()
      ctx.arc(x, y, Math.max(2.5, cell / 4), 0, Math.PI * 2)
      ctx.fill()
    }
  }, [points, order, progress, size])

  return <canvas ref={canvasRef} width={size} height={size} className="plot" />
}
