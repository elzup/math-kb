import { useEffect, useRef } from 'react'
import { deckColor } from '@/lib/deckColor'
import { boundsOf, type Point, unionBounds } from '@/lib/point'

type Props = {
  points: readonly Point[]
  /** `gradient` shades along the walk; `halves` splits it at the midpoint. */
  mode?: 'gradient' | 'halves'
  /** The step before this one, drawn faintly underneath. */
  ghost?: readonly Point[]
  showGhost?: boolean
  size?: number
}

const PADDING = 16
const MAX_BANDS = 256

export default function PolylinePlot({
  points,
  mode = 'gradient',
  ghost,
  showGhost = false,
  size = 460,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || points.length < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const brand = rootStyle.getPropertyValue('--brand').trim() || '#1e3a5f'
    const muted = rootStyle.getPropertyValue('--text-muted').trim() || '#64748b'

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, size, size)

    // These curves wander wherever they like, so fit whatever they occupy. The
    // ghost is always included so toggling it cannot shift the framing.
    const bounds =
      ghost && ghost.length > 1
        ? unionBounds(boundsOf(points), boundsOf(ghost))
        : boundsOf(points)
    const spanX = Math.max(1, bounds.maxX - bounds.minX)
    const spanY = Math.max(1, bounds.maxY - bounds.minY)
    const scale = (size - PADDING * 2) / Math.max(spanX, spanY)
    const offsetX = (size - spanX * scale) / 2
    const offsetY = (size - spanY * scale) / 2

    // y grows upwards, matching how the template editor presents coordinates.
    const project = (point: Point) => ({
      x: offsetX + (point.x - bounds.minX) * scale,
      y: offsetY + (bounds.maxY - point.y) * scale,
    })

    const strokePath = (path: readonly Point[], from: number, to: number) => {
      ctx.beginPath()
      const head = project(path[from])
      ctx.moveTo(head.x, head.y)
      for (let i = from + 1; i <= to; i++) {
        const { x, y } = project(path[i])
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    if (showGhost && ghost && ghost.length > 1) {
      ctx.save()
      ctx.strokeStyle = muted
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.45
      ctx.setLineDash([6, 4])
      strokePath(ghost, 0, ghost.length - 1)
      ctx.restore()
    }

    const segments = points.length - 1
    const bands = mode === 'halves' ? 2 : Math.min(segments, MAX_BANDS)

    ctx.lineWidth = Math.max(1, Math.min(3, scale / 2))

    // One path per colour band keeps tens of thousands of segments fast to draw.
    for (let band = 0; band < bands; band++) {
      const start = Math.floor((segments * band) / bands)
      const end = Math.floor((segments * (band + 1)) / bands)

      ctx.strokeStyle =
        mode === 'halves'
          ? band === 0
            ? brand
            : '#ef4444'
          : deckColor(band, bands)

      strokePath(points, start, end)
    }
  }, [points, mode, ghost, showGhost, size])

  return <canvas ref={canvasRef} width={size} height={size} className="plot" />
}
