import { useEffect, useRef } from 'react'
import type { GaltonState } from '@/lib/galtonBoard'

type Props = {
  state: GaltonState
  rows: number
  width?: number
  boardHeight?: number
  binHeight?: number
}

const BALL_COLOR = '#2c5282'
const BLOCKED_COLOR = '#b45309'
const BIN_COLOR = 'rgba(44, 82, 130, 0.55)'

/**
 * The triangular peg lattice with the balls currently on it, and the bins
 * filling up underneath. A ball is drawn in a warm colour while it is stuck,
 * which is the only visible difference between the two modes on the board.
 */
export default function GaltonBoardView({
  state,
  rows,
  width = 640,
  boardHeight = 300,
  binHeight = 90,
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
    const border = rootStyle.getPropertyValue('--border').trim() || '#cbd5e1'

    const height = boardHeight + binHeight
    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    const spacing = (width * 0.92) / (rows + 1)
    const centerX = width / 2
    const levelGap = boardHeight / (rows + 1)
    const radius = Math.max(2, Math.min(spacing * 0.3, levelGap * 0.35))

    const cellX = (level: number, slot: number) =>
      centerX + (slot - level / 2) * spacing
    const cellY = (level: number) => levelGap * (level + 0.5)

    // Pegs sit between the cells a ball can occupy.
    ctx.fillStyle = border
    for (let level = 0; level < rows; level++) {
      for (let slot = 0; slot <= level; slot++) {
        ctx.beginPath()
        ctx.arc(
          cellX(level, slot),
          cellY(level) + levelGap / 2,
          2,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    }

    const occupied = new Set(
      state.balls.map((ball) => `${ball.level}:${ball.slot}`)
    )
    for (const ball of state.balls) {
      const blockedLeft = occupied.has(`${ball.level + 1}:${ball.slot}`)
      const blockedRight = occupied.has(`${ball.level + 1}:${ball.slot + 1}`)
      ctx.fillStyle =
        blockedLeft && blockedRight && ball.level + 1 < rows
          ? BLOCKED_COLOR
          : BALL_COLOR
      ctx.beginPath()
      ctx.arc(
        cellX(ball.level, ball.slot),
        cellY(ball.level),
        radius,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, boardHeight)
    ctx.lineTo(width, boardHeight)
    ctx.stroke()

    const maxCount = Math.max(1, ...state.bins)
    const barWidth = Math.max(3, spacing * 0.7)
    ctx.fillStyle = BIN_COLOR
    state.bins.forEach((count, bin) => {
      const barHeight = ((binHeight - 18) * count) / maxCount
      ctx.fillRect(
        cellX(rows, bin) - barWidth / 2,
        boardHeight + (binHeight - 18) - barHeight,
        barWidth,
        barHeight
      )
    })

    ctx.fillStyle = muted
    ctx.font = '11px "Work Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    const labelEvery = rows > 14 ? 2 : 1
    state.bins.forEach((_, bin) => {
      if (bin % labelEvery !== 0) return
      ctx.fillText(String(bin), cellX(rows, bin), height - 4)
    })
  }, [state, rows, width, boardHeight, binHeight])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={boardHeight + binHeight}
      className="chart"
    />
  )
}
