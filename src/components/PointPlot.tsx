import { useEffect, useRef } from 'react'
import type { Point2D } from '@/lib/lowDiscrepancy'

type Props = {
  points: Point2D[]
  width?: number
  height?: number
  pointSize?: number
  color?: string
  grid?: boolean
}

export default function PointPlot({
  points,
  width = 400,
  height = 400,
  pointSize = 2,
  color = '#795548',
  grid = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    if (grid) {
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const t = (i / 4) * width
        ctx.beginPath()
        ctx.moveTo(t, 0)
        ctx.lineTo(t, height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, t)
        ctx.lineTo(width, t)
        ctx.stroke()
      }
    }

    ctx.fillStyle = color
    for (const p of points) {
      const x = p.x * width
      const y = (1 - p.y) * height
      ctx.beginPath()
      ctx.arc(x, y, pointSize, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [points, width, height, pointSize, color, grid])

  return (
    <canvas ref={canvasRef} width={width} height={height} className="plot" />
  )
}
