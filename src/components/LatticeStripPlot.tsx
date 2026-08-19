import { useEffect, useRef } from 'react'
import {
  lineNorm,
  type Strip,
  type StripPoint,
  type Tile,
} from '@/lib/cutAndProject'

type Props = {
  strip: Strip
  /** Accepted points, ordered along the line. */
  points: readonly StripPoint[]
  /** Gaps between them, one shorter than `points`. */
  tiles: readonly Tile[]
  /** Lattice columns to draw, i.e. 0 <= x <= columns. */
  columns: number
  showProjection?: boolean
  showStaircase?: boolean
  width?: number
  height?: number
}

const MARGIN = 0.8
const LONG_COLOR = '#2c5282'
const SHORT_COLOR = '#b45309'
const OTHER_COLOR = '#0f766e'

function tileColor(tile: Tile): string {
  if (tile.label === 'L') return LONG_COLOR
  if (tile.label === 'S') return SHORT_COLOR
  return OTHER_COLOR
}

/**
 * The lattice, the line, the strip laid over it, and where the accepted points
 * land once they drop onto the line.
 */
export default function LatticeStripPlot({
  strip,
  points,
  tiles,
  columns,
  showProjection = true,
  showStaircase = false,
  width = 680,
  height = 420,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const brand = rootStyle.getPropertyValue('--brand').trim() || '#1e3a5f'
    const light = rootStyle.getPropertyValue('--text-light').trim() || '#94a3b8'

    const { slope } = strip
    const norm = lineNorm(slope)
    // A perpendicular offset s sits at y = slope * x + s * norm.
    const edgeAt = (x: number, s: number) => slope * x + s * norm
    const lowEdge = strip.offset - strip.width / 2
    const highEdge = strip.offset + strip.width / 2

    const minX = -MARGIN
    const maxX = columns + MARGIN
    const minY = Math.min(edgeAt(minX, lowEdge), edgeAt(maxX, lowEdge)) - MARGIN
    const maxY =
      Math.max(edgeAt(minX, highEdge), edgeAt(maxX, highEdge)) + MARGIN

    // Equal scale on both axes, or the right angle of the drop would be a lie.
    const scale = Math.min(width / (maxX - minX), height / (maxY - minY))
    const originX = (width - (maxX - minX) * scale) / 2 - minX * scale
    const originY = height - (height - (maxY - minY) * scale) / 2 + minY * scale
    const toScreen = (x: number, y: number) => ({
      x: originX + x * scale,
      y: originY - y * scale,
    })

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    const strokeLine = (s: number) => {
      const start = toScreen(minX, edgeAt(minX, s))
      const end = toScreen(maxX, edgeAt(maxX, s))
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    // The strip itself, filled faintly so the lattice stays readable.
    const corners = [
      toScreen(minX, edgeAt(minX, lowEdge)),
      toScreen(maxX, edgeAt(maxX, lowEdge)),
      toScreen(maxX, edgeAt(maxX, highEdge)),
      toScreen(minX, edgeAt(minX, highEdge)),
    ]
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.fillStyle = brand
    ctx.beginPath()
    ctx.moveTo(corners[0].x, corners[0].y)
    for (const corner of corners.slice(1)) ctx.lineTo(corner.x, corner.y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = light
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])
    strokeLine(lowEdge)
    strokeLine(highEdge)
    ctx.setLineDash([])

    ctx.strokeStyle = brand
    ctx.lineWidth = 1.5
    strokeLine(0)

    ctx.fillStyle = light
    for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
      for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
        const screen = toScreen(x, y)
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (showStaircase && points.length > 1) {
      ctx.save()
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = brand
      ctx.lineWidth = 1.5
      ctx.beginPath()
      points.forEach((point, index) => {
        const screen = toScreen(point.lattice.x, point.lattice.y)
        if (index === 0) ctx.moveTo(screen.x, screen.y)
        else ctx.lineTo(screen.x, screen.y)
      })
      ctx.stroke()
      ctx.restore()
    }

    if (showProjection) {
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = light
      ctx.lineWidth = 1
      for (const point of points) {
        const from = toScreen(point.lattice.x, point.lattice.y)
        // The foot of the drop: subtract the perpendicular part.
        const footX = point.lattice.x + (point.perpendicular * slope) / norm
        const to = toScreen(footX, slope * footX)
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }
      ctx.restore()
    }

    // The projected sequence, drawn on the line as the tiles it cuts out.
    ctx.lineWidth = 5
    ctx.lineCap = 'butt'
    tiles.forEach((tile, index) => {
      const from = points[index]
      const to = points[index + 1]
      const fromX = from.lattice.x + (from.perpendicular * slope) / norm
      const toX = to.lattice.x + (to.perpendicular * slope) / norm
      const start = toScreen(fromX, slope * fromX)
      const end = toScreen(toX, slope * toX)
      ctx.strokeStyle = tileColor(tile)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    })

    // A notch of background between neighbouring tiles of the same colour.
    ctx.fillStyle = surface
    for (const point of points) {
      const footX = point.lattice.x + (point.perpendicular * slope) / norm
      const foot = toScreen(footX, slope * footX)
      ctx.beginPath()
      ctx.arc(foot.x, foot.y, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const point of points) {
      const screen = toScreen(point.lattice.x, point.lattice.y)
      ctx.fillStyle = brand
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 3.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [
    strip,
    points,
    tiles,
    columns,
    showProjection,
    showStaircase,
    width,
    height,
  ])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="chart"
      role="img"
      aria-label="格子点と帯、直線に射影された点列"
    />
  )
}
