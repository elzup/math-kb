import { Fragment, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import PointPlot from '@/components/PointPlot'
import {
  gridDiscrepancy,
  haltonSequence,
  randomSequence,
} from '@/lib/lowDiscrepancy'

const BASE_PAIRS = [
  { x: 2, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: 5 },
]

const GRID_OPTIONS = [4, 8, 16]

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export default function HaltonPage() {
  const [count, setCount] = useState(256)
  const [gridCount, setGridCount] = useState(8)
  const [randomSeed, setRandomSeed] = useState(0)

  const plots = useMemo(() => {
    return BASE_PAIRS.map(({ x, y }) => ({
      bases: { x, y },
      points: haltonSequence(count, x, y),
    }))
  }, [count])

  const stats = useMemo(() => {
    const randomPoints = randomSequence(count)
    return BASE_PAIRS.map(({ x, y }) => {
      const haltonPoints = haltonSequence(count, x, y)
      return {
        bases: { x, y },
        halton: gridDiscrepancy(haltonPoints, gridCount),
        random: gridDiscrepancy(randomPoints, gridCount),
      }
    })
  }, [count, gridCount, randomSeed])

  return (
    <Layout title="Halton Sequence - Math KB">
      <div className="container">
        <h1 className="page-title">Halton Sequence</h1>
        <PageTags pageId="halton" />
        <p className="page-lead">
          Halton 数列は、互いに素な 2 つの底を使った Van der Corput
          数列を組み合わせた 2
          次元の低差異数列です。一見ランダムに見える点が、実は均一に分布するように設計されています。
        </p>

        <section className="section">
          <h2 className="section-title">定義</h2>
          <p className="section-text">
            底 <Tex tex="b_1, b_2" /> が互いに素なとき、Halton
            数列は次のように定義されます。
          </p>
          <div className="formula">
            <Tex
              tex="P_n = \\bigl( \\phi_{b_1}(n), \\phi_{b_2}(n) \\bigr)"
              display
            />
          </div>
          <p className="section-text">
            ここで <Tex tex="\\phi_b(n)" /> は底 <Tex tex="b" /> の Van der
            Corput 数列です。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              2D 分布の比較
            </h2>
            <label className="slider-label">
              点数
              <input
                type="range"
                min={64}
                max={1024}
                step={64}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{count}</span>
            </label>
          </div>
          <div className="grid-3">
            {plots.map(({ bases, points }) => (
              <div key={`${bases.x}-${bases.y}`} className="center">
                <p className="section-text">
                  <Tex tex={`b_x=${bases.x}, b_y=${bases.y}`} />
                </p>
                <PointPlot
                  points={points}
                  width={260}
                  height={260}
                  pointSize={2}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              均一性の確認
            </h2>
            <div className="segment">
              {GRID_OPTIONS.map((size) => (
                <Fragment key={size}>
                  <input
                    type="radio"
                    name="grid"
                    id={`grid-${size}`}
                    checked={gridCount === size}
                    onChange={() => setGridCount(size)}
                  />
                  <label htmlFor={`grid-${size}`}>
                    {size}×{size}
                  </label>
                </Fragment>
              ))}
            </div>
            <button
              onClick={() => setRandomSeed((s) => s + 1)}
              className="button button-secondary"
            >
              ランダム再生成
            </button>
          </div>
          <p className="section-text">
            単位正方形を <Tex tex={`${gridCount} \\times ${gridCount}`} />{' '}
            のグリッドで分割し、各セルに入る点数のばらつきを比較します。値が小さいほど均一です。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>底の組み合わせ</th>
                  <th className="numeric">最大偏差</th>
                  <th className="numeric">標準偏差</th>
                  <th className="numeric">空セル数</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ bases, halton, random }) => (
                  <Fragment key={`${bases.x}-${bases.y}`}>
                    <tr>
                      <td>
                        Halton <Tex tex={`(${bases.x}, ${bases.y})`} />
                      </td>
                      <td className="numeric">
                        {formatPercent(halton.maxDeviation)}
                      </td>
                      <td className="numeric">
                        {formatPercent(halton.stdDev)}
                      </td>
                      <td className="numeric">{halton.emptyCells}</td>
                    </tr>
                    <tr>
                      <td>
                        Random <Tex tex={`(${bases.x}, ${bases.y})`} />
                      </td>
                      <td className="numeric">
                        {formatPercent(random.maxDeviation)}
                      </td>
                      <td className="numeric">
                        {formatPercent(random.stdDev)}
                      </td>
                      <td className="numeric">{random.emptyCells}</td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="warning">
          <h2 className="warning-title">注意点</h2>
          <p className="warning-text">
            底の組み合わせが互いに素でないと、点が規則的な格子状に並んでしまい、一様性が損なわれます。通常は異なる素数を選びます。
          </p>
        </section>
      </div>
    </Layout>
  )
}
