import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import {
  calculateWeekday,
  CODE_LABEL,
  MONTH_CODES,
  YEAR_COMBINED_MOD7,
  type WeekdayResult,
  type WeekdayStep,
} from '@/lib/weekdayCalc'

const WEEKDAY_COLORS = [
  '#dc2626', // Sun
  'var(--text)',
  'var(--text)',
  'var(--text)',
  'var(--text)',
  'var(--text)',
  '#2563eb', // Sat
]

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const NODE_COLORS: Record<string, string> = {
  century_code: '#16a34a',
  year_extract: '#2563eb',
  year_div4: '#2563eb',
  month_code: '#d97706',
  day: 'var(--text-muted)',
}

const MONTH_MEMO_GROUP: Record<number, string> = {
  1: 'zero',
  10: 'zero',
  4: 'swap',
  6: 'swap',
  2: 'three',
  3: 'three',
  9: 'chain',
  12: 'chain',
  5: 'chain',
  11: 'solo3',
  7: 'memorize',
  8: 'memorize',
}

const CENTURY_GRID_COLS = [6, 4, 2, 0] as const
const CENTURY_ROWS: (number | null)[][] = [
  [null, null, null, 15],
  [16, 17, 18, 19],
  [20, 21, 22, 23],
  [24, 25, 26, 27],
]

const YEAR_CODE_GROUPS: number[][] = Array.from({ length: 7 }, (_, code) =>
  YEAR_COMBINED_MOD7.reduce<number[]>(
    (acc, v, y) => (v === code ? [...acc, y] : acc),
    []
  )
)

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type RevealNodeProps = {
  testMode: boolean
  className?: string
  style?: React.CSSProperties
  masked: React.ReactNode
  children: React.ReactNode
  onReveal?: () => void
}

function RevealNode({
  testMode,
  className = '',
  style,
  masked,
  children,
  onReveal,
}: RevealNodeProps) {
  const [revealed, setRevealed] = useState(false)
  const isHidden = testMode && !revealed

  return (
    <div
      className={`wc-flow-node ${className} ${isHidden ? 'wc-node--masked' : ''}`}
      style={style}
      onClick={() => {
        if (!testMode) return
        setRevealed((v) => {
          if (!v && onReveal) onReveal()
          return !v
        })
      }}
      role={testMode ? 'button' : undefined}
      tabIndex={testMode ? 0 : undefined}
    >
      {isHidden ? masked : children}
    </div>
  )
}

function MonthCodeGrid() {
  return (
    <div className="wc-ref-card wc-ref-card--month">
      <span className="wc-ref-title">月コード (m)</span>
      <div className="wc-mcode-grid">
        <div className="wc-mcode-cell wc-mcode-header" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="wc-mcode-cell wc-mcode-header">
            {CODE_LABEL(i)}
          </div>
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const month = i + 1
          const code = MONTH_CODES[month]
          const group = MONTH_MEMO_GROUP[month]
          return (
            <Fragment key={month}>
              <div className="wc-mcode-cell wc-mcode-month">{month}月</div>
              {Array.from({ length: 7 }, (_, c) => (
                <div
                  key={`${month}-${c}`}
                  className={`wc-mcode-cell ${
                    c === code ? `wc-mcode-active wc-mcode-g-${group}` : ''
                  }`}
                >
                  {c === code ? code : ''}
                </div>
              ))}
            </Fragment>
          )
        })}
      </div>
      <div className="wc-mcode-legend">
        <span className="wc-mcode-leg wc-mcode-g-zero">0: 1,10月</span>
        <span className="wc-mcode-leg wc-mcode-g-swap">swap: 4↔6</span>
        <span className="wc-mcode-leg wc-mcode-g-three">3: 2,3月→4月=6</span>
        <span className="wc-mcode-leg wc-mcode-g-chain">chain: 9,12→5→1</span>
        <span className="wc-mcode-leg wc-mcode-g-solo3">3: 11月</span>
        <span className="wc-mcode-leg wc-mcode-g-memorize">暗記: 7,8月</span>
      </div>
    </div>
  )
}

