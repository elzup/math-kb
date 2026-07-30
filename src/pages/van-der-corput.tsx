import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import PointPlot from '@/components/PointPlot'
import { vanDerCorput } from '@/lib/lowDiscrepancy'

const PREVIEW_BASES = [2, 3, 5]

function formatFraction(n: number, base: number, digits: number): string {
  const value = vanDerCorput(n, base)
  return value.toFixed(digits)
}

export default function VanDerCorputPage() {
  const [count, setCount] = useState(256)
  const [tableBase, setTableBase] = useState(2)

  const pointsByBase = useMemo(() => {
    return PREVIEW_BASES.map((base) => ({
      base,
      points: Array.from({ length: count }, (_, i) => ({
        x: vanDerCorput(i, base),
        y: (i + 0.5) / count,
      })),
    }))
  }, [count])

  const sampleRows = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      n: i,
      values: PREVIEW_BASES.map((base) => formatFraction(i, base, 4)),
    }))
  }, [])

  return (
    <Layout title="Van der Corput Sequence - Math KB">
      <div className="container">
        <h1 className="page-title">Van der Corput Sequence</h1>
        <PageTags pageId="van-der-corput" />
        <p className="page-lead">
          非整数 <Tex tex="n" /> を底 <Tex tex="b" />{' '}
          で表したときの桁を逆順に並べ、小数点以下に置いた数列です。これは 1
          次元の低差異数列として、モンテカルロ法の代替となる疑似モンテカルロ法（quasi-Monte
          Carlo）で使われます。
        </p>

        <section className="section">
          <h2 className="section-title">定義</h2>
          <p className="section-text">
            非負整数 <Tex tex="n" /> を底 <Tex tex="b" /> で展開します。
          </p>
          <div className="formula">
            <Tex
              tex="n = d_m b^m + d_{m-1} b^{m-1} + \\cdots + d_1 b + d_0"
              display
            />
          </div>
          <p className="section-text">
            このとき Van der Corput 数列の項は次のように定義されます。
          </p>
          <div className="formula">
            <Tex
              tex="x_n = \\frac{d_0}{b} + \\frac{d_1}{b^2} + \\cdots + \\frac{d_m}{b^{m+1}}"
              display
            />
          </div>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              分布の可視化
            </h2>
            <label className="slider-label">
              点数
              <input
                type="range"
                min={32}
                max={1024}
                step={32}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{count}</span>
            </label>
          </div>
          <div className="grid-3">
            {pointsByBase.map(({ base, points }) => (
              <div key={base} className="center">
                <p className="section-text">
                  base <Tex tex={`b=${base}`} />
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
              最初の項
            </h2>
            <select
              value={tableBase}
              onChange={(e) => setTableBase(Number(e.target.value))}
              className="select"
            >
              {PREVIEW_BASES.map((base) => (
                <option key={base} value={base}>
                  base {base}
                </option>
              ))}
            </select>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>n</th>
                <th>digits</th>
                <th className="numeric">
                  <Tex tex="x_n" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row) => {
                const baseIndex = PREVIEW_BASES.indexOf(tableBase)
                const digits = row.n.toString(tableBase)
                return (
                  <tr key={row.n}>
                    <td className="numeric">{row.n}</td>
                    <td className="numeric">{digits}</td>
                    <td className="numeric">{row.values[baseIndex]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  )
}
