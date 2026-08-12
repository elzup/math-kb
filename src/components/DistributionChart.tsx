import { useEffect, useRef } from 'react'

export type DistributionSeries = {
  label: string
  color: string
  probs: readonly number[]
  dashed?: boolean
}

type Props = {
  /** Drawn as bars behind the series, e.g. the exact binomial. */
  reference: readonly number[]
  referenceLabel: string
  series: DistributionSeries[]
  width?: number
  height?: number
}

const PADDING = { top: 20, right: 16, bottom: 34, left: 56 }
const REFERENCE_FILL = 'rgba(148, 163, 184, 0.35)'

/** Probability per bin: reference as bars, each series as a marked polyline. */
export default function DistributionChart({
  reference,
  referenceLabel,
  series,
  width = 640,
  height = 320,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reference.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const muted = rootStyle.getPropertyValue('--text-muted').trim() || '#475569'
    const border = rootStyle.getPropertyValue('--border').trim() || '#cbd5e1'

    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom
    const bins = reference.length
    const peak = Math.max(
      ...reference,
      ...series.flatMap((line) => [...line.probs])
    )
    const maxY = peak * 1.15

    const binX = (bin: number) =>
      PADDING.left + ((bin + 0.5) / bins) * chartWidth
    const valueY = (p: number) =>
      PADDING.top + chartHeight - (p / maxY) * chartHeight

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.font = '11px "Work Sans", system-ui, sans-serif'
    ctx.fillStyle = muted
    ctx.textAlign = 'right'

    const tickStep = maxY > 0.2 ? 0.05 : 0.02
    for (let tick = 0; tick <= maxY; tick += tickStep) {
      const y = valueY(tick)
      ctx.beginPath()
      ctx.moveTo(PADDING.left, y)
      ctx.lineTo(width - PADDING.right, y)
      ctx.stroke()
      ctx.fillText(tick.toFixed(2), PADDING.left - 8, y + 4)
    }

    const barWidth = (chartWidth / bins) * 0.7
    ctx.fillStyle = REFERENCE_FILL
    reference.forEach((p, bin) => {
      const y = valueY(p)
      ctx.fillRect(
        binX(bin) - barWidth / 2,
        y,
        barWidth,
        PADDING.top + chartHeight - y
      )
    })

    ctx.textAlign = 'center'
    ctx.fillStyle = muted
    const labelEvery = bins > 16 ? 2 : 1
    reference.forEach((_, bin) => {
      if (bin % labelEvery !== 0) return
      ctx.fillText(String(bin), binX(bin), height - PADDING.bottom + 16)
    })

    for (const line of series) {
      ctx.strokeStyle = line.color
      ctx.lineWidth = 2
      ctx.setLineDash(line.dashed ? [5, 4] : [])
      ctx.beginPath()
      line.probs.forEach((p, bin) => {
        const x = binX(bin)
        const y = valueY(p)
        if (bin === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      if (line.dashed) continue
      ctx.fillStyle = line.color
      line.probs.forEach((p, bin) => {
        ctx.beginPath()
        ctx.arc(binX(bin), valueY(p), 2.5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    ctx.textAlign = 'left'
    const legendX = PADDING.left + 12
    const entries = [
      { label: referenceLabel, color: REFERENCE_FILL, bar: true },
      ...series.map((line) => ({
        label: line.label,
        color: line.color,
        bar: false,
      })),
    ]
    entries.forEach((entry, index) => {
      const y = PADDING.top + 4 + index * 16
      if (entry.bar) {
        ctx.fillStyle = entry.color
        ctx.fillRect(legendX, y - 6, 16, 8)
      } else {
        ctx.strokeStyle = entry.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(legendX, y - 2)
        ctx.lineTo(legendX + 16, y - 2)
        ctx.stroke()
      }
      ctx.fillStyle = muted
      ctx.fillText(entry.label, legendX + 22, y + 2)
    })
  }, [reference, referenceLabel, series, width, height])

  return (
    <canvas ref={canvasRef} width={width} height={height} className="chart" />
  )
}
