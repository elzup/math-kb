import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import ShuffleStackPlot from '@/components/ShuffleStackPlot'
import type { DeckColorMode } from '@/lib/deckColor'
import {
  perfectInPermutation,
  perfectOutPermutation,
  simulateUntilReturn,
} from '@/lib/riffleShuffle'

const DECK_SIZE = 52

export default function RiffleShufflePage() {
  const [cycleMode, setCycleMode] = useState<'out' | 'in'>('out')
  const [colorMode, setColorMode] = useState<DeckColorMode>('grayscale')

  const cycleResult = useMemo(() => {
    const perm =
      cycleMode === 'out'
        ? perfectOutPermutation(DECK_SIZE)
        : perfectInPermutation(DECK_SIZE)
    return simulateUntilReturn(perm)
  }, [cycleMode])
  const decks = useMemo(
    () => cycleResult.steps.map((step) => step.deck),
    [cycleResult]
  )

  return (
    <Layout title="Riffle Shuffle の周期 - Math KB">
      <div className="container">
        <h1 className="page-title">Riffle Shuffle の周期</h1>
        <PageTags pageId="riffle-shuffle" />
        <p className="page-lead">
          トランプを正確に半分に切って交互に戻す perfect shuffle
          は決定論的な操作です。52 枚のデックを Out-shuffle や In-shuffle
          で繰り返すと、必ず元の順序に戻ります。
        </p>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              元に戻るまでの全過程
            </h2>
            <div
              className="segment"
              role="radiogroup"
              aria-label="Shuffle type"
            >
              <input
                type="radio"
                id="cycle-out"
                name="cycle-mode"
                checked={cycleMode === 'out'}
                onChange={() => setCycleMode('out')}
              />
              <label htmlFor="cycle-out">Out-shuffle</label>
              <input
                type="radio"
                id="cycle-in"
                name="cycle-mode"
                checked={cycleMode === 'in'}
                onChange={() => setCycleMode('in')}
              />
              <label htmlFor="cycle-in">In-shuffle</label>
            </div>
          </div>
          <p className="section-text">
            {cycleMode === 'out' ? 'Out-shuffle' : 'In-shuffle'} の場合、
            {DECK_SIZE} 枚のデックは <strong>{cycleResult.cycleLength}</strong>{' '}
            回で元の順序に戻ります。下の図は 0 回目（初期状態）から{' '}
            {cycleResult.cycleLength} 回目までをすべて表示しています。
          </p>
          <div
            className="slider-row"
            style={{ marginBottom: 'var(--size-3)', marginTop: 0 }}
          >
            <div className="segment" role="radiogroup" aria-label="Color mode">
              <input
                type="radio"
                id="color-grayscale"
                name="color-mode"
                checked={colorMode === 'grayscale'}
                onChange={() => setColorMode('grayscale')}
              />
              <label htmlFor="color-grayscale">白黒</label>
              <input
                type="radio"
                id="color-color"
                name="color-mode"
                checked={colorMode === 'color'}
                onChange={() => setColorMode('color')}
              />
              <label htmlFor="color-color">色相</label>
            </div>
          </div>
          <ShuffleStackPlot
            steps={decks}
            colorMode={colorMode}
            rowHeight={28}
          />
        </section>

        <section className="section">
          <h2 className="section-title">Rising Sequence の数</h2>
          <p className="section-text">
            Rising sequence
            は、シャッフル後の山を上から見たときに、元の順序で連続している部分列の数です。1
            回の perfect shuffle で最大 2 倍に増え、元に戻ると 1 になります。
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ステップ</th>
                  <th className="numeric">Rising Sequence 数</th>
                  <th>備考</th>
                </tr>
              </thead>
              <tbody>
                {cycleResult.steps.map((step) => (
                  <tr key={step.step}>
                    <td>{step.step}</td>
                    <td className="numeric">{step.risingSequenceCount}</td>
                    <td>
                      {step.step === 0
                        ? '初期状態'
                        : step.step === cycleResult.cycleLength
                          ? '元に戻る'
                          : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}
