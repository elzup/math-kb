import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Template } from '@/lib/edgeRewrite'
import type { Point } from '@/lib/point'

type Props = {
  template: Template
  onChange: (template: Template) => void
  snap?: boolean
  width?: number
  height?: number
}

/** Local coordinates on show: the segment runs (0,0) to (1,0) with room around. */
const VIEW = { minX: -0.2, maxX: 1.2, minY: -0.7, maxY: 0.7 }
const SNAP_STEP = 1 / 12
const GRAB_RADIUS = 0.06

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function TemplateEditor({
  template,
  onChange,
  snap = true,
  width = 520,
  height = 300,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const toCanvas = (point: Point) => ({
      x: ((point.x - VIEW.minX) / (VIEW.maxX - VIEW.minX)) * width,
      y: ((VIEW.maxY - point.y) / (VIEW.maxY - VIEW.minY)) * height,
    })

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const border = rootStyle.getPropertyValue('--border').trim() || '#e2e8f0'
    const muted = rootStyle.getPropertyValue('--text-muted').trim() || '#64748b'
    const brand = rootStyle.getPropertyValue('--brand').trim() || '#1e3a5f'

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    for (let gx = 0; gx <= 12; gx++) {
      const { x } = toCanvas({ x: gx * SNAP_STEP, y: 0 })
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let gy = -8; gy <= 8; gy++) {
      const { y } = toCanvas({ x: 0, y: gy * SNAP_STEP })
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // The segment being replaced, for reference.
    ctx.save()
    ctx.strokeStyle = muted
    ctx.setLineDash([6, 4])
    ctx.lineWidth = 2
    const from = toCanvas({ x: 0, y: 0 })
    const to = toCanvas({ x: 1, y: 0 })
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()

    ctx.strokeStyle = brand
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    template.forEach((point, i) => {
      const { x, y } = toCanvas(point)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    template.forEach((point, i) => {
      const { x, y } = toCanvas(point)
      const isEnd = i === 0 || i === template.length - 1

      ctx.beginPath()
      ctx.arc(x, y, i === dragIndex ? 9 : 6, 0, Math.PI * 2)
      ctx.fillStyle = isEnd ? muted : brand
      ctx.fill()
      ctx.strokeStyle = surface
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [template, dragIndex, width, height])

  const toLocal = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratioX = (event.clientX - rect.left) / rect.width
    const ratioY = (event.clientY - rect.top) / rect.height

    return {
      x: VIEW.minX + ratioX * (VIEW.maxX - VIEW.minX),
      y: VIEW.maxY - ratioY * (VIEW.maxY - VIEW.minY),
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const local = toLocal(event)

    // Endpoints are pinned, so only the interior points can be grabbed.
    let nearest: number | null = null
    let nearestDistance = GRAB_RADIUS
    for (let i = 1; i < template.length - 1; i++) {
      const distance = Math.hypot(
        template[i].x - local.x,
        template[i].y - local.y
      )
      if (distance < nearestDistance) {
        nearest = i
        nearestDistance = distance
      }
    }

    if (nearest === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragIndex(nearest)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragIndex === null) return

    const local = toLocal(event)
    const snapped = snap
      ? {
          x: Math.round(local.x / SNAP_STEP) * SNAP_STEP,
          y: Math.round(local.y / SNAP_STEP) * SNAP_STEP,
        }
      : local

    onChange(
      template.map((point, i) =>
        i === dragIndex
          ? {
              x: clamp(snapped.x, VIEW.minX, VIEW.maxX),
              y: clamp(snapped.y, VIEW.minY, VIEW.maxY),
            }
          : point
      )
    )
  }

  const handlePointerUp = () => setDragIndex(null)

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="plot"
      style={{ maxWidth: '100%', height: 'auto', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
}
