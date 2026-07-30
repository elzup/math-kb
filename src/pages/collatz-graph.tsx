import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import { buildCollatzTree } from '@/lib/collatzGraph'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540
const MARGIN = { top: 24, right: 24, bottom: 48, left: 64 }

export default function CollatzGraphPage() {
  const [depth, setDepth] = useState(50)
  const [maxValue, setMaxValue] = useState(100)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { plots, subplots, counts } = useMemo(
    () => buildCollatzTree({ depth, maxY: maxValue }),
    [depth, maxValue]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rootStyle = getComputedStyle(document.documentElement)
    const brand = rootStyle.getPropertyValue('--brand').trim() || '#1e3a5f'
    const textLight =
      rootStyle.getPropertyValue('--text-light').trim() || '#94a3b8'
    const surface = rootStyle.getPropertyValue('--surface').trim() || '#ffffff'
    const text = rootStyle.getPropertyValue('--text').trim() || '#0f172a'

    ctx.fillStyle = surface
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const plotWidth = CANVAS_WIDTH - MARGIN.left - MARGIN.right
    const plotHeight = CANVAS_HEIGHT - MARGIN.top - MARGIN.bottom
    const xScale = plotWidth / (depth - 1)
    const yScale = plotHeight / maxValue

    const toX = (level: number) => MARGIN.left + level * xScale
    const toY = (value: number) => MARGIN.top + plotHeight - value * yScale

    // grid
    ctx.strokeStyle = textLight
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const y = MARGIN.top + (i / 5) * plotHeight
      ctx.moveTo(MARGIN.left, y)
      ctx.lineTo(MARGIN.left + plotWidth, y)
    }
    for (let i = 0; i <= 6; i++) {
      const x = MARGIN.left + (i / 6) * plotWidth
      ctx.moveTo(x, MARGIN.top)
      ctx.lineTo(x, MARGIN.top + plotHeight)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // axes
    ctx.strokeStyle = text
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(MARGIN.left, MARGIN.top)
    ctx.lineTo(MARGIN.left, MARGIN.top + plotHeight)
    ctx.lineTo(MARGIN.left + plotWidth, MARGIN.top + plotHeight)
    ctx.stroke()

    // labels
    ctx.fillStyle = text
    ctx.font = '12px "Work Sans", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i <= 6; i++) {
      const level = Math.round((i / 6) * (depth - 1))
      const x = MARGIN.left + (i / 6) * plotWidth
      ctx.fillText(String(level), x, MARGIN.top + plotHeight + 8)
    }

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 5; i++) {
      const value = Math.round(maxValue - (i / 5) * maxValue)
      const y = MARGIN.top + (i / 5) * plotHeight
      ctx.fillText(String(value), MARGIN.left - 10, y)
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('レベル', MARGIN.left + plotWidth / 2, CANVAS_HEIGHT - 20)

    ctx.save()
    ctx.translate(16, MARGIN.top + plotHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('数値', 0, 0)
    ctx.restore()

    // plot points
    const displayedPlots = plots.filter((p) => p.y <= maxValue)

    for (const p of displayedPlots) {
      const x = toX(p.x)
      const y = toY(p.y)

      ctx.globalAlpha = 0.12
      ctx.strokeStyle = brand
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(MARGIN.left + plotWidth, y)
      ctx.stroke()

      ctx.globalAlpha = 1
      ctx.fillStyle = brand
      ctx.beginPath()
      ctx.arc(x, y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const p of subplots) {
      const x = toX(p.x)
      const y = toY(p.y)
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [plots, subplots, depth, maxValue])

  const uniqueCount = Object.keys(counts).length
  const displayedPlotCount = plots.filter((p) => p.y <= maxValue).length

  return (
    <Layout title="Collatz Graph - Math KB">
      <div className="container">
        <h1 className="page-title">Collatz Graph</h1>
        <PageTags pageId="collatz-graph" />
        <p className="page-lead">
          コラッツ予想に現れる数の逆方向探索木を可視化します。各レベルで Collatz
          写像の逆像をたどり、数がどのように出現するかをプロットします。
        </p>

        <section className="section">
          <h2 className="section-title">定義</h2>
          <p className="section-text">
            正の整数 <Tex tex="n" /> に対する Collatz
            写像は次のように定義されます。
          </p>
          <div className="formula">
            <Tex
              tex="f(n) = \\begin{cases} n/2 & (n \\text{ が偶数}) \\\\ 3n+1 & (n \\text{ が奇数}) \\end{cases}"
              display
            />
          </div>
          <p className="section-text">
            <strong>コラッツ予想</strong>
            は、任意の正の整数から出発してこの操作を繰り返すと、必ず{' '}
            <Tex tex="1" /> に到達し <Tex tex="4 \\to 2 \\to 1" />{' '}
            のループに入るという未解決問題です。
          </p>
          <p className="section-text">
            数 <Tex tex="k" /> の逆像は <Tex tex="2k" /> と、
            <Tex tex="k \\equiv 1 \\pmod 3" /> のとき <Tex tex="(k-1)/3" />{' '}
            です。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              先行木の可視化
            </h2>
            <label className="slider-label">
              深さ
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{depth}</span>
            </label>
            <label className="slider-label">
              表示上限
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={maxValue}
                onChange={(e) => setMaxValue(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{maxValue}</span>
            </label>
          </div>

          <div className="flex-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="plot"
              style={{ width: '100%', maxWidth: 960, height: 'auto' }}
            />
          </div>

          <p
            className="section-text"
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span>
              <span style={{ color: 'var(--brand)' }}>●</span> 初出ノード
            </span>
            <span>
              <span style={{ color: '#ef4444' }}>●</span>{' '}
              再出現ノード（表示上限内）
            </span>
            <span>
              <span style={{ color: 'var(--brand)' }}>—</span>{' '}
              初出ノードから右への水平線
            </span>
          </p>

          <p className="section-text center">
            ユニークな数: <span className="numeric">{uniqueCount}</span> /{' '}
            表示中の初出: <span className="numeric">{displayedPlotCount}</span>{' '}
            / 再出現: <span className="numeric">{subplots.length}</span>
          </p>
        </section>
      </div>
    </Layout>
  )
}
