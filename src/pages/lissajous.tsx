import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import {
  type WaveformType,
  WAVEFORM_LABELS,
  waveforms,
  generateWaveformPoints,
} from '@/lib/lissajous'

const MIN_GRID_SIZE = 3
const MAX_GRID_SIZE = 12
const MIN_CELL_SIZE = 40
const MAX_CELL_SIZE = 120
const CELL_SIZE_STEP = 10
const POINT_COUNT = 16

function useBrandColor(): string {
  return useMemo(() => {
    if (typeof document === 'undefined') return '#1e3a5f'
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--brand')
        .trim() || '#1e3a5f'
    )
  }, [])
}

type LissajousCanvasProps = {
  freqA: number
  freqB: number
  size: number
  speed: number
  waveform: WaveformType
  customWaveform?: number[]
  phase?: number
}

function LissajousCanvas({
  freqA,
  freqB,
  size,
  speed,
  waveform,
  customWaveform,
  phase = 0,
}: LissajousCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef<number>(0)
  const brandColor = useBrandColor()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4
    const waveFn = (t: number) => waveforms.custom(t, customWaveform)

    const animate = () => {
      ctx.clearRect(0, 0, size, size)

      const x = centerX + radius * waveFn(freqA * timeRef.current + phase)
      const y = centerY + radius * waveFn(freqB * timeRef.current)

      ctx.fillStyle = brandColor
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = brandColor
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const px = centerX + radius * waveFn(freqA * t + phase)
        const py = centerY + radius * waveFn(freqB * t)
        if (t === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()

      timeRef.current += 0.02 * speed
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [freqA, freqB, size, speed, waveform, customWaveform, phase, brandColor])

  return <canvas ref={canvasRef} width={size} height={size} className="plot" />
}

type CurveEditorProps = {
  points: number[]
  onChange: (points: number[]) => void
}

function CurveEditor({ points, onChange }: CurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 150 })
  const brandColor = useBrandColor()

  const padding = 20

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setDimensions({ width, height: 150 })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    const borderColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--border')
        .trim() || '#cbd5e1'

    ctx.clearRect(0, 0, width, height)

    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()

    ctx.strokeStyle = brandColor
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((y, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const py = height / 2 - y * (height / 2 - padding)
      if (i === 0) {
        ctx.moveTo(x, py)
      } else {
        ctx.lineTo(x, py)
      }
    })
    ctx.stroke()

    points.forEach((y, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2)
      const py = height / 2 - y * (height / 2 - padding)
      ctx.fillStyle = dragging === i ? '#ff5722' : brandColor
      ctx.beginPath()
      ctx.arc(x, py, 6, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [points, dragging, dimensions, brandColor])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const { width, height } = dimensions

    points.forEach((py, i) => {
      const px = padding + (i / (points.length - 1)) * (width - padding * 2)
      const pointY = height / 2 - py * (height / 2 - padding)
      const dist = Math.sqrt((x - px) ** 2 + (y - pointY) ** 2)
      if (dist < 10) {
        setDragging(i)
      }
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const y = e.clientY - rect.top
    const { height } = dimensions
    const normalized = -(y - height / 2) / (height / 2 - padding)
    const clamped = Math.max(-1, Math.min(1, normalized))

    onChange(points.map((p, i) => (i === dragging ? clamped : p)))
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: dragging !== null ? 'grabbing' : 'pointer',
          width: '100%',
          height: 'auto',
        }}
        className="plot"
      />
    </div>
  )
}

