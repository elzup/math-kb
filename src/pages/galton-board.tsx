import Link from 'next/link'
import {
  Fragment,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import CountSlider from '@/components/CountSlider'
import DistributionChart from '@/components/DistributionChart'
import GaltonBoardView from '@/components/GaltonBoardView'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import {
  binomialPmf,
  chiSquareTest,
  histogramMoments,
  maxCdfGap,
  normalApproxPmf,
} from '@/lib/distribution'
import {
  DEFAULT_HOP_PROBABILITY,
  type GaltonOptions,
  type Injection,
  initialGaltonState,
  runGaltonBoard,
  stepGaltonBoard,
} from '@/lib/galtonBoard'

type Mode = 'sequential' | 'crowded'

const ANIMATION_BALLS = 500
const SPEED_OPTIONS = [1, 4, 16]
const APPROXIMATION_ROWS = [8, 16, 32, 64, 128, 256, 512]

const SEQUENTIAL_COLOR = '#2c5282'
const CROWDED_COLOR = '#b45309'
const NORMAL_COLOR = '#0f766e'

const toInjection = (mode: Mode, releaseInterval: number): Injection =>
  mode === 'sequential' ? 'sequential' : releaseInterval

function formatPValue(p: number): string {
  if (p >= 0.001) return p.toFixed(4)
  return p.toExponential(2)
}

export default function GaltonBoardPage() {
  const [rows, setRows] = useState(12)
  const [balls, setBalls] = useState(4000)
  const [releaseInterval, setReleaseInterval] = useState(1)
  const [mode, setMode] = useState<Mode>('crowded')
  const [speed, setSpeed] = useState(4)
  const [seed, setSeed] = useState(1)
  const [playing, setPlaying] = useState(true)

  const animationOptions = useMemo<GaltonOptions>(
    () => ({
      rows,
      balls: ANIMATION_BALLS,
      seed,
      injection: toInjection(mode, releaseInterval),
    }),
    [rows, seed, mode, releaseInterval]
  )

  const [boardState, setBoardState] = useState(() =>
    initialGaltonState(animationOptions)
  )

  useEffect(() => {
    setBoardState(initialGaltonState(animationOptions))
  }, [animationOptions])

  const optionsRef = useRef(animationOptions)
  optionsRef.current = animationOptions
  const ticksPerFrame = mode === 'sequential' ? speed * 3 : speed

  const finished = boardState.done

  useEffect(() => {
    if (!playing || finished) return
    let frame = 0

    const advance = () => {
      setBoardState((current) => {
        let next = current
        for (let i = 0; i < ticksPerFrame && !next.done; i++) {
          next = stepGaltonBoard(next, optionsRef.current)
        }
        return next
      })
      frame = requestAnimationFrame(advance)
    }

    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  }, [playing, finished, ticksPerFrame])

  // The statistics run is heavy, so let the sliders stay responsive.
  const deferredRows = useDeferredValue(rows)
  const deferredBalls = useDeferredValue(balls)
  const deferredInterval = useDeferredValue(releaseInterval)

  const exactPmf = useMemo(() => binomialPmf(deferredRows), [deferredRows])
  const normalPmf = useMemo(() => normalApproxPmf(deferredRows), [deferredRows])

  const sequentialRun = useMemo(
    () =>
      runGaltonBoard({
        rows: deferredRows,
        balls: deferredBalls,
        seed,
        injection: 'sequential',
      }),
    [deferredRows, deferredBalls, seed]
  )

  const crowdedRun = useMemo(
    () =>
      runGaltonBoard({
        rows: deferredRows,
        balls: deferredBalls,
        seed,
        injection: deferredInterval,
      }),
    [deferredRows, deferredBalls, deferredInterval, seed]
  )

  const summaries = useMemo(
    () =>
      [
        { label: '単発', run: sequentialRun, color: SEQUENTIAL_COLOR },
        { label: '干渉', run: crowdedRun, color: CROWDED_COLOR },
      ].map(({ label, run, color }) => {
        const probs = run.bins.map((count) => count / deferredBalls)
        return {
          label,
          color,
          probs,
          blockedSteps: run.blockedSteps,
          moments: histogramMoments(run.bins),
          gap: maxCdfGap(probs, exactPmf),
          chi: chiSquareTest(run.bins, exactPmf),
        }
      }),
    [sequentialRun, crowdedRun, deferredBalls, exactPmf]
  )

  const approximation = useMemo(
    () =>
      APPROXIMATION_ROWS.map((n) => {
        const gap = maxCdfGap(binomialPmf(n), normalApproxPmf(n))
        return { n, gap, scaled: gap * n }
      }),
    []
  )

  const liveTotal = boardState.bins.reduce((sum, count) => sum + count, 0)

  return (
    <Layout title="Galton Board - Math KB">
      <div className="container">
        <h1 className="page-title">ゴルトンボードと正規分布</h1>
        <PageTags pageId="galton-board" />
        <p className="page-lead">
          釘の列に玉を落とすと、山型の分布ができます。玉を 1
          個ずつ落とすときの落ち先は <Tex tex={'\\mathrm{Binomial}(n, 1/2)'} />{' '}
          そのもので、段数を増やすと正規分布に近づきます。ここでは玉を 1
          個ずつ早送りで落とす場合と、玉同士がぶつかり合うほど詰め込んだ場合を、
          <Tex tex={'\\chi^2'} /> 適合度検定で区別します。
        </p>

        <section className="section">
          <h2 className="section-title">1 個ずつ落とすときの厳密な分布</h2>
          <p className="section-text">
            <Tex tex={'n'} /> 段の釘を通る玉は、各段で左右のどちらかに 1/2
            ずつで分かれます。右に折れた回数を <Tex tex={'X'} />{' '}
            とすると、落ちる樋の番号がそのまま <Tex tex={'X'} /> です。
          </p>
          <div className="formula">
            <Tex
              tex={
                'P(X = k) = \\binom{n}{k} 2^{-n}, \\quad k = 0, 1, \\ldots, n'
              }
              display
            />
          </div>
          <p className="section-text">
            平均は <Tex tex={'n/2'} />
            、分散は <Tex tex={'n/4'} />{' '}
            です。これは近似ではなく厳密な値で、シミュレーションはこの分布に一致しなければなりません。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">盤面</h2>
          <p className="section-text">
            玉は釘の上で跳ねる時間がばらつくため、各ティックで確率{' '}
            {DEFAULT_HOP_PROBABILITY} で 1
            段下に進み、そうでなければその場に留まります。1 つのセルに入れる玉は
            1 個までで、行き先が両方とも埋まっている玉は進めません
            (この状態を橙色で描いています)。
          </p>
          <div className="slider-row">
            <div className="segment">
              {(
                [
                  ['sequential', '単発早送り'],
                  ['crowded', '同時投入 (干渉あり)'],
                ] as const
              ).map(([value, label]) => (
                <Fragment key={value}>
                  <input
                    type="radio"
                    name="mode"
                    id={`mode-${value}`}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <label htmlFor={`mode-${value}`}>{label}</label>
                </Fragment>
              ))}
            </div>
            <div className="segment">
              {SPEED_OPTIONS.map((value) => (
                <Fragment key={value}>
                  <input
                    type="radio"
                    name="speed"
                    id={`speed-${value}`}
                    checked={speed === value}
                    onChange={() => setSpeed(value)}
                  />
                  <label htmlFor={`speed-${value}`}>×{value}</label>
                </Fragment>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="button button-secondary"
            >
              {playing ? '一時停止' : '再生'}
            </button>
            <button
              type="button"
              onClick={() =>
                setBoardState(initialGaltonState(animationOptions))
              }
              className="button button-secondary"
            >
              最初から
            </button>
          </div>
          <CountSlider
            label="段数 n"
            value={rows}
            min={4}
            max={18}
            onChange={setRows}
            readout={`${rows} 段`}
          />
          {mode === 'crowded' ? (
            <CountSlider
              label="投入間隔"
              value={releaseInterval}
              min={1}
              max={8}
              onChange={setReleaseInterval}
              readout={`${releaseInterval} ティックごと`}
            />
          ) : null}
          <GaltonBoardView state={boardState} rows={rows} />
          <p className="section-text">
            投入 {boardState.released} / {ANIMATION_BALLS} 個、到達 {liveTotal}{' '}
            個、盤上 {boardState.balls.length} 個、詰まった回数{' '}
            {boardState.blockedSteps} 回
            {finished ? '。すべて落ちきりました。' : '。'}
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">2 つのモードの分布</h2>
          <p className="section-text">
            下のグラフは {deferredBalls}{' '}
            個を最後まで落としきった結果です。灰色の棒が厳密な二項分布、破線が正規近似です。単発は棒にほぼ重なり、干渉ありは中央が削れて裾が持ち上がります。
          </p>
          <CountSlider
            label="玉数"
            value={balls}
            min={1000}
            max={8000}
            step={500}
            onChange={setBalls}
            readout={`${balls} 個`}
          />
          <DistributionChart
            reference={exactPmf}
            referenceLabel="厳密な二項分布"
            series={[
              {
                label: '正規近似',
                color: NORMAL_COLOR,
                probs: normalPmf,
                dashed: true,
              },
              ...summaries.map((summary) => ({
                label: summary.label,
                color: summary.color,
                probs: summary.probs,
              })),
            ]}
          />
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              厳密な検証
            </h2>
            <button
              type="button"
              onClick={() => setSeed((value) => value + 1)}
              className="button button-secondary"
            >
              別シード
            </button>
          </div>
          <p className="section-text">
            観測度数 <Tex tex={'O_k'} /> と、厳密な二項分布から決まる期待度数{' '}
            <Tex tex={'E_k = N \\binom{n}{k} 2^{-n}'} /> を Pearson の{' '}
            <Tex tex={'\\chi^2'} /> 統計量で比べます。期待度数が 5
            未満の樋は隣とまとめてから計算し、母数を推定していないので自由度は
            (まとめたあとの区間数) <Tex tex={'- 1'} /> です。
          </p>
          <div className="formula">
            <Tex tex={'\\chi^2 = \\sum_k \\frac{(O_k - E_k)^2}{E_k}'} display />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>指標</th>
                <th className="numeric">理論値</th>
                {summaries.map((summary) => (
                  <th key={summary.label} className="numeric">
                    {summary.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>平均</td>
                <td className="numeric">{(deferredRows / 2).toFixed(3)}</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.moments.mean.toFixed(3)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>分散</td>
                <td className="numeric">{(deferredRows / 4).toFixed(3)}</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.moments.variance.toFixed(3)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>最大 CDF 差</td>
                <td className="numeric">0</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.gap.toFixed(4)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>
                  <Tex tex={'\\chi^2'} /> 統計量
                </td>
                <td className="numeric">—</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.chi.statistic.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>自由度</td>
                <td className="numeric">—</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.chi.df}
                  </td>
                ))}
              </tr>
              <tr>
                <td>
                  <Tex tex={'p'} /> 値
                </td>
                <td className="numeric">—</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {formatPValue(summary.chi.pValue)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>詰まった回数</td>
                <td className="numeric">0</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.blockedSteps}
                  </td>
                ))}
              </tr>
              <tr>
                <td>判定 (有意水準 1 %)</td>
                <td className="numeric">—</td>
                {summaries.map((summary) => (
                  <td key={summary.label} className="numeric">
                    {summary.chi.pValue < 0.01 ? '棄却' : '棄却できない'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="section-text">
            単発は <Tex tex={'p'} />{' '}
            値が大きく、二項分布と矛盾しません。干渉ありは玉数を増やすほど{' '}
            <Tex tex={'p'} /> 値が 0
            に落ちます。「別シード」で何度引き直しても、この向きは変わりません。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">なぜ干渉すると崩れるのか</h2>
          <p className="section-text">
            二項分布が出るための仮定は、各段の左右が確率 1/2
            で、しかも互いに独立、という 2 点だけです。玉が詰まると{' '}
            <em>空いている側にしか行けない</em> ため、その 1 回の分岐は確率 1/2
            ではなくなり、しかも「どちらが空いているか」は他の玉の位置で決まるので、独立性も同時に壊れます。
          </p>
          <p className="section-text">
            混雑は中央で最も強く起きます。玉が集まるのは中央だからです。結果として中央から押し出された玉が裾に回り、分布は二項分布より平たくなります
            — 分散が <Tex tex={'n/4'} />{' '}
            より大きくなるのがその現れです。投入間隔を広げるほど詰まりが減り、分布は二項分布に戻ります。
          </p>
          <p className="section-text">
            なお、釘の上での滞留そのものは分布を変えません。滞留は「いつ着くか」を変えるだけで「どこに着くか」は変えないからです。滞留がなければ全部の玉が毎ティック
            1 段ずつ落ち、同じ段に 2
            個並ぶことすらありません。滞留は、玉同士を出会わせるための仕掛けです。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">二項分布から正規分布への誤差</h2>
          <p className="section-text">
            段数を増やすと二項分布は正規分布に近づきます (de Moivre–Laplace
            の定理)。整数 <Tex tex={'k'} /> を区間{' '}
            <Tex tex={'[k - 1/2,\\, k + 1/2]'} />{' '}
            とみなす連続性補正を入れて、両者の CDF
            の最大差を測ったのが下の表です。
          </p>
          <div className="formula">
            <Tex
              tex={
                'P(X \\le k) \\approx \\Phi\\!\\left(\\frac{k + 1/2 - n/2}{\\sqrt{n/4}}\\right)'
              }
              display
            />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th className="numeric">n</th>
                <th className="numeric">最大 CDF 差</th>
                <th className="numeric">n × 最大 CDF 差</th>
              </tr>
            </thead>
            <tbody>
              {approximation.map(({ n, gap, scaled }) => (
                <tr key={n}>
                  <td className="numeric">{n}</td>
                  <td className="numeric">{gap.toExponential(3)}</td>
                  <td className="numeric">{scaled.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="section-text">
            右の列がほぼ一定なので、誤差は <Tex tex={'0.027 / n'} />{' '}
            程度で減っています。Berry–Esseen の一般の評価は{' '}
            <Tex tex={'O(1/\\sqrt{n})'} /> ですが、
            <Tex tex={'p = 1/2'} /> の二項分布は左右対称で歪度が 0
            なので、Edgeworth 展開の <Tex tex={'1/\\sqrt{n}'} />{' '}
            項が消え、連続性補正と合わせて <Tex tex={'O(1/n)'} />{' '}
            まで速くなります。
          </p>
          <p className="section-text">
            ここで使った <Tex tex={'\\Phi'} /> と <Tex tex={'\\chi^2'} />{' '}
            の上側確率は、どちらも不完全ガンマ関数 <Tex tex={'P(a, x)'} />{' '}
            の級数と連分数から倍精度いっぱいまで計算しています。検証する側が別のシミュレーションになっていないという意味で、この表は厳密です。
          </p>
          <p className="section-text">
            ランダムサンプリングの収束の速さそのものについては{' '}
            <Link href="/monte-carlo" className="link">
              Monte Carlo 収束比較
            </Link>{' '}
            も参照してください。
          </p>
        </section>
      </div>
    </Layout>
  )
}
