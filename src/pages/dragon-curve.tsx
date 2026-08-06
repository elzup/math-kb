import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import CountSlider from '@/components/CountSlider'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import PolylinePlot from '@/components/PolylinePlot'
import Tex from '@/components/Tex'
import { dragonPoints, dragonTurns, turnDetail } from '@/lib/dragonCurve'
import {
  KOCH_TEMPLATE,
  type Orientation,
  RIGHT_ANGLE_TEMPLATE,
  rewriteCurve,
  type Template,
} from '@/lib/edgeRewrite'
import { boundsOf } from '@/lib/point'

const MIN_ORDER = 1
const MAX_ORDER = 16
const TABLE_ROWS = 12
/** Beyond this the fold string is unreadable, so only the table is shown. */
const MAX_TURN_STRING_ORDER = 6

const VIEW_MODES = [
  { id: 'gradient', label: 'なぞり順' },
  { id: 'halves', label: '前半 / 後半' },
] as const

type ViewMode = (typeof VIEW_MODES)[number]['id']

type TemplateId = 'right-angle' | 'koch'

const TEMPLATES: Record<
  TemplateId,
  {
    label: string
    template: Template
    maxIterations: number
    branching: number
  }
> = {
  'right-angle': {
    label: '直角（2 分割）',
    template: RIGHT_ANGLE_TEMPLATE,
    maxIterations: 14,
    branching: 2,
  },
  koch: {
    label: 'コッホ（4 分割）',
    template: KOCH_TEMPLATE,
    maxIterations: 7,
    branching: 4,
  },
}

const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: 'alternating', label: '交互' },
  { id: 'fixed', label: '固定' },
]

const CURVE_NAMES: Record<string, string> = {
  'right-angle:alternating': 'ヘイウェイ・ドラゴン',
  'right-angle:fixed': 'レヴィ C 曲線',
  'koch:fixed': 'コッホ曲線',
  'koch:alternating': 'コッホ規則を交互にした変種',
}

