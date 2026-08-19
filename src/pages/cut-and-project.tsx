import Link from 'next/link'
import { useMemo, useState } from 'react'
import CountSlider from '@/components/CountSlider'
import LatticeStripPlot from '@/components/LatticeStripPlot'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import TileStrip from '@/components/TileStrip'
import WindowOrbitPlot from '@/components/WindowOrbitPlot'
import {
  canonicalWidth,
  distinctLengths,
  expectedRatio,
  fibonacciFactorIndex,
  fibonacciWord,
  lineNorm,
  rotationOf,
  smallestPeriod,
  type Strip,
  stripPoints,
  tileStats,
  tilesOf,
  windowPartition,
  wordOf,
} from '@/lib/cutAndProject'

type SlopePreset = {
  id: string
  label: string
  value: number
  /** Set when the slope is a ratio of integers, so the page can name it. */
  fraction?: [number, number]
}

const IRRATIONAL_SLOPES: SlopePreset[] = [
  {
    id: 'golden',
    label: '1/φ = (√5 − 1)/2 … 0.6180',
    value: (Math.sqrt(5) - 1) / 2,
  },
  { id: 'silver', label: '√2 − 1 … 0.4142', value: Math.SQRT2 - 1 },
  { id: 'root3', label: '√3 − 1 … 0.7321', value: Math.sqrt(3) - 1 },
  { id: 'pi', label: 'π − 3 … 0.1416', value: Math.PI - 3 },
]

const RATIONAL_SLOPES: SlopePreset[] = [
  { id: 'half', label: '1/2', value: 1 / 2, fraction: [1, 2] },
  { id: 'three-fifths', label: '3/5', value: 3 / 5, fraction: [3, 5] },
  {
    id: 'eight-thirteenths',
    label: '8/13 … 0.6154',
    value: 8 / 13,
    fraction: [8, 13],
  },
]

const ALL_SLOPES = [...IRRATIONAL_SLOPES, ...RATIONAL_SLOPES]

/** Columns used for the statistics, far more than the picture can show. */
const STAT_COLUMNS = 4000
const LONG_STRIP_TILES = 400
const WORD_PREVIEW = 96
const FACTOR_PROBE = 40

const GOLDEN_SLOPE_ID = 'golden'

function formatNumber(value: number, digits = 4): string {
  return value.toFixed(digits)
}

