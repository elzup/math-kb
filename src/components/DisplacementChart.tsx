import { useEffect, useRef } from 'react'

type Props = {
  /** perm[slot] = original deck position of the card landing in that slot. */
  perm: readonly number[]
  height?: number
}

const WIDTH = 800

export default function DisplacementChart({ perm, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const border = rootStyle.getPropertyValue('--border').trim() || '#e2e8f0'
    const brand = rootStyle.getPropertyValue('--brand').trim() || '#1e3a5f'

    const displacements = perm.map((from, slot) => Math.abs(from - slot))
    const peak = Math.max(1, ...displacements)
    const slotWidth = WIDTH / perm.length

    ctx.clearRect(0, 0, WIDTH, height)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, WIDTH, height)

    ctx.strokeStyle = border
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(WIDTH, y)
      ctx.stroke()
    }

    ctx.fillStyle = brand
    displacements.forEach((distance, slot) => {
      const barHeight = (distance / peak) * (height - 4)
      ctx.fillRect(
        slot * slotWidth,
        height - barHeight,
        Math.max(slotWidth, 1),
        barHeight
      )
    })
  }, [perm, height])

  return (
    <canvas ref={canvasRef} width={WIDTH} height={height} className="chart" />
  )
}