export default function DragonCurvePage() {
  const [order, setOrder] = useState(12)
  const [viewMode, setViewMode] = useState<ViewMode>('gradient')
  const [templateId, setTemplateId] = useState<TemplateId>('right-angle')
  const [orientation, setOrientation] = useState<Orientation>('alternating')
  const [familyIterations, setFamilyIterations] = useState(12)
  const [showDragonGhost, setShowDragonGhost] = useState(false)
  const [showFamilyGhost, setShowFamilyGhost] = useState(false)

  const points = useMemo(() => dragonPoints(order), [order])
  const previousPoints = useMemo(
    () => (order > MIN_ORDER ? dragonPoints(order - 1) : []),
    [order]
  )
  const bounds = useMemo(() => boundsOf(points), [points])
  const turnString = useMemo(
    () =>
      order <= MAX_TURN_STRING_ORDER ? dragonTurns(order).join(' ') : null,
    [order]
  )
  const rows = useMemo(
    () => Array.from({ length: TABLE_ROWS }, (_, i) => turnDetail(i + 1)),
    []
  )

  const familyTemplate = TEMPLATES[templateId]
  const familyOrder = Math.min(familyIterations, familyTemplate.maxIterations)
  const familyPoints = useMemo(
    () => rewriteCurve(familyTemplate.template, orientation, familyOrder),
    [familyTemplate, orientation, familyOrder]
  )
  const previousFamilyPoints = useMemo(
    () =>
      familyOrder > 1
        ? rewriteCurve(familyTemplate.template, orientation, familyOrder - 1)
        : [],
    [familyTemplate, orientation, familyOrder]
  )
  const familyName = CURVE_NAMES[`${templateId}:${orientation}`]

  const handleTemplateChange = (id: TemplateId) => {
    setTemplateId(id)
    setFamilyIterations((current) =>
      Math.min(current, TEMPLATES[id].maxIterations)
    )
  }

  return (
    <Layout title="Heighway Dragon - Math KB">
      <div className="container">
        <h1 className="page-title">Heighway Dragon</h1>
        <PageTags pageId="dragon-curve" />
        <p className="page-lead">
          紙テープを同じ向きに何度も半分に折り、すべての折り目を直角に開くと現れる曲線です。折り目の左右は「何回目の折りか」だけで決まり、その単純な規則から自己相似なフラクタルが立ち上がります。
        </p>

        <section className="section">
          <h2 className="section-title">折り目の決まり方</h2>
          <p className="section-text">
            <Tex tex={'n'} /> 回折ったテープには <Tex tex={'2^n - 1'} />{' '}
            本の折り目ができ、開いたあとの線分は <Tex tex={'2^n'} />{' '}
            本になります。
            <Tex tex={'i'} /> 番目の折り目は、
            <Tex tex={'i'} /> から 2 の因子を取り除いた奇数部 <Tex tex={'m'} />{' '}
            だけで決まります。
          </p>
          <div className="formula">
            <Tex tex={'i = m \\cdot 2^k \\quad (m \\text{ は奇数})'} display />
          </div>
          <p className="section-text">
            このとき <Tex tex={'m \\equiv 1 \\pmod 4'} /> なら右折、
            <Tex tex={'m \\equiv 3 \\pmod 4'} /> なら左折です。折り目の列は R R
            L R R L L … と続きます。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              曲線
            </h2>
            <div className="segment" role="radiogroup" aria-label="表示モード">
              {VIEW_MODES.map((item) => (
                <Fragment key={item.id}>
                  <input
                    type="radio"
                    name="view-mode"
                    id={`view-${item.id}`}
                    checked={viewMode === item.id}
                    onChange={() => setViewMode(item.id)}
                  />
                  <label htmlFor={`view-${item.id}`}>{item.label}</label>
                </Fragment>
              ))}
            </div>
          </div>

          <CountSlider
            label="折る回数"
            value={order}
            min={MIN_ORDER}
            max={MAX_ORDER}
            onChange={setOrder}
            readout={`n = ${order}　${2 ** order} 本`}
          />

          <div className="slider-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={showDragonGhost}
                onChange={() => setShowDragonGhost((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">
                1 つ前 (n = {order - 1}) を重ねる
              </span>
            </label>
          </div>

          <div className="flex-center">
            <PolylinePlot
              points={points}
              mode={viewMode}
              ghost={previousPoints}
              showGhost={showDragonGhost}
            />
          </div>

          <p className="section-text">
            {viewMode === 'gradient'
              ? '色は歩いた順です。線が何度も折り返しながら、それでも一度も自分と交差しないことが追えます。'
              : '前半（青）と後半（赤）に塗り分けています。後半は前半をそのまま 90 度回した形で、これが自己相似の正体です。'}
          </p>
          <ul className="formula-list">
            <li>
              線分の本数: <span className="numeric">{2 ** order}</span>
            </li>
            <li>
              占める範囲:{' '}
              <span className="numeric">
                {bounds.maxX - bounds.minX} × {bounds.maxY - bounds.minY}
              </span>{' '}
              マス
            </li>
            <li>
              終点: <span className="numeric">(1 + i)^{order}</span> の位置
            </li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">最初の折り目</h2>
          <p className="section-text">
            <Tex tex={'i'} /> を 2 進数で見ると、末尾の 0 を落とした残りの下 2
            桁が <Tex tex={'01'} /> なら右、
            <Tex tex={'11'} /> なら左になります。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="numeric">i</th>
                  <th className="numeric">2 進数</th>
                  <th className="numeric">奇数部 m</th>
                  <th className="numeric">m mod 4</th>
                  <th className="numeric">折り</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.index}>
                    <td className="numeric">{row.index}</td>
                    <td className="numeric">{row.binary}</td>
                    <td className="numeric">{row.oddPart}</td>
                    <td className="numeric">{row.remainder}</td>
                    <td className="numeric">
                      {row.turn === 'R' ? '右 (R)' : '左 (L)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {turnString ? (
            <p className="section-text">
              n = {order} の折り目列:{' '}
              <span className="numeric">{turnString}</span>
            </p>
          ) : (
            <p className="section-text">
              n = {order} では折り目が {2 ** order - 1}{' '}
              本あるため、列そのものの表示は省いています。
            </p>
          )}
        </section>

        <section className="section">
          <h2 className="section-title">同じ規則の仲間</h2>
          <p className="section-text">
            この曲線は「各辺を決まった形に置き換える」という作り方でも書けます。置き換えの形（テンプレート）と、
            <strong>置き換えをどちら向きに当てるか</strong>の 2
            つを決めるだけで、性格の違う曲線が同じ仕組みから出てきます。
          </p>

          <div className="slider-row">
            <div
              className="segment"
              role="radiogroup"
              aria-label="テンプレート"
            >
              {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
                <Fragment key={id}>
                  <input
                    type="radio"
                    name="template"
                    id={`template-${id}`}
                    checked={templateId === id}
                    onChange={() => handleTemplateChange(id)}
                  />
                  <label htmlFor={`template-${id}`}>
                    {TEMPLATES[id].label}
                  </label>
                </Fragment>
              ))}
            </div>
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
            value={familyOrder}
            min={1}
            max={familyTemplate.maxIterations}
            onChange={setFamilyIterations}
            readout={`${familyOrder} 回　${familyTemplate.branching ** familyOrder} 本`}
          />

          <div className="slider-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={showFamilyGhost}
                onChange={() => setShowFamilyGhost((v) => !v)}
              />
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span className="switch-text">
                1 つ前 ({familyOrder - 1} 回) を重ねる
              </span>
            </label>
          </div>

          <div className="flex-center">
            <PolylinePlot
              points={familyPoints}
              ghost={previousFamilyPoints}
              showGhost={showFamilyGhost}
            />
          </div>
          <p className="section-text center">
            <strong>{familyName}</strong>
          </p>

          <p className="section-text">
            直角のテンプレートは、向きを交互にするとヘイウェイ・ドラゴン、固定するとレヴィ
            C 曲線になります。
            <strong>置き換えの形は同一で、違いは向きだけ</strong>
            です。同じ枠にコッホのテンプレート（中央 1/3 を三角形の 2
            辺に置き換える）を入れれば、固定でコッホ曲線が出てきます。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>テンプレート</th>
                  <th>向き</th>
                  <th>できる曲線</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>直角（2 分割）</td>
                  <td>交互</td>
                  <td>ヘイウェイ・ドラゴン</td>
                </tr>
                <tr>
                  <td>直角（2 分割）</td>
                  <td>固定</td>
                  <td>レヴィ C 曲線</td>
                </tr>
                <tr>
                  <td>コッホ（4 分割）</td>
                  <td>固定</td>
                  <td>コッホ曲線</td>
                </tr>
                <tr>
                  <td>コッホ（4 分割）</td>
                  <td>交互</td>
                  <td>コッホ規則を交互にした変種</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">性質</h2>
          <ul className="formula-list">
            <li>
              どれだけ折っても曲線は自分と交差しません。折り返しが密に見えても、線分が重なることはありません。
            </li>
            <li>
              後半は前半を 90 度回転したものなので、
              <Tex tex={'n'} /> の曲線には <Tex tex={'n-1'} />{' '}
              以下のすべての曲線が入れ子で含まれます。
            </li>
            <li>
              折る回数を増やすと、曲線はある領域を隙間なく塗りつぶしていきます。同じ形を
              4 つ組み合わせると平面を敷き詰められます。
            </li>
            <li>
              領域の境界はフラクタルで、次元はおよそ{' '}
              <span className="numeric">1.5236</span> です。
            </li>
            <li>
              グリッドを一筆で埋める曲線としては{' '}
              <Link href="/hilbert-shuffle" className="link">
                ヒルベルト曲線
              </Link>{' '}
              が対照的で、あちらは正方形の形を保ったまま埋めていきます。
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
