import { useEffect, useRef } from 'react'
import type { Tile } from '@/lib/cutAndProject'

type Props = {
  tiles: readonly Tile[]
  /** Draw the L / S letter inside each tile that is wide enough for it. */
  showLetters?: boolean
  width?: number
  height?: number
}

const LONG_COLOR = '#2c5282'
const SHORT_COLOR = '#b45309'
const OTHER_COLOR = '#0f766e'
const MIN_LETTER_WIDTH = 14

function tileColor(tile: Tile): string {
  if (tile.label === 'L') return LONG_COLOR
  if (tile.label === 'S') return SHORT_COLOR
  return OTHER_COLOR
}

/** The projected sequence flattened to one line: each gap becomes a tile. */
export default function TileStrip({
  tiles,
  showLetters = false,
  width = 680,
  height = 44,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const surface =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--surface')
        .trim() || '#ffffff'

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, width, height)

    const total = tiles.reduce((sum, tile) => sum + tile.length, 0)
    if (total <= 0) return

    const scale = width / total
    ctx.font = '600 12px var(--font-mono, monospace)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let cursor = 0
    for (const tile of tiles) {
      const span = tile.length * scale
      ctx.fillStyle = tileColor(tile)
      // A hairline gap keeps neighbouring tiles of one colour apart.
      ctx.fillRect(cursor, 0, Math.max(span - 1, 0.6), height)

      if (showLetters && span >= MIN_LETTER_WIDTH) {
        ctx.fillStyle = '#ffffff'
        ctx.fillText(tile.label, cursor + span / 2, height / 2 + 1)
      }
      cursor += span
    }
  }, [tiles, showLetters, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="chart"
      role="img"
      aria-label="射影された点列のタイル並び"
    />
  )
}