function CenturyGrid() {
  return (
    <div className="wc-ref-card wc-ref-card--century">
      <span className="wc-ref-title">世紀コード (C)</span>
      <div className="wc-century-grid">
        {CENTURY_GRID_COLS.map((code) => (
          <div key={code} className="wc-century-cell wc-century-header">
            {CODE_LABEL(code)}
          </div>
        ))}
        {CENTURY_ROWS.flat().map((c, i) => (
          <div key={i} className="wc-century-cell">
            {c !== null ? `${c}xx` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function WeekdayBar() {
  return (
    <div className="wc-ref-card wc-ref-card--weekday">
      <div className="wc-weekday-bar">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="wc-weekday-bar-cell"
            style={{ color: WEEKDAY_COLORS[i] }}
          >
            <span className="wc-weekday-bar-no">{i}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function YearCodeGroupBox({ highlightYear }: { highlightYear?: number }) {
  return (
    <div className="wc-ref-card wc-ref-card--year-group">
      <span className="wc-ref-title">年コード — グループ別</span>
      <div className="wc-year-code-groups">
        {YEAR_CODE_GROUPS.map((years, code) => (
          <div key={code} className="wc-year-code-group-row">
            <span className={`wc-year-code-group-label wc-ycg-code-${code}`}>
              {CODE_LABEL(code)}
            </span>
            <span className="wc-year-code-group-sep">:</span>
            <span className="wc-year-code-group-years">
              {years.map((y) => (
                <span
                  key={y}
                  className={`wc-year-code-group-y${
                    y === highlightYear ? ' wc-year-combined-highlight' : ''
                  }`}
                >
                  {String(y).padStart(2, '0')}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function YearCombinedTable({ highlightYear }: { highlightYear?: number }) {
  return (
    <div className="wc-ref-card wc-ref-card--year-table">
      <span className="wc-ref-title">年コード (y+⌊y/4⌋)%7 — 28区切り</span>
      <div className="wc-year-combined-columns">
        {Array.from({ length: 4 }, (_, col) => (
          <div key={col} className="wc-year-combined-col">
            {Array.from({ length: 28 }, (_, row) => {
              const y = col * 28 + row
              if (y > 99)
                return <div key={y} className="wc-year-combined-cell" />
              const code = YEAR_COMBINED_MOD7[y]
              const isZero = code === 0
              const isSameAsLastDigit = code === y % 10
              const classes = [
                'wc-year-combined-cell',
                y === highlightYear ? 'wc-year-combined-highlight' : '',
                y > 0 && y % 10 === 0
                  ? 'wc-year-combined-gap10'
                  : y > 0 && y % 4 === 0
                    ? 'wc-year-combined-gap'
                    : '',
                isZero ? 'wc-year-combined-zero' : '',
                isSameAsLastDigit ? 'wc-year-combined-same' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div key={y} className={classes}>
                  <span className="wc-year-combined-y">
                    {String(y).padStart(2, '0')}
                  </span>
                  <span className="wc-year-combined-code">{code}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function YearCombinedGrid10({ highlightYear }: { highlightYear?: number }) {
  return (
    <div className="wc-ref-card wc-ref-card--year-grid10">
      <span className="wc-ref-title">年コード (y+⌊y/4⌋)%7 — 10区切り</span>
      <div className="wc-year-combined-grid10">
        {Array.from({ length: 100 }, (_, i) => {
          const col = Math.floor(i / 10)
          const row = i % 10
          const y = row * 10 + col
          const code = YEAR_COMBINED_MOD7[y]
          const classes = [
            'wc-year-combined-cell',
            y === highlightYear ? 'wc-year-combined-highlight' : '',
            code === 0 ? 'wc-year-combined-zero' : '',
            code === y % 10 ? 'wc-year-combined-same' : '',
            y % 4 === 0 && y % 10 !== 0 ? 'wc-year-grid10-sep' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div key={y} className={classes}>
              <span className="wc-year-combined-y">
                {String(y).padStart(2, '0')}
              </span>
              <span className="wc-year-combined-code">{code}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function WeekdayCalcExplainer() {
  const [dateInput, setDateInput] = useState(todayStr())
  const [result, setResult] = useState<WeekdayResult | null>(() =>
    calculateWeekday(todayStr())
  )
  const [error, setError] = useState('')
  const [testMode, setTestMode] = useState(false)
  const [testKey, setTestKey] = useState(0)

  const [swStartTime, setSwStartTime] = useState<number | null>(null)
  const [swElapsed, setSwElapsed] = useState<number | null>(null)
  const [swRunning, setSwRunning] = useState(false)
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [swHistory, setSwHistory] = useState<
    { date: string; elapsed: number }[]
  >([])
  const swDateRef = useRef<string>('')

  const stopStopwatch = useCallback(() => {
    if (swIntervalRef.current !== null) {
      clearInterval(swIntervalRef.current)
      swIntervalRef.current = null
    }
    setSwRunning((wasRunning) => {
      if (wasRunning && swStartTime !== null) {
        const finalElapsed = Date.now() - swStartTime
        setSwElapsed(finalElapsed)
        if (finalElapsed < 60_000) {
          setSwHistory((prev) => [
            ...prev,
            { date: swDateRef.current, elapsed: finalElapsed },
          ])
        }
      }
      return false
    })
  }, [swStartTime])

  const startStopwatch = useCallback(() => {
    stopStopwatch()
    const now = Date.now()
    setSwStartTime(now)
    setSwElapsed(0)
    setSwRunning(true)
    swIntervalRef.current = setInterval(() => {
      setSwElapsed(Date.now() - now)
    }, 10)
  }, [stopStopwatch])

  useEffect(() => {
    return () => {
      if (swIntervalRef.current !== null) clearInterval(swIntervalRef.current)
    }
  }, [])

  const handleCalc = () => {
    const r = calculateWeekday(dateInput)
    if (r === null) {
      setError('無効な日付です (対応範囲: 1500-01-01 ~ 2599-12-31)')
      setResult(null)
      return
    }
    setError('')
    setResult(r)
    setTestKey((k) => k + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCalc()
  }

  const handleRandom = () => {
    const minDate = new Date(1582, 9, 15).getTime()
    const maxDate = new Date(2582, 9, 15).getTime()
    const d = new Date(minDate + Math.random() * (maxDate - minDate))
    const str = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
    setDateInput(str)
    const r = calculateWeekday(str)
    if (r) {
      setError('')
      setResult(r)
      setTestKey((k) => k + 1)
      if (testMode) {
        swDateRef.current = str
        startStopwatch()
      }
    }
  }

  const renderBranchCol = (step: WeekdayStep) => {
    const mod7Val = ((step.value % 7) + 7) % 7
    const needsMod = step.value >= 7
    return (
      <div key={step.name} className="wc-flow-branch-col">
        <RevealNode
          testMode={testMode}
          className="wc-flow-node--calc"
          style={
            { '--node-color': NODE_COLORS[step.name] } as React.CSSProperties
          }
          masked={<span className="wc-flow-label">{step.label}</span>}
        >
          <span className="wc-flow-label">{step.label}</span>
          <span className="wc-flow-value">{step.value}</span>
          <span className="wc-flow-explain">{step.explain}</span>
        </RevealNode>
        {needsMod ? (
          <>
            <div className="wc-flow-arrow wc-flow-arrow--small" />
            <RevealNode
              testMode={testMode}
              className="wc-flow-node--mod7-pre"
              masked={<span className="wc-flow-label">%7</span>}
            >
              <span className="wc-flow-label">%7</span>
              <span className="wc-flow-value">{mod7Val}</span>
            </RevealNode>
          </>
        ) : (
          <div className="wc-flow-spacer" />
        )}
      </div>
    )
  }

  const highlightYear = result
    ? parseInt(result.input.slice(0, 4), 10) % 100
    : undefined

  return (
    <div className="weekday-calc">
      <div className="wc-input-row">
        <input
          type="text"
          className="input wc-date-input"
          placeholder="YYYY/MM/DD"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="button" onClick={handleCalc}>
          Explain
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleRandom}
        >
          Random
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={testMode}
            onChange={() => {
              setTestMode((v) => !v)
              setTestKey((k) => k + 1)
              stopStopwatch()
              setSwElapsed(null)
              setSwHistory([])
            }}
          />
          <span className="switch-track">
            <span className="switch-thumb" />
          </span>
          <span className="switch-text">Test</span>
        </label>
        {testMode && swElapsed !== null && (
          <div
            className={`wc-stopwatch ${
              swRunning ? 'wc-stopwatch--running' : 'wc-stopwatch--stopped'
            }`}
          >
            <span className="wc-stopwatch-time">
              {(swElapsed / 1000).toFixed(2)}s
            </span>
          </div>
        )}
      </div>

      {testMode && swHistory.length > 0 && (
        <div className="wc-sw-history">
          <div className="wc-sw-history-list">
            {[...swHistory].reverse().map((h, i) => (
              <div
                key={swHistory.length - 1 - i}
                className="wc-sw-history-item"
              >
                <span className="wc-sw-history-no">
                  #{swHistory.length - i}
                </span>
                <span className="wc-sw-history-date">{h.date}</span>
                <span className="wc-sw-history-time">
                  {(h.elapsed / 1000).toFixed(2)}s
                </span>
              </div>
            ))}
          </div>
          {swHistory.length >= 2 && (
            <span className="wc-sw-history-summary">
              avg:{' '}
              {(
                swHistory.reduce((s, h) => s + h.elapsed, 0) /
                swHistory.length /
                1000
              ).toFixed(2)}
              s / best:{' '}
              {(Math.min(...swHistory.map((h) => h.elapsed)) / 1000).toFixed(2)}
              s / {swHistory.length}回
            </span>
          )}
        </div>
      )}

      {error && <div className="wc-error">{error}</div>}

      {result && (
        <div key={testKey}>
          <RevealNode
            testMode={testMode}
            className="wc-result"
            onReveal={stopStopwatch}
            masked={<span className="wc-result-input">{result.input}</span>}
          >
            <span className="wc-result-input">{result.input}</span>
            <span
              className="wc-result-weekday"
              style={{ color: WEEKDAY_COLORS[result.weekdayIndex] }}
            >
              {result.weekday}
            </span>
            <div className="wc-chip-list">
              <span className="wc-chip">{result.month}月</span>
              <span className="wc-chip">
                {result.isLeapYear ? '閏年' : '平年'}
              </span>
              {result.leapAdjust !== 0 && (
                <span className="wc-chip wc-chip--warning">閏年補正 −1</span>
              )}
            </div>
          </RevealNode>

          <div className="formula wc-formula">
            w = (D + m + y + ⌊y/4⌋ + C) mod 7
          </div>

          <div className="wc-main-content">
            <div className="wc-flowchart">
              <div className="wc-flow-node wc-flow-node--input">
                <span className="wc-flow-label">入力日付</span>
                <span className="wc-flow-value">{result.input}</span>
              </div>
              <div className="wc-flow-arrow" />

              <div className="wc-flow-branch">
                {renderBranchCol(result.steps[0])}

                <div className="wc-flow-year-group">
                  <div className="wc-flow-year-pair">
                    {renderBranchCol(result.steps[1])}
                    {renderBranchCol(result.steps[2])}
                  </div>
                  <div className="wc-flow-year-merge">
                    <div className="wc-flow-merge-line" />
                    <div className="wc-flow-merge-line" />
                  </div>
                  <div className="wc-flow-arrow wc-flow-arrow--small" />
                  <RevealNode
                    testMode={testMode}
                    className="wc-flow-node--year-combined"
                    style={
                      {
                        '--node-color': NODE_COLORS.year_extract,
                      } as React.CSSProperties
                    }
                    masked={<span className="wc-flow-label">年コード</span>}
                  >
                    <span className="wc-flow-label">年コード (y+⌊y/4⌋)%7</span>
                    <span className="wc-flow-value">
                      {(((result.steps[1].value + result.steps[2].value) % 7) +
                        7) %
                        7}
                    </span>
                    <span className="wc-flow-explain">
                      ({result.steps[1].value} + {result.steps[2].value}) % 7 ={' '}
                      {(((result.steps[1].value + result.steps[2].value) % 7) +
                        7) %
                        7}
                    </span>
                  </RevealNode>
                </div>

                {renderBranchCol(result.steps[3])}
                {renderBranchCol(result.steps[4])}
              </div>

              <div className="wc-flow-merge-arrows">
                {['century', 'year', 'month', 'day'].map((k) => (
                  <div key={k} className="wc-flow-merge-line" />
                ))}
              </div>
              <div className="wc-flow-arrow" />

              {result.steps
                .filter((s) => s.name === 'sum')
                .map((step) => (
                  <RevealNode
                    key={step.name}
                    testMode={testMode}
                    className="wc-flow-node--sum"
                    masked={<span className="wc-flow-label">{step.label}</span>}
                  >
                    <span className="wc-flow-label">{step.label}</span>
                    <span className="wc-flow-value">{step.value}</span>
                    <span className="wc-flow-explain">{step.explain}</span>
                  </RevealNode>
                ))}
              <div className="wc-flow-arrow" />

              {result.steps
                .filter((s) => s.name === 'mod7')
                .map((step) => (
                  <RevealNode
                    key={step.name}
                    testMode={testMode}
                    className="wc-flow-node--mod"
                    masked={<span className="wc-flow-label">{step.label}</span>}
                  >
                    <span className="wc-flow-label">{step.label}</span>
                    <span className="wc-flow-value">{step.value}</span>
                  </RevealNode>
                ))}
              <div className="wc-flow-arrow" />

              <RevealNode
                testMode={testMode}
                className="wc-flow-node--result"
                style={
                  {
                    '--node-color': WEEKDAY_COLORS[result.weekdayIndex],
                  } as React.CSSProperties
                }
                masked={<span className="wc-flow-label">曜日</span>}
                onReveal={stopStopwatch}
              >
                <span
                  className="wc-flow-value"
                  style={{ color: WEEKDAY_COLORS[result.weekdayIndex] }}
                >
                  {result.weekday}
                </span>
              </RevealNode>
            </div>

            <div className="wc-reference">
              <div className="wc-ref-row">
                <CenturyGrid />
                <MonthCodeGrid />
              </div>
              <WeekdayBar />
              <YearCodeGroupBox highlightYear={highlightYear} />
            </div>
          </div>

          <div className="wc-year-tables-row">
            <YearCombinedTable highlightYear={highlightYear} />
            <YearCombinedGrid10 highlightYear={highlightYear} />
          </div>

          <p className="wc-link">
            <a
              href="https://speed-calendar.com/print/"
              target="_blank"
              rel="noopener noreferrer"
            >
              練習用カレンダー印刷 (speed-calendar.com)
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
