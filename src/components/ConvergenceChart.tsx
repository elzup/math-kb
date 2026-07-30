import { useEffect, useRef } from 'react'
import type { ConvergenceStats } from '@/lib/lowDiscrepancy'

type Props = {
  data: ConvergenceStats[]
  width?: number
  height?: number
}

const PADDING = { top: 24, right: 24, bottom: 40, left: 64 }
const RANDOM_COLOR = '#9e9e9e'
const HALTON_COLOR = '#795548'

export default function ConvergenceChart({
  data,
  width = 640,
  height = 360,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    const minN = data[0].n
    const maxN = data[data.length - 1].n
    const maxError = Math.max(data[0].randomMax, data[0].halton)
    const minError =
      Math.min(data[data.length - 1].randomMin, data[data.length - 1].halton) *
      0.5

    const logX = (n: number) =>
      PADDING.left +
      ((Math.log10(n) - Math.log10(minN)) /
        (Math.log10(maxN) - Math.log10(minN))) *
        chartWidth

    const logY = (error: number) =>
      PADDING.top +
      ((Math.log10(maxError) - Math.log10(error)) /
        (Math.log10(maxError) - Math.log10(minError))) *
        chartHeight

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.font = '12px "Work Sans", system-ui, sans-serif'
    ctx.fillStyle = '#616161'
    ctx.textAlign = 'right'

    const yTicks = [0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001]
    for (const tick of yTicks) {
      if (tick > maxError || tick < minError) continue
      const y = logY(tick)
      ctx.beginPath()
      ctx.moveTo(PADDING.left, y)
      ctx.lineTo(width - PADDING.right, y)
      ctx.stroke()
      ctx.fillText(tick.toString(), PADDING.left - 8, y + 4)
    }

    ctx.textAlign = 'center'
    const xTicks = [100, 200, 500, 1000, 2000, 5000]
    for (const tick of xTicks) {
      if (tick < minN || tick > maxN) continue
      const x = logX(tick)
      ctx.beginPath()
      ctx.moveTo(x, PADDING.top)
      ctx.lineTo(x, height - PADDING.bottom)
      ctx.stroke()
      ctx.fillText(tick.toString(), x, height - PADDING.bottom + 18)
    }

    const drawBand = (
      upper: (p: ConvergenceStats) => number,
      lower: (p: ConvergenceStats) => number,
      color: string
    ) => {
      ctx.fillStyle = color
      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const p = data[i]
        const x = logX(p.n)
        const y = logY(upper(p))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = data.length - 1; i >= 0; i--) {
        const p = data[i]
        const x = logX(p.n)
        const y = logY(lower(p))
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    }

    drawBand(
      (p) => p.randomMax,
      (p) => p.randomMin,
      'rgba(158, 158, 158, 0.12)'
    )
    drawBand(
      (p) => p.randomMean + p.randomStdDev,
      (p) => p.randomMean - p.randomStdDev,
      'rgba(158, 158, 158, 0.25)'
    )

    const drawLine = (
      value: (p: ConvergenceStats) => number,
      color: string
    ) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const p = data[i]
        const x = logX(p.n)
        const y = logY(value(p))
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    drawLine((p) => p.randomMean, RANDOM_COLOR)
    drawLine((p) => p.halton, HALTON_COLOR)

    ctx.font = 'bold 12px "Work Sans", system-ui, sans-serif'
    ctx.textAlign = 'left'

    ctx.fillStyle = '#212121'
    ctx.fillText('random mean', width - PADDING.right - 100, PADDING.top + 12)
    ctx.strokeStyle = RANDOM_COLOR
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width - PADDING.right - 30, PADDING.top + 8)
    ctx.lineTo(width - PADDING.right - 10, PADDING.top + 8)
    ctx.stroke()

    ctx.fillStyle = 'rgba(158, 158, 158, 0.25)'
    ctx.fillRect(width - PADDING.right - 30, PADDING.top + 14, 20, 8)
    ctx.fillStyle = '#212121'
    ctx.font = '12px "Work Sans", system-ui, sans-serif'
    ctx.fillText(
      'random std dev',
      width - PADDING.right - 100,
      PADDING.top + 22
    )

    ctx.font = 'bold 12px "Work Sans", system-ui, sans-serif'
    ctx.fillStyle = '#212121'
    ctx.fillText('Halton', width - PADDING.right - 100, PADDING.top + 38)
    ctx.strokeStyle = HALTON_COLOR
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width - PADDING.right - 30, PADDING.top + 34)
    ctx.lineTo(width - PADDING.right - 10, PADDING.top + 34)
    ctx.stroke()
  }, [data, width, height])

  return (
    <canvas ref={canvasRef} width={width} height={height} className="chart" />
  )
}
