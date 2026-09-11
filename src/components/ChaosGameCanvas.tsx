import { useEffect, useRef } from 'react'
import {
  CHAOS_TRIANGLE,
  type ChaosGameStep,
  chaosGameStep,
  randomPointInTriangle,
} from '@/lib/chaosGame'
import type { Point } from '@/lib/point'

type Props = {
  isPlaying: boolean
  pointsPerSecond: number
  pointRadius: number
  resetVersion: number
  onPointCountChange: (count: number) => void
}

type CanvasColors = {
  background: string
  border: string
  line: string
  point: string
  text: string
}

const CANVAS_SIZE = 720
const CANVAS_PADDING = 42
const MAX_STEPS_PER_FRAME = 5000

function canvasColors(): CanvasColors {
  const style = getComputedStyle(document.documentElement)
  return {
    background: style.getPropertyValue('--surface').trim() || '#ffffff',
    border: style.getPropertyValue('--border').trim() || '#cbd5e1',
    line: style.getPropertyValue('--text-light').trim() || '#94a3b8',
    point: style.getPropertyValue('--brand').trim() || '#1e3a5f',
    text: style.getPropertyValue('--text-muted').trim() || '#475569',
  }
}

function toCanvasPoint(point: Point): Point {
  const drawableSize = CANVAS_SIZE - CANVAS_PADDING * 2
  return {
    x: CANVAS_PADDING + point.x * drawableSize,
    y: CANVAS_PADDING + point.y * drawableSize,
  }
}

function prepareCanvas(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D | null {
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = CANVAS_SIZE * ratio
  canvas.height = CANVAS_SIZE * ratio
  const context = canvas.getContext('2d')
  context?.setTransform(ratio, 0, 0, ratio, 0, 0)
  return context
}

function drawTriangle(context: CanvasRenderingContext2D, colors: CanvasColors) {
  const vertices = CHAOS_TRIANGLE.map(toCanvasPoint)
  context.fillStyle = colors.background
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  context.strokeStyle = colors.border
  context.lineWidth = 1.5
  context.beginPath()
  context.moveTo(vertices[0].x, vertices[0].y)
  context.lineTo(vertices[1].x, vertices[1].y)
  context.lineTo(vertices[2].x, vertices[2].y)
  context.closePath()
  context.stroke()
}

function drawPoint(
  context: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  color: string
) {
  const canvasPoint = toCanvasPoint(point)
  context.fillStyle = color
  context.beginPath()
  context.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2)
  context.fill()
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  colors: CanvasColors,
  step: ChaosGameStep | null,
  pointRadius: number
) {
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  if (step) {
    const from = toCanvasPoint(step.from)
    const vertex = toCanvasPoint(step.vertex)
    context.strokeStyle = colors.line
    context.lineWidth = 1.5
    context.setLineDash([6, 6])
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(vertex.x, vertex.y)
    context.stroke()
    context.setLineDash([])
    drawPoint(context, step.next, Math.max(3, pointRadius + 1.5), colors.point)
  }

  context.fillStyle = colors.text
  CHAOS_TRIANGLE.forEach((vertex, index) => {
    const canvasVertex = toCanvasPoint(vertex)
    context.beginPath()
    context.arc(canvasVertex.x, canvasVertex.y, 6, 0, Math.PI * 2)
    context.fill()
    context.font = '600 14px "Work Sans", system-ui, sans-serif'
    context.textAlign = index === 0 ? 'center' : index === 1 ? 'right' : 'left'
    const labelOffset =
      index === 0 ? { x: 0, y: -14 } : { x: index === 1 ? -12 : 12, y: 5 }
    context.fillText(
      String.fromCharCode(65 + index),
      canvasVertex.x + labelOffset.x,
      canvasVertex.y + labelOffset.y
    )
  })
}

export default function ChaosGameCanvas({
  isPlaying,
  pointsPerSecond,
  pointRadius,
  resetVersion,
  onPointCountChange,
}: Props) {
  const plotCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const currentPointRef = useRef<Point | null>(null)
  const pointCountRef = useRef(0)
  const latestStepRef = useRef<ChaosGameStep | null>(null)

  useEffect(() => {
    const plotCanvas = plotCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    if (!plotCanvas || !overlayCanvas) return

    const plotContext = prepareCanvas(plotCanvas)
    const overlayContext = prepareCanvas(overlayCanvas)
    if (!plotContext || !overlayContext) return

    const colors = canvasColors()
    const initialPoint = randomPointInTriangle()
    drawTriangle(plotContext, colors)
    drawPoint(plotContext, initialPoint, pointRadius, colors.point)
    drawOverlay(overlayContext, colors, null, pointRadius)
    currentPointRef.current = initialPoint
    latestStepRef.current = null
    pointCountRef.current = 1
    onPointCountChange(1)
  }, [pointRadius, resetVersion, onPointCountChange])

  useEffect(() => {
    const plotCanvas = plotCanvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    if (!plotCanvas || !overlayCanvas) return
    const plotContext = plotCanvas.getContext('2d')
    const overlayContext = overlayCanvas.getContext('2d')
    if (!plotContext || !overlayContext) return

    const colors = canvasColors()
    if (!isPlaying) {
      drawOverlay(overlayContext, colors, null, pointRadius)
      return
    }

    let animationFrame = 0
    let previousTime: number | null = null
    let stepBudget = 0
    let lastStepTime = 0
    const lineLifetime = Math.max(80, Math.min(650, 450 / pointsPerSecond))

    const animate = (time: number) => {
      if (previousTime === null) previousTime = time
      const elapsed = Math.min(time - previousTime, 100)
      previousTime = time
      stepBudget += (elapsed * pointsPerSecond) / 1000
      const stepCount = Math.min(MAX_STEPS_PER_FRAME, Math.floor(stepBudget))
      stepBudget -= stepCount

      for (let index = 0; index < stepCount; index++) {
        const currentPoint = currentPointRef.current
        if (!currentPoint) break
        const step = chaosGameStep(currentPoint)
        drawPoint(plotContext, step.next, pointRadius, colors.point)
        currentPointRef.current = step.next
        latestStepRef.current = step
        pointCountRef.current += 1
        lastStepTime = time
      }

      const visibleStep =
        time - lastStepTime <= lineLifetime ? latestStepRef.current : null
      drawOverlay(overlayContext, colors, visibleStep, pointRadius)
      if (stepCount > 0) onPointCountChange(pointCountRef.current)
      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isPlaying, pointsPerSecond, pointRadius, onPointCountChange])

  return (
    <div
      className="chaos-canvas"
      role="img"
      aria-label="カオスゲームで点が三角形の中にプロットされるアニメーション"
    >
      <canvas ref={plotCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
      <canvas ref={overlayCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
    </div>
  )
}
