import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import CountSlider from '@/components/CountSlider'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import PolylinePlot from '@/components/PolylinePlot'
import TemplateEditor from '@/components/TemplateEditor'
import {
  branchingFactor,
  maxIterationsFor,
  type Orientation,
  RIGHT_ANGLE_TEMPLATE,
  rewriteCurve,
  similarityDimension,
  type Template,
  TEMPLATE_PRESETS,
  templateSegments,
} from '@/lib/edgeRewrite'

const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: 'alternating', label: '交互' },
  { id: 'fixed', label: '固定' },
]

/** Named shapes, so the lab tells you when you have landed on a known one. */
const KNOWN_SHAPES: { id: string; orientation: Orientation; name: string }[] = [
  {
    id: 'right-angle',
    orientation: 'alternating',
    name: 'ヘイウェイ・ドラゴン',
  },
  { id: 'right-angle', orientation: 'fixed', name: 'レヴィ C 曲線' },
  { id: 'koch', orientation: 'fixed', name: 'コッホ曲線' },
  { id: 'minkowski', orientation: 'fixed', name: 'ミンコフスキー・ソーセージ' },
]

function sameTemplate(a: Template, b: Template): boolean {
  return (
    a.length === b.length &&
    a.every(
      (point, i) =>
        Math.abs(point.x - b[i].x) < 1e-9 && Math.abs(point.y - b[i].y) < 1e-9
    )
  )
}

