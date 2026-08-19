import { useEffect, useRef } from 'react'
import type { Strip, StripPoint, Tile } from '@/lib/cutAndProject'
import { windowPartition } from '@/lib/cutAndProject'

type Props = {
  strip: Strip
  points: readonly StripPoint[]
  tiles: readonly Tile[]
  /** How many points of the sequence to show. */
  count?: number
  width?: number
  height?: number
}

const PADDING = 10
const LONG_COLOR = '#2c5282'
const SHORT_COLOR = '#b45309'
const OTHER_COLOR = '#0f766e'
const LONG_BAND = 'rgba(44, 82, 130, 0.12)'
const SHORT_BAND = 'rgba(180, 83, 9, 0.12)'

/**
 * Distance from the line, point by point along the sequence. Every step slides
 * the value down by the same amount and wraps at the bottom of the window, and
 * the part of the window a point lands in decides its next step.
 */
export default function WindowOrbitPlot({
  strip,
  points,
  tiles,
  count = 160,
  width = 680,
  height = 200,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const muted = rootStyle.getPropertyValue('--text-muted').trim() || '#475569'

    const { low, high, boundary } = windowPartition(strip)
    const shown = points.slice(0, count)

    const plotWidth = width - PADDING * 2
    const plotHeight = height - PADDING * 2
    const toY = (value: number) =>
      PADDING + ((high - value) / (high - low)) * plotHeight
    const toX = (index: number) =>
      PADDING + (index / Math.max(1, shown.length - 1)) * plotWidth

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    const split = Math.min(Math.max(boundary, low), high)
    ctx.fillStyle = LONG_BAND
    ctx.fillRect(PADDING, toY(high), plotWidth, toY(split) - toY(high))
    ctx.fillStyle = SHORT_BAND
    ctx.fillRect(PADDING, toY(split), plotWidth, toY(low) - toY(split))

    ctx.strokeStyle = muted
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(PADDING, toY(split))
    ctx.lineTo(width - PADDING, toY(split))
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = muted
    ctx.font = '11px system-ui, sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText('この上に落ちたら右へ 1 マス', PADDING + 6, toY(high) + 4)
    ctx.textBaseline = 'bottom'
    ctx.fillText('この下に落ちたら上へ 1 マス', PADDING + 6, toY(low) - 4)

    // Steps that do not wrap are drawn: every one of them has the same slope,
    // which is the whole point — the slide is a fixed amount each time.
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = muted
    ctx.lineWidth = 1
    for (let index = 1; index < shown.length; index++) {
      if (shown[index].perpendicular > shown[index - 1].perpendicular) continue
      ctx.beginPath()
      ctx.moveTo(toX(index - 1), toY(shown[index - 1].perpendicular))
      ctx.lineTo(toX(index), toY(shown[index].perpendicular))
      ctx.stroke()
    }
    ctx.restore()

    shown.forEach((point, index) => {
      const tile = tiles[index]
      ctx.fillStyle = !tile
        ? muted
        : tile.label === 'L'
          ? LONG_COLOR
          : tile.label === 'S'
            ? SHORT_COLOR
            : OTHER_COLOR
      ctx.beginPath()
      ctx.arc(toX(index), toY(point.perpendicular), 2.4, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [strip, points, tiles, count, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="chart"
      role="img"
      aria-label="点ごとの直線からの距離と、窓の分かれ方"
    />
  )
}
