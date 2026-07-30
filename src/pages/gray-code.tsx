import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import { generateGrayCode } from '@/lib/grayCode'

const BITS_OPTIONS = [2, 3, 4, 5]

const bitStyle = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.12em',
} as const

export default function GrayCodePage() {
  const [bits, setBits] = useState(3)
  const [step, setStep] = useState(0)

  const entries = useMemo(() => generateGrayCode(bits), [bits])
  const current = entries[step]

  const handleBitsChange = (value: number) => {
    setBits(value)
    setStep(0)
  }

  return (
    <Layout title="Gray Code - Math KB">
      <div className="container">
        <h1 className="page-title">Gray Code</h1>
        <PageTags pageId="gray-code" />
        <p className="page-lead">
          隣り合う値が 1 ビットだけ異なる二進符号です。
          <Tex tex="g(i) = i \\oplus (i \\gg 1)" />{' '}
          の式で生成でき、デジタル通信やエンコーダーで広く使われます。
        </p>

        <section className="section">
          <h2 className="section-title">定義</h2>
          <p className="section-text">
            非負整数 <Tex tex="i" /> に対して、Gray code <Tex tex="g(i)" />{' '}
            は次の式で定義されます。
          </p>
          <div className="formula">
            <Tex tex="g(i) = i \\oplus (i \\gg 1)" display />
          </div>
          <p className="section-text">
            <Tex tex="\\oplus" /> は排他的論理和（XOR）、
            <Tex tex="\\gg" /> は右シフトを表します。
          </p>
        </section>

        <section className="section">
          <div className="slider-row">
            <h2 className="section-title" style={{ margin: 0 }}>
              生成テーブル
            </h2>
            <label className="slider-label">
              ビット数
              <select
                value={bits}
                onChange={(e) => handleBitsChange(Number(e.target.value))}
                className="select"
              >
                {BITS_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b} bits
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--size-3)',
              marginBottom: 'var(--size-4)',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="button button-secondary"
            >
              ← 前へ
            </button>
            <span className="numeric">
              Step {step + 1} / {entries.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setStep((s) => Math.min(entries.length - 1, s + 1))
              }
              disabled={step === entries.length - 1}
              className="button button-secondary"
            >
              次へ →
            </button>
            <button type="button" onClick={() => setStep(0)} className="button">
              リセット
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="numeric">i</th>
                  <th className="numeric">Binary</th>
                  <th className="numeric">
                    <Tex tex="i \\gg 1" />
                  </th>
                  <th className="numeric">Gray Code</th>
                  <th className="numeric">Dec</th>
                  <th className="numeric">Changed Bit</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const prev = idx > 0 ? entries[idx - 1] : null
                  const isCurrent = idx === step

                  return (
                    <tr
                      key={entry.index}
                      style={
                        isCurrent
                          ? { background: 'var(--accent-light)' }
                          : undefined
                      }
                    >
                      <td className="numeric">{entry.index}</td>
                      <td className="numeric">{entry.binary}</td>
                      <td className="numeric">{entry.shiftedBinary}</td>
                      <td className="numeric">
                        <span style={bitStyle}>
                          {entry.grayBinary.split('').map((bit, bitIdx) => {
                            const changed =
                              prev !== null && bit !== prev.grayBinary[bitIdx]
                            return (
                              <span
                                key={bitIdx}
                                style={
                                  changed
                                    ? {
                                        background: 'var(--brand)',
                                        color: 'var(--surface)',
                                        borderRadius: 2,
                                        padding: '0 2px',
                                      }
                                    : undefined
                                }
                              >
                                {bit}
                              </span>
                            )
                          })}
                        </span>
                      </td>
                      <td className="numeric">{entry.grayDecimal}</td>
                      <td className="numeric">
                        {prev ? (
                          <span
                            style={{
                              ...bitStyle,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {entry.grayBinary.split('').map((bit, bitIdx) => {
                              const changed = bit !== prev.grayBinary[bitIdx]
                              return (
                                <span
                                  key={bitIdx}
                                  style={
                                    changed
                                      ? {
                                          color: 'var(--brand)',
                                          fontWeight: 'var(--font-weight-7)',
                                        }
                                      : undefined
                                  }
                                >
                                  {changed ? '▼' : '·'}
                                </span>
                              )
                            })}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">ステップ {step + 1} の計算</h2>
          <div className="formula">
            <Tex
              tex={`g(${current.index}) = ${current.index} \\oplus (${current.index} \\gg 1) = ${current.grayDecimal}`}
              display
            />
          </div>
          <ul className="formula-list">
            <li>
              2 進数: <span className="numeric">{current.binary}</span> （
              {current.index}）
            </li>
            <li>
              右シフト: <span className="numeric">{current.shiftedBinary}</span>{' '}
              （{current.index >> 1}）
            </li>
            <li>
              XOR 結果: <span className="numeric">{current.grayBinary}</span> （
              {current.grayDecimal}）
            </li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">Gray Code の性質</h2>
          <ul className="formula-list">
            <li>隣り合う値同士の Hamming 距離は常に 1 です。</li>
            <li>最後の値と最初の値も 1 ビットだけ異なり、巡回的です。</li>
            <li>
              誤り訂正、デジタル通信、ロータリーエンコーダーなどで使われます。
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  )
}
