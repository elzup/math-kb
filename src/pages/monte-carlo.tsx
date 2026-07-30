import { Fragment, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import PointPlot from '@/components/PointPlot'
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

        <div className="grid-2">
          <section className="section">
            <div className="slider-row">
              <h2 className="section-title" style={{ margin: 0 }}>
                ランダム（1 試行）
              </h2>
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="button button-secondary"
              >
                別シード
              </button>
            </div>
            <div className="flex-center">
              <PointPlot
                points={randomPoints}
                width={280}
                height={280}
                pointSize={2}
                color="#9e9e9e"
              />
            </div>
            <p className="section-text center">
              推定誤差:{' '}
              <span className="numeric">{randomError.toFixed(5)}</span>
            </p>
          </section>

          <section className="section">
            <h2 className="section-title">Halton Sequence</h2>
            <div className="flex-center">
              <PointPlot
                points={haltonPoints}
                width={280}
                height={280}
                pointSize={2}
                color="#795548"
              />
            </div>
            <p className="section-text center">
              推定誤差:{' '}
              <span className="numeric">{haltonError.toFixed(5)}</span>
            </p>
          </section>
        </div>

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
