import { useMemo, useState } from 'react'
import DisplacementChart from '@/components/DisplacementChart'
import HilbertCurvePlot from '@/components/HilbertCurvePlot'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import PermutationStrip from '@/components/PermutationStrip'
import ShuffleStackPlot from '@/components/ShuffleStackPlot'
import Tex from '@/components/Tex'
import { hilbertPoints, hilbertShuffle } from '@/lib/hilbertCurve'
import {
  applyPermutationTimes,
  identityPermutation,
  isIdentity,
  permutationOrbit,
  permutationStats,
} from '@/lib/permutation'

const ORDER_OPTIONS = [1, 2, 3, 4, 5]
const MAX_REPEATS = 60
/** 774 rows (order 3) still fit on screen at 2px each; beyond that we truncate. */
const MAX_ORBIT_ROWS = 800

function orbitRowHeight(rows: number): number {
  if (rows <= 40) return 22
  if (rows <= 160) return 6
  return 2
}

export default function HilbertShufflePage() {
  const [order, setOrder] = useState(3)
  const [progress, setProgress] = useState(4 ** 3)
  const [repeats, setRepeats] = useState(1)

  const points = useMemo(() => hilbertPoints(order), [order])
  const perm = useMemo(() => hilbertShuffle(order), [order])
  const stats = useMemo(() => permutationStats(perm), [perm])

  const deckSize = perm.length
  const identity = useMemo(() => identityPermutation(deckSize), [deckSize])
  const repeated = useMemo(
    () => applyPermutationTimes(identity, perm, repeats),
    [identity, perm, repeats]
  )
  const orbit = useMemo(() => permutationOrbit(perm, MAX_ORBIT_ROWS), [perm])
  const isFullOrbit = orbit.length > 1 && isIdentity(orbit[orbit.length - 1])

  const walked = Math.min(progress, deckSize)
  const head = points[walked - 1]
  const repeatMax = Math.min(MAX_REPEATS, Number(stats.order))
  const isRestored =
    repeats > 0 && repeated.every((card, slot) => card === slot)

  const handleOrderChange = (value: number) => {
    setOrder(value)
    setProgress(4 ** value)
    setRepeats(1)
  }

  return (
    <Layout title="Hilbert Curve Shuffle - Math KB">
      <div className="container">
        <h1 className="page-title">Hilbert Curve Shuffle</h1>
        <PageTags pageId="hilbert-shuffle" />
        <p className="page-lead">
          カードを正方形のグリッドに並べ、ヒルベルト曲線がたどる順に拾い直すと、1
          つの決まったシャッフルが得られます。空間充填曲線が近い場所を近いまま保つ性質が、並びにどう表れるかを見ます。
        </p>

        <section className="section">
          <h2 className="section-title">ヒルベルト曲線</h2>
          <p className="section-text">
            位数 <Tex tex={'n'} /> のヒルベルト曲線は{' '}
            <Tex tex={'2^n \\times 2^n'} /> のグリッドの全マスを 1
            度ずつ通ります。マス数は
          </p>
          <div className="formula">
            <Tex tex={'N = 4^n'} display />
          </div>
          <p className="section-text">
            で、隣り合うステップは必ず上下左右に 1
            マスだけ動きます。曲線に沿って近い 2 点はグリッド上でも必ず近く、
            この「局所性の保存」が空間充填曲線の要です。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              曲線に沿って拾う
            </h2>
            <label className="slider-label">
              位数
              <select
                value={order}
                onChange={(e) => handleOrderChange(Number(e.target.value))}
                className="select"
              >
                {ORDER_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    n = {n}（{2 ** n} × {2 ** n} = {4 ** n} 枚）
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="slider-row">
            <label className="slider-label">
              ステップ
              <input
                type="range"
                min={1}
                max={deckSize}
                value={walked}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="slider"
              />
            </label>
            <span className="slider-value numeric">
              {walked} / {deckSize}
              {head ? `　(x, y) = (${head.x}, ${head.y})` : ''}
            </span>
          </div>

          <div className="flex-center">
            <HilbertCurvePlot points={points} order={order} progress={walked} />
          </div>

          <p className="section-text">
            グリッドの色は<strong>並べたときの位置</strong>
            （左上から右へ、行ごとに虹色）です。曲線が通ったマスだけ濃く表示しています。
            拾った順に並べ直すと、下の帯になります。
          </p>
          <PermutationStrip
            values={perm}
            visibleCount={walked}
            markIndex={walked - 1}
          />
        </section>

        <section className="section">
          <h2 className="section-title">シャッフル前後</h2>
          <p className="section-text">
            上が並べたときの順、下がヒルベルト曲線で拾い直した順です。色は
            <strong>元の位置</strong>
            を表すので、下の帯の色の乱れ方がそのままシャッフルの強さになります。
          </p>
          <p className="section-text">シャッフル前</p>
          <PermutationStrip values={identity} />
          <p className="section-text" style={{ marginTop: 'var(--size-4)' }}>
            シャッフル後
          </p>
          <PermutationStrip values={perm} />
          <p className="section-text">
            虹がバラバラにならず、ある程度まとまった色の帯として残るのが特徴です。曲線が局所性を保つため、
            近い位置のカードは散らばりきりません。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">カードはどれだけ動いたか</h2>
          <p className="section-text">
            位置 <Tex tex={'i'} /> に来たカードの元の位置を{' '}
            <Tex tex={'\\pi(i)'} /> として、移動距離{' '}
            <Tex tex={'|\\pi(i) - i|'} /> を並べたものです。
            自己相似な階段状の形が現れます。
          </p>
          <DisplacementChart perm={perm} />
          <ul className="formula-list">
            <li>
              最大移動距離:{' '}
              <span className="numeric">{stats.maxDisplacement}</span> 枚
            </li>
            <li>
              平均移動距離:{' '}
              <span className="numeric">
                {stats.meanDisplacement.toFixed(1)}
              </span>{' '}
              枚（デッキ {deckSize} 枚中）
            </li>
          </ul>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              繰り返しシャッフル
            </h2>
            <span className="slider-value numeric">
              {repeats} 回{isRestored ? '　→ 元の並びに戻りました' : ''}
            </span>
          </div>
          <div className="slider-row">
            <label className="slider-label">
              回数
              <input
                type="range"
                min={0}
                max={repeatMax}
                value={Math.min(repeats, repeatMax)}
                onChange={(e) => setRepeats(Number(e.target.value))}
                className="slider"
              />
            </label>
            <button
              type="button"
              onClick={() => setRepeats(1)}
              className="button button-secondary"
            >
              リセット
            </button>
          </div>
          <PermutationStrip values={repeated} />
          <p className="section-text">
            同じシャッフルを繰り返すと、必ずいつか元の並びに戻ります。戻るまでの回数は巡回置換の各サイクル長の最小公倍数です。
            {repeatMax < Number(stats.order)
              ? `（スライダーは ${MAX_REPEATS} 回までです）`
              : ''}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="numeric">位数 n</th>
                  <th className="numeric">デッキ枚数</th>
                  <th className="numeric">サイクル数</th>
                  <th className="numeric">最長サイクル</th>
                  <th className="numeric">動かない枚数</th>
                  <th className="numeric">元に戻るまで</th>
                </tr>
              </thead>
              <tbody>
                {ORDER_OPTIONS.map((n) => {
                  const rowStats = permutationStats(hilbertShuffle(n))
                  return (
                    <tr
                      key={n}
                      style={
                        n === order
                          ? { background: 'var(--accent-light)' }
                          : undefined
                      }
                    >
                      <td className="numeric">{n}</td>
                      <td className="numeric">{rowStats.size}</td>
                      <td className="numeric">{rowStats.cycleCount}</td>
                      <td className="numeric">{rowStats.longestCycle}</td>
                      <td className="numeric">{rowStats.fixedPoints}</td>
                      <td className="numeric">
                        {rowStats.order.toLocaleString('ja-JP')} 回
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">元に戻るまでの全過程</h2>
          <p className="section-text">
            0 回目（並べたまま）から 1 行ずつ、シャッフルを 1
            回かけた並びを積み上げたものです。Riffle Shuffle
            のページと同じ見方で、グラデーションが崩れてまた揃うまでを追えます。
          </p>
          <p className="section-text">
            {isFullOrbit
              ? `${orbit.length - 1} 回で元の並びに戻ります（最終行が 0 回目と同じ並びです）。`
              : `元に戻るのは ${stats.order.toLocaleString('ja-JP')} 回目なので、最初の ${orbit.length - 1} 回までを表示しています。`}
          </p>
          <ShuffleStackPlot
            steps={orbit}
            colorMode="color"
            rowHeight={orbitRowHeight(orbit.length)}
            gap={orbit.length <= 40 ? 2 : 0}
          />
        </section>

        <section className="section">
          <h2 className="section-title">性質</h2>
          <ul className="formula-list">
            <li>
              曲線の連続する 2 ステップは必ずグリッド上で隣接するため、
              シャッフル後に隣り合うカードは元のグリッドでも隣どうしです。
            </li>
            <li>
              先頭のカード（位置
              0）は必ず動きません。曲線が常に左上から始まるためです。
            </li>
            <li>
              リフルシャッフルと同じく、繰り返せば必ず元に戻ります。ただし戻るまでの回数は
              デッキの大きさに対して急速に増えます。
            </li>
            <li>
              局所性を保つ並べ替えなので、画像のタイル分割やデータベースの空間インデックス
              （Z オーダーの改良版）として実用されています。
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
