import { useMemo, useState } from 'react'
import ChaosGameCanvas from '@/components/ChaosGameCanvas'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'

const MAX_POINTS_PER_SECOND = 2400

function speedFromSlider(value: number): number {
  return Math.max(1, Math.round(MAX_POINTS_PER_SECOND ** (value / 100)))
}

export default function ChaosGamePage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speedSlider, setSpeedSlider] = useState(46)
  const [pointRadius, setPointRadius] = useState(1.25)
  const [pointCount, setPointCount] = useState(1)
  const [resetVersion, setResetVersion] = useState(0)
  const pointsPerSecond = useMemo(
    () => speedFromSlider(speedSlider),
    [speedSlider]
  )

  return (
    <Layout title="カオスゲーム - Math KB">
      <div className="container">
        <h1 className="page-title">カオスゲーム</h1>
        <PageTags pageId="chaos-game" />
        <p className="page-lead">
          三角形の中で「頂点をランダムに選び、ちょうど中点へ移動する」を繰り返します。単純なルールから、点のない三角形が少しずつ現れる様子を観察できます。
        </p>

        <section className="section chaos-game-lab">
          <div className="chaos-toolbar">
            <div className="chaos-control">
              <label htmlFor="chaos-speed">
                速度
                <span className="numeric">
                  {pointsPerSecond.toLocaleString()} 点/秒
                </span>
              </label>
              <input
                id="chaos-speed"
                className="slider"
                type="range"
                min="0"
                max="100"
                value={speedSlider}
                onChange={(event) => setSpeedSlider(Number(event.target.value))}
              />
            </div>
            <div className="chaos-control">
              <label htmlFor="chaos-point-radius">
                点の太さ
                <span className="numeric">{pointRadius.toFixed(2)} px</span>
              </label>
              <input
                id="chaos-point-radius"
                className="slider"
                type="range"
                min="0.5"
                max="4"
                step="0.25"
                value={pointRadius}
                onChange={(event) => setPointRadius(Number(event.target.value))}
              />
            </div>
            <div className="chaos-actions">
              <button
                type="button"
                className="button"
                onClick={() => setIsPlaying((current) => !current)}
              >
                {isPlaying ? '一時停止' : '再生'}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setResetVersion((current) => current + 1)}
              >
                リセット
              </button>
            </div>
          </div>

          <ChaosGameCanvas
            isPlaying={isPlaying}
            pointsPerSecond={pointsPerSecond}
            pointRadius={pointRadius}
            resetVersion={resetVersion}
            onPointCountChange={setPointCount}
          />
          <div className="chaos-status">
            <span
              className={
                isPlaying ? 'chaos-status-dot active' : 'chaos-status-dot'
              }
            />
            <span>{isPlaying ? 'プロット中' : '一時停止中'}</span>
            <span className="numeric">{pointCount.toLocaleString()} 点</span>
            <span>点の太さを変えると最初から描き直します</span>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">ルール</h2>
          <ol className="formula-list ordered">
            <li>三角形の中に、最初の点をランダムに置きます。</li>
            <li>3 つの頂点 A・B・C から 1 つをランダムに選びます。</li>
            <li>
              現在の点と選んだ頂点を結び、そのちょうど中点に点を打ちます。
            </li>
            <li>補助線を消し、新しい点を現在の点として繰り返します。</li>
          </ol>
          <div className="formula">
            <Tex tex={'P_{n+1} = \\frac{P_n + V_n}{2}'} display />
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">なぜ三角形の穴が残るのか</h2>
          <p className="section-text">
            どの頂点を選んでも、新しい点はその頂点側の半分の三角形に入ります。中央の逆向きの三角形には最初の移動から入れません。同じことが小さな三角形の中でも繰り返されるため、自己相似なシェルピンスキーの三角形が現れます。
          </p>
        </section>
      </div>
    </Layout>
  )
}
