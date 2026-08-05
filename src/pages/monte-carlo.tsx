import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import ConvergenceChart from '@/components/ConvergenceChart'
import {
  haltonSequence,
  randomSequence,
  estimateQuarterCircleArea,
  piEstimateError,
  runConvergenceExperiment,
} from '@/lib/lowDiscrepancy'

const SAMPLE_COUNT = 1024
const MAX_COUNT = 5000
const TRIAL_OPTIONS = [10, 50, 100]

export default function MonteCarloPage() {
  const [seed, setSeed] = useState(0)
  const [trials, setTrials] = useState(50)

  const randomPoints = useMemo(() => randomSequence(SAMPLE_COUNT), [seed])
  const haltonPoints = useMemo(() => haltonSequence(SAMPLE_COUNT), [])
  const convergence = useMemo(
    () => runConvergenceExperiment(MAX_COUNT, 100, trials),
    [trials]
  )

  const randomEstimate = estimateQuarterCircleArea(randomPoints) * 4
  const haltonEstimate = estimateQuarterCircleArea(haltonPoints) * 4
  const randomError = piEstimateError(estimateQuarterCircleArea(randomPoints))
  const haltonError = piEstimateError(estimateQuarterCircleArea(haltonPoints))

  return (
    <Layout title="Monte Carlo Convergence - Math KB">
      <div className="container">
        <h1 className="page-title">Monte Carlo 収束速度比較</h1>
        <PageTags pageId="monte-carlo" />
        <p className="page-lead">
          同じ点数でランダムな点列と Halton 数列を使って <Tex tex="\\pi" />{' '}
          を推定します。低差異数列は、ランダムサンプリングの平均的な振る舞いと比べて、より速く収束します。
        </p>

        <section className="section">
          <h2 className="section-title">問題設定</h2>
          <p className="section-text">
            単位正方形 <Tex tex="[0,1]^2" />{' '}
            内に一様に点を打ち、単位円内に入る点の割合から <Tex tex="\\pi" />{' '}
            を推定します。
          </p>
          <div className="formula">
            <Tex
              tex="\\pi \\approx 4 \\times \\frac{\\text{単位円内の点数}}{\\text{全点数}}"
              display
            />
          </div>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              同じ点数での推定誤差
            </h2>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="button button-secondary"
            >
              別シード
            </button>
          </div>
          <p className="section-text">
            どちらも {SAMPLE_COUNT} 点を使った 1
            回の推定です。ランダムはシードごとに揺れますが、Halton
            数列は決定論的なので何度実行しても同じ値になります。
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>点列</th>
                <th className="numeric">推定値</th>
                <th className="numeric">誤差</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ランダム</td>
                <td className="numeric">{randomEstimate.toFixed(5)}</td>
                <td className="numeric">{randomError.toFixed(5)}</td>
              </tr>
              <tr>
                <td>Halton</td>
                <td className="numeric">{haltonEstimate.toFixed(5)}</td>
                <td className="numeric">{haltonError.toFixed(5)}</td>
              </tr>
            </tbody>
          </table>
          <p className="section-text">
            点そのものの分布と、格子で測った一様性の指標は{' '}
            <Link href="/halton" className="link">
              Halton Sequence
            </Link>{' '}
            を参照してください。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              収束速度
            </h2>
            <div className="segment">
              {TRIAL_OPTIONS.map((value) => (
                <Fragment key={value}>
                  <input
                    type="radio"
                    name="trials"
                    id={`trials-${value}`}
                    checked={trials === value}
                    onChange={() => setTrials(value)}
                  />
                  <label htmlFor={`trials-${value}`}>{value} 回</label>
                </Fragment>
              ))}
            </div>
          </div>
          <ConvergenceChart data={convergence} />
          <p className="section-text">
            グラフは {trials}{' '}
            回のランダム試行の平均（実線）と標準偏差の範囲（帯）を示しています。個別のランダム試行では
            Halton より良い結果になることもありますが、平均的には Halton
            の誤差が小さくなります。
          </p>
        </section>
      </div>
    </Layout>
  )
}