export default function CutAndProjectPage() {
  const [slopeId, setSlopeId] = useState(GOLDEN_SLOPE_ID)
  const [widthPercent, setWidthPercent] = useState(100)
  const [offsetPercent, setOffsetPercent] = useState(0)
  const [columns, setColumns] = useState(20)
  const [showProjection, setShowProjection] = useState(true)
  const [showStaircase, setShowStaircase] = useState(false)

  const preset =
    ALL_SLOPES.find((item) => item.id === slopeId) ?? IRRATIONAL_SLOPES[0]
  const slope = preset.value
  const baseWidth = canonicalWidth(slope)
  const norm = lineNorm(slope)

  const strip = useMemo<Strip>(
    () => ({
      slope,
      width: (baseWidth * widthPercent) / 100,
      offset: (baseWidth * offsetPercent) / 100,
    }),
    [slope, baseWidth, widthPercent, offsetPercent]
  )

  const viewPoints = useMemo(
    () => stripPoints(strip, columns),
    [strip, columns]
  )
  const viewTiles = useMemo(
    () => tilesOf(viewPoints, slope),
    [viewPoints, slope]
  )

  const statPoints = useMemo(() => stripPoints(strip, STAT_COLUMNS), [strip])
  const statTiles = useMemo(
    () => tilesOf(statPoints, slope),
    [statPoints, slope]
  )
  const word = useMemo(() => wordOf(statTiles), [statTiles])
  const stats = useMemo(() => tileStats(statTiles), [statTiles])
  const lengths = useMemo(() => distinctLengths(statTiles), [statTiles])
  const period = useMemo(() => smallestPeriod(word), [word])
  const factorIndex = useMemo(
    () => fibonacciFactorIndex(word.slice(0, FACTOR_PROBE)),
    [word]
  )

  const comparison = useMemo(
    () =>
      ALL_SLOPES.map((item) => {
        const itemStrip = {
          slope: item.value,
          width: canonicalWidth(item.value),
          offset: 0,
        }
        const tiles = tilesOf(stripPoints(itemStrip, 600), item.value)
        const itemWord = wordOf(tiles)

        return {
          preset: item,
          stats: tileStats(tiles),
          period: smallestPeriod(itemWord),
          head: itemWord.slice(0, 24),
        }
      }),
    []
  )

  const partition = windowPartition(strip)
  const rotation = rotationOf(slope)
  const isCanonical = widthPercent === 100
  const ratioTarget = expectedRatio(slope)

  return (
    <Layout title="Cut and Project - Math KB">
      <div className="container">
        <h1 className="page-title">Cut and Project</h1>
        <PageTags pageId="cut-and-project" />
        <p className="page-lead">
          方眼紙の格子点に、原点から無理数の傾きで直線を引きます。その直線に沿って細い帯をかけ、帯の中に入った格子点だけを直線へ落とすと、二度と同じ並びを繰り返さないのに規則正しい、準周期的な点列が現れます。準結晶やペンローズタイルを作るのと同じ手続きの、いちばん簡単な場合です。
        </p>

        <section className="section">
          <h2 className="section-title">切って落とす</h2>
          <p className="section-text">
            傾き <Tex tex={'\\alpha'} /> の直線 <Tex tex={'y = \\alpha x'} />{' '}
            を引き、格子点 <Tex tex={'(m, n)'} />{' '}
            について直線に平行な向きと垂直な向きの座標を測ります。
          </p>
          <div className="formula">
            <Tex
              tex={
                't(m, n) = \\frac{m + \\alpha n}{\\sqrt{1 + \\alpha^2}}, \\qquad s(m, n) = \\frac{n - \\alpha m}{\\sqrt{1 + \\alpha^2}}'
              }
              display
            />
          </div>
          <p className="section-text">
            <Tex tex={'s'} /> は直線からの符号つき距離、
            <Tex tex={'t'} /> は落とした先の位置です。
            <Tex tex={'|s|'} />{' '}
            が帯の幅の半分より小さい格子点だけを残し（切る）、
            <Tex tex={'t'} /> の順に並べる（落とす）。この 2 段構えが cut and
            project という名前の由来です。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">格子と帯</h2>

          <div className="slider-row">
            <label className="slider-label" htmlFor="slope-select">
              直線の傾き α
            </label>
            <select
              id="slope-select"
              value={slopeId}
              onChange={(e) => setSlopeId(e.target.value)}
              className="select"
            >
              <optgroup label="無理数">
                {IRRATIONAL_SLOPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="有理数（比較用）">
                {RATIONAL_SLOPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <CountSlider
            label="帯の幅"
            value={widthPercent}
            min={20}
            max={300}
            step={5}
            onChange={setWidthPercent}
            readout={`${widthPercent}%　幅 ${formatNumber(strip.width)}${isCanonical ? '（基準幅）' : ''}`}
          />
          <CountSlider
            label="帯のずらし"
            value={offsetPercent}
            min={-100}
            max={100}
            step={5}
            onChange={setOffsetPercent}
            readout={`${offsetPercent}%　中心 ${formatNumber(strip.offset)}`}
          />
          <CountSlider
            label="見る範囲（列）"
            value={columns}
            min={6}
            max={48}
            onChange={setColumns}
            readout={`x ≤ ${columns}　${viewPoints.length} 点`}
          />

          <div className="slider-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={showProjection}
                onChange={() => setShowProjection((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">落とす線を描く</span>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={showStaircase}
                onChange={() => setShowStaircase((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">選ばれた点をつなぐ（階段）</span>
            </label>
          </div>

          <div className="flex-center">
            <LatticeStripPlot
              strip={strip}
              points={viewPoints}
              tiles={viewTiles}
              columns={columns}
              showProjection={showProjection}
              showStaircase={showStaircase}
            />
          </div>
          <p className="section-text">
            直線の上に置かれた太い線が、落ちてきた点が切り分けた区間です。長いほう（青）を{' '}
            <strong>L</strong>、短いほう（橙）を <strong>S</strong>{' '}
            と呼びます。帯の中の格子点は右へ 1 マスか上へ 1
            マスずつ進む階段になっていて、右へ進めば L、上へ進めば S が 1
            つ増えます。
          </p>

          <div className="flex-center">
            <TileStrip tiles={viewTiles} showLetters />
          </div>
          <p className="section-text center numeric">
            {wordOf(viewTiles) || '（帯が狭すぎて点が並びません）'}
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">間隔が 2 種類だけになる幅</h2>
          <p className="section-text">
            帯の幅を単位正方形の影の長さに合わせると、格子の 1 マスにつき必ず 1
            点が通ります。この幅を基準幅と呼びます。
          </p>
          <div className="formula">
            <Tex
              tex={
                'W = \\frac{1 + \\alpha}{\\sqrt{1 + \\alpha^2}}, \\qquad \\ell_L = \\frac{1}{\\sqrt{1 + \\alpha^2}}, \\qquad \\ell_S = \\frac{\\alpha}{\\sqrt{1 + \\alpha^2}}'
              }
              display
            />
          </div>
          <p className="section-text">
            このとき隣り合う点の間隔は <Tex tex={'\\ell_L'} /> と{' '}
            <Tex tex={'\\ell_S'} /> の 2 種類しかなく、その比は{' '}
            <Tex tex={'\\ell_L / \\ell_S = 1/\\alpha'} /> です。幅を広げると帯に
            2 点同時に入る列ができて 3
            種類目の間隔（緑）が生まれ、狭めると点が抜け落ちて間隔が伸びます。上のスライダーで確かめられます。
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <tbody>
                <tr>
                  <th>基準幅 W</th>
                  <td className="numeric">{formatNumber(baseWidth, 6)}</td>
                  <th>いまの幅</th>
                  <td className="numeric">
                    {formatNumber(strip.width, 6)}（{widthPercent}%）
                  </td>
                </tr>
                <tr>
                  <th>間隔の種類</th>
                  <td className="numeric">{lengths.length}</td>
                  <th>その長さ</th>
                  <td className="numeric">
                    {lengths
                      .slice(0, 4)
                      .map((length) => formatNumber(length))
                      .join(' / ')}
                  </td>
                </tr>
                <tr>
                  <th>L の本数</th>
                  <td className="numeric">{stats.long}</td>
                  <th>S の本数</th>
                  <td className="numeric">{stats.short}</td>
                </tr>
                <tr>
                  <th>L / S</th>
                  <td className="numeric">
                    {stats.ratio === null ? '—' : formatNumber(stats.ratio, 6)}
                  </td>
                  <th>
                    <Tex tex={'1/\\alpha'} />
                  </th>
                  <td className="numeric">{formatNumber(ratioTarget, 6)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="section-text">
            集計は x ≤ {STAT_COLUMNS} の範囲（{statPoints.length}{' '}
            点）です。基準幅なら L と S の本数比は <Tex tex={'1/\\alpha'} />{' '}
            に近づきます。黄金比の場合はこれが φ
            自身になり、長さの比も本数の比も同じ φ になります。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">帯の中は無理数回転</h2>
          <p className="section-text">
            なぜ点列が繰り返さないのかは、直線からの距離 <Tex tex={'s'} />{' '}
            を追うと分かります。1 歩進むごとに <Tex tex={'s'} />{' '}
            は必ず同じ量だけ下がり、帯の下端を割ると上端へ回り込みます。
          </p>
          <div className="formula">
            <Tex
              tex={
                's_{k+1} \\equiv s_k - \\frac{\\alpha}{\\sqrt{1 + \\alpha^2}} \\pmod{W}, \\qquad \\frac{\\alpha / \\sqrt{1+\\alpha^2}}{W} = \\frac{\\alpha}{1 + \\alpha}'
              }
              display
            />
          </div>
          <p className="section-text">
            つまり帯の断面は円周で、点列はその上の回転です。回転数{' '}
            <Tex tex={'\\alpha / (1 + \\alpha)'} /> ={' '}
            <span className="numeric">{formatNumber(rotation.number, 6)}</span>{' '}
            は <Tex tex={'\\alpha'} />{' '}
            が無理数なら無理数なので、同じ位置に二度と戻れません。これが「周期がない」ことの正体で、
            <Link href="/van-der-corput" className="link">
              一様分布列
            </Link>{' '}
            や{' '}
            <Link href="/lissajous" className="link">
              リサージュ曲線が閉じないこと
            </Link>{' '}
            と同じ現象です。
          </p>

          <div className="flex-center">
            <WindowOrbitPlot
              strip={strip}
              points={statPoints}
              tiles={statTiles}
            />
          </div>
          <p className="section-text">
            横軸が何番目の点か、縦軸が直線からの距離です。細い線でつないだ下りはどれも同じ傾きで、これが毎回同じだけずれることを表します。下端を割った回（線が切れている場所）が上端への回り込みです。窓は
            2 つに分かれていて、下側（橙、長さ{' '}
            <span className="numeric">
              {formatNumber(partition.boundary - partition.low)}
            </span>
            ）に落ちた点は次に上へ進んで S を、上側（青、長さ{' '}
            <span className="numeric">
              {formatNumber(partition.high - partition.boundary)}
            </span>
            ）に落ちた点は右へ進んで L を作ります。基準幅ならこの 2
            つの長さの比が、そのまま S と L の出現比になります。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">長く並べる</h2>
          <div className="flex-center">
            <TileStrip
              tiles={statTiles.slice(0, LONG_STRIP_TILES)}
              height={36}
            />
          </div>
          <p
            className="section-text numeric"
            style={{ wordBreak: 'break-all' }}
          >
            {word.slice(0, WORD_PREVIEW)}…
          </p>
          <ul className="formula-list">
            <li>
              調べた文字数: <span className="numeric">{word.length}</span>
            </li>
            <li>
              周期:{' '}
              <span className="numeric">
                {period === null ? 'この範囲では見つからない' : period}
              </span>
              {preset.fraction
                ? `（p + q = ${preset.fraction[0] + preset.fraction[1]}）`
                : ''}
            </li>
            <li>
              同じ並びが繰り返されないのに、L が 2 つ以上連続する場所と S
              が離れて現れる場所の形は数種類しかありません。どこを切り取っても似た顔をしている、というのが準周期の意味です。
            </li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">有理数の傾きなら周期的になる</h2>
          <p className="section-text">
            傾きが <Tex tex={'\\alpha = p/q'} /> なら、直線は格子点{' '}
            <Tex tex={'(q, p)'} /> をぴったり通ります。そこで図全体を{' '}
            <Tex tex={'(q, p)'} />{' '}
            だけ平行移動すると、格子も直線も帯もそっくり自分に重なります。だから点列は{' '}
            <Tex tex={'p + q'} /> 文字ごとに同じ並びを繰り返します。
          </p>
          <p className="section-text">
            無理数の傾きでは、直線が通る格子点は原点だけです。重ね合わせられる平行移動が存在しないので、点列はどこまで行っても同じ並びに戻りません。傾きを{' '}
            <strong>8/13</strong> にすると、φ の連分数近似だけあって{' '}
            <strong>1/φ</strong> とよく似た並びが出ますが、21
            文字でぱたりと繰り返しに入ります。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>傾き</th>
                  <th className="numeric">L / S の比</th>
                  <th className="numeric">周期</th>
                  <th>点列</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.preset.id}>
                    <td>{row.preset.label}</td>
                    <td className="numeric">
                      {row.stats.ratio === null
                        ? '—'
                        : formatNumber(row.stats.ratio)}
                    </td>
                    <td className="numeric">
                      {row.period === null ? 'なし' : row.period}
                    </td>
                    <td className="numeric">{row.head}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-text">
            π − 3 は <Tex tex={'16/113'} />{' '}
            に非常に近いため、この表の範囲では周期があるように見えます。実際には
            113
            マスよりずっと先でずれが現れます。無理数かどうかは、有限個の点を見ても分からないということです。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">フィボナッチ語との関係</h2>
          <p className="section-text">
            傾きを <Tex tex={'1/\\varphi'} /> にすると、出てくるのは置き換え規則
          </p>
          <div className="formula">
            <Tex tex={'L \\to LS, \\qquad S \\to L'} display />
          </div>
          <p className="section-text">
            で伸びるフィボナッチ語です。{' '}
            <span className="numeric">{fibonacciWord(34)}…</span>{' '}
            のように伸びていき、n
            回置き換えた語の長さはフィボナッチ数になります。
          </p>
          <p className="section-text">
            帯を上下にずらすと、出てくる点列そのものは別の並びに変わります。ところが
            <strong>
              そこに現れる有限の並び（部分語）の顔ぶれは変わりません
            </strong>
            。いまの設定で先頭 {FACTOR_PROBE}{' '}
            文字がフィボナッチ語の中に現れるかを調べると{' '}
            <span className="numeric">
              {slopeId === GOLDEN_SLOPE_ID
                ? factorIndex >= 0
                  ? `${factorIndex} 文字目に見つかる`
                  : '見つからない'
                : '（傾きを 1/φ にすると調べられます）'}
            </span>
            。局所的には見分けがつかないのに全体としては別物、という性質は、準結晶の回折像が鋭い点になる理由でもあります。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">性質</h2>
          <ul className="formula-list">
            <li>
              点の密度は帯の幅そのもので、単位長さあたり{' '}
              <span className="numeric">{formatNumber(baseWidth, 4)}</span>{' '}
              個です。
              <Tex tex={'\\sqrt{1+\\alpha^2}'} /> ={' '}
              <span className="numeric">{formatNumber(norm, 4)}</span>{' '}
              が直線の傾きぶんの引き伸ばしを表します。
            </li>
            <li>
              L の割合は <Tex tex={'1/(1+\\alpha)'} />
              、S の割合は <Tex tex={'\\alpha/(1+\\alpha)'} />{' '}
              です。どちらも無理数なので、有限の周期では実現できません。
            </li>
            <li>
              同じ作り方を 5 次元の格子と 2 次元の平面で行うと、5
              回対称のペンローズタイルが出てきます。1984
              年に発見された準結晶は、この構造が実在することを示しました。
            </li>
            <li>
              帯の幅を基準幅からずらすと点列は準周期でなくなります。「切る幅」が構造を決めるという点が、この作り方のいちばんの勘所です。
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