export default function LissajousPage() {
  const [gridSize, setGridSize] = useState(8)
  const [cellSize, setCellSize] = useState(80)
  const [speed, setSpeed] = useState(1)
  const [waveform, setWaveform] = useState<WaveformType>('sine')
  const [phase, setPhase] = useState(0)
  const [customWaveform, setCustomWaveform] = useState<number[]>(() =>
    generateWaveformPoints('sine', POINT_COUNT)
  )

  useEffect(() => {
    const calculateCellSize = () => {
      const windowWidth = window.innerWidth
      const padding = 80
      const headerWidth = 40
      const gapSize = 4
      const availableWidth = windowWidth - padding
      const nextCellSize = Math.floor(
        (availableWidth - headerWidth - (gridSize + 1) * gapSize) / gridSize
      )
      const clampedSize = Math.max(
        MIN_CELL_SIZE,
        Math.min(MAX_CELL_SIZE, nextCellSize)
      )
      setCellSize(clampedSize)
    }

    calculateCellSize()
    window.addEventListener('resize', calculateCellSize)
    return () => window.removeEventListener('resize', calculateCellSize)
  }, [gridSize])

  useEffect(() => {
    setCustomWaveform(generateWaveformPoints(waveform, POINT_COUNT))
  }, [waveform])

  const gridTemplateColumns = useMemo(
    () => `40px repeat(${gridSize}, ${cellSize}px)`,
    [gridSize, cellSize]
  )

  return (
    <Layout title="Lissajous Curve Grid - Math KB">
      <div className="container">
        <h1 className="page-title">Lissajous Curve Grid</h1>
        <PageTags pageId="lissajous" />
        <p className="page-lead">
          2
          つの直交する調和振動を合成してできる曲線です。周波数比と位相差によって、さまざまな幾何学的な図形が現れます。
        </p>

        <section className="section">
          <h2 className="section-title">定義</h2>
          <p className="section-text">
            波形関数 <Tex tex="f(t)" />
            、振幅 <Tex tex="A, B" />
            、周波数 <Tex tex="a, b" />
            、位相差 <Tex tex="\delta" />{' '}
            を用いて、リサジュー曲線は次のように表されます。
          </p>
          <div className="formula">
            <Tex
              tex="x(t) = A \, f(a t + \delta), \quad y(t) = B \, f(b t)"
              display
            />
          </div>
          <p className="section-text">
            以下のグリッドでは、行方向の周波数を <Tex tex="a" />
            、列方向の周波数を <Tex tex="b" /> として、周波数比{' '}
            <Tex tex="a:b" /> に対応する曲線を並べています。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">コントロール</h2>

          <div className="slider-row">
            <label className="slider-label">
              グリッドサイズ
              <input
                type="range"
                min={MIN_GRID_SIZE}
                max={MAX_GRID_SIZE}
                step={1}
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">
                {gridSize}×{gridSize}
              </span>
            </label>
          </div>

          <div className="slider-row">
            <label className="slider-label">
              セルサイズ
              <input
                type="range"
                min={MIN_CELL_SIZE}
                max={MAX_CELL_SIZE}
                step={CELL_SIZE_STEP}
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{cellSize}px</span>
            </label>
          </div>

          <div className="slider-row">
            <label className="slider-label">
              アニメーション速度
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{speed.toFixed(1)}x</span>
            </label>
          </div>

          <div className="slider-row">
            <label className="slider-label">
              位相差
              <input
                type="range"
                min={0}
                max={Math.PI * 2}
                step={0.01}
                value={phase}
                onChange={(e) => setPhase(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">
                {(phase / Math.PI).toFixed(2)}π
              </span>
            </label>
          </div>

          <div className="slider-row">
            <span className="slider-label">波形</span>
            <div className="segment">
              {(Object.keys(WAVEFORM_LABELS) as WaveformType[]).map((key) => (
                <Fragment key={key}>
                  <input
                    type="radio"
                    name="waveform"
                    id={`waveform-${key}`}
                    checked={waveform === key}
                    onChange={() => setWaveform(key)}
                  />
                  <label htmlFor={`waveform-${key}`}>
                    {WAVEFORM_LABELS[key]}
                  </label>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="section" style={{ marginBottom: 0 }}>
            <h3
              className="section-title"
              style={{ fontSize: 'var(--font-size-2)' }}
            >
              波形エディタ
            </h3>
            <p className="section-text">
              点をドラッグして波形を変形できます。選択中の波形をベースに編集を始められます。
            </p>
            <CurveEditor points={customWaveform} onChange={setCustomWaveform} />
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">周波数比グリッド</h2>
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns,
                gap: '4px',
                width: 'fit-content',
                marginInline: 'auto',
              }}
            >
              <div />
              {Array.from({ length: gridSize }).map((_, col) => (
                <div
                  key={`col-${col}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-1)',
                  }}
                >
                  {col + 1}
                </div>
              ))}

              {Array.from({ length: gridSize }).map((_, row) => (
                <Fragment key={row}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontSize: 'var(--font-size-1)',
                    }}
                  >
                    {row + 1}
                  </div>
                  {Array.from({ length: gridSize }).map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      style={{
                        borderRadius: 'var(--radius-2)',
                        overflow: 'hidden',
                      }}
                    >
                      <LissajousCanvas
                        freqA={row + 1}
                        freqB={col + 1}
                        size={cellSize}
                        speed={speed}
                        waveform={waveform}
                        customWaveform={customWaveform}
                        phase={phase}
                      />
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">補足</h2>
          <p className="section-text">
            リサジュー曲線はオシロスコープや合成音声の可視化などでも使われます。周波数比が有理数のときは閉じた図形になり、無理数のときは空間を埋めるような軌跡を描きます。
          </p>
        </section>
      </div>
    </Layout>
  )
}