export default function RewriteLabPage() {
  const [template, setTemplate] = useState<Template>(RIGHT_ANGLE_TEMPLATE)
  const [orientation, setOrientation] = useState<Orientation>('alternating')
  const [iterations, setIterations] = useState(10)
  const [snap, setSnap] = useState(true)
  const [showGhost, setShowGhost] = useState(false)

  const branching = branchingFactor(template)
  const maxIterations = maxIterationsFor(template)
  const order = Math.min(iterations, maxIterations)

  const points = useMemo(
    () => rewriteCurve(template, orientation, order),
    [template, orientation, order]
  )
  const ghost = useMemo(
    () => (order > 1 ? rewriteCurve(template, orientation, order - 1) : []),
    [template, orientation, order]
  )
  const segments = useMemo(() => templateSegments(template), [template])
  const dimension = useMemo(() => similarityDimension(template), [template])

  const knownName = KNOWN_SHAPES.find((shape) => {
    const preset = TEMPLATE_PRESETS.find((item) => item.id === shape.id)
    return (
      preset !== undefined &&
      shape.orientation === orientation &&
      sameTemplate(template, preset.template)
    )
  })?.name

  const applyPreset = (next: Template) => {
    setTemplate(next)
    setIterations((current) => Math.min(current, maxIterationsFor(next)))
  }

  const addPoint = () => {
    // Split whichever sub-segment is currently longest, so the click is
    // predictable and the new handle is easy to grab.
    const lengths = segments.map((segment) => segment.length)
    const target = lengths.indexOf(Math.max(...lengths))
    const from = template[target]
    const to = template[target + 1]
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }

    applyPreset([
      ...template.slice(0, target + 1),
      midpoint,
      ...template.slice(target + 1),
    ])
  }

  const removePoint = () => {
    if (template.length <= 3) return
    applyPreset([...template.slice(0, -2), template[template.length - 1]])
  }

  const mirrorTemplate = () => {
    setTemplate(template.map((point) => ({ x: point.x, y: -point.y })))
  }

  return (
    <Layout title="辺の書き換えラボ - Math KB">
      <div className="container">
        <h1 className="page-title">辺の書き換えラボ</h1>
        <PageTags pageId="rewrite-lab" />
        <p className="page-lead">
          1
          本の線分を「どんな折れ線に置き換えるか」を自分で描いて、それを繰り返し適用するとどんな図形になるかを試すツールです。置き換えの形と、置き換えを
          <strong>どちら向きに当てるか</strong>の 2
          つだけで、名前のついた曲線の多くが出てきます。
        </p>

        <section className="section">
          <h2 className="section-title">置き換えの形</h2>
          <p className="section-text">
            点線が置き換えられる元の線分（左端から右端）です。青い点をドラッグすると形が変わります。両端は固定されています。
          </p>

          <div className="flex-center">
            <TemplateEditor
              template={template}
              onChange={setTemplate}
              snap={snap}
            />
          </div>

          <div className="slider-row">
            <div className="split-row" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={addPoint}
                className="button button-secondary"
              >
                点を追加
              </button>
              <button
                type="button"
                onClick={removePoint}
                disabled={template.length <= 3}
                className="button button-secondary"
              >
                点を削除
              </button>
              <button
                type="button"
                onClick={mirrorTemplate}
                className="button button-secondary"
              >
                上下反転
              </button>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={snap}
                onChange={() => setSnap((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">グリッドに吸着</span>
            </label>
          </div>

          <div className="slider-row">
            <span className="slider-label">プリセット</span>
            <div className="split-row" style={{ flexWrap: 'wrap' }}>
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.template)}
                  className="button button-secondary"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              できる曲線
            </h2>
            <div className="segment" role="radiogroup" aria-label="向き">
              {ORIENTATIONS.map((item) => (
                <Fragment key={item.id}>
                  <input
                    type="radio"
                    name="orientation"
                    id={`orientation-${item.id}`}
                    checked={orientation === item.id}
                    onChange={() => setOrientation(item.id)}
                  />
                  <label htmlFor={`orientation-${item.id}`}>{item.label}</label>
                </Fragment>
              ))}
            </div>
          </div>

          <CountSlider
            label="置き換え回数"
            value={order}
            min={1}
            max={maxIterations}
            onChange={setIterations}
            readout={`${order} 回　${branching ** order} 本`}
          />

          <div className="slider-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={showGhost}
                onChange={() => setShowGhost((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">
                1 つ前 ({order - 1} 回) を重ねる
              </span>
            </label>
          </div>

          <div className="flex-center">
            <PolylinePlot points={points} ghost={ghost} showGhost={showGhost} />
          </div>

          {knownName ? (
            <p className="section-text center">
              いま描かれているのは <strong>{knownName}</strong> です。
            </p>
          ) : (
            <p className="section-text center">
              1 辺が {branching} 本に分かれ、{order} 回で {branching ** order}{' '}
              本になります。
            </p>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">置き換えの中身</h2>
          <p className="section-text">
            各辺の長さは元の線分を 1 としたときの比です。角度は 1
            つ前の辺からの向きの変化で、正が左回りです。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="numeric">辺</th>
                  <th className="numeric">長さ</th>
                  <th className="numeric">前の辺からの角度</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.index}>
                    <td className="numeric">{segment.index + 1}</td>
                    <td className="numeric">{segment.length.toFixed(4)}</td>
                    <td className="numeric">{segment.turn.toFixed(1)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="formula-list">
            <li>
              分岐数: <span className="numeric">{branching}</span> （1
              辺がこの本数に置き換わります）
            </li>
            <li>
              {dimension === null ? (
                <>
                  相似次元: 辺の長さが不揃い、または 1
                  以上のため、単純な相似次元は求まりません。
                </>
              ) : (
                <>
                  相似次元:{' '}
                  <span className="numeric">{dimension.toFixed(4)}</span>{' '}
                  （すべての辺が同じ比で縮む場合の値）
                </>
              )}
            </li>
            <li>
              表示できる上限: <span className="numeric">{maxIterations}</span>{' '}
              回（分岐数が大きいほど早く増えるため）
            </li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">試してみると面白いところ</h2>
          <ul className="formula-list">
            <li>
              「直角」プリセットのまま<strong>向きだけ</strong>
              を切り替えると、ヘイウェイ・ドラゴンとレヴィ C
              曲線が入れ替わります。形は同一で、違いは当てる向きだけです。
            </li>
            <li>
              「コッホ」の山の高さを少し下げると、雪片の角が丸まって別の曲線になります。高さ
              0 で元の線分に戻ります。
            </li>
            <li>
              辺の長さの合計が 1
              に近いほど図形は元の線分に沿い、長いほど激しく折れ曲がって面を埋めていきます。
            </li>
            <li>
              「1
              つ前を重ねる」を入れると、どの辺がどう置き換わったのかが直接見えます。
            </li>
            <li>
              紙折りの規則から同じ曲線を作る話は{' '}
              <Link href="/dragon-curve" className="link">
                Heighway Dragon
              </Link>{' '}
              にあります。
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
