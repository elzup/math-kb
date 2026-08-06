import { type ReactNode, useId } from 'react'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Shown at the end of the row, e.g. the value with its unit. */
  readout?: ReactNode
}

/**
 * A slider for an integer count, with nudge buttons either side so a single
 * step is reachable without fighting the drag.
 */
export default function CountSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  readout,
}: Props) {
  const id = useId()
  const nudge = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)))

  return (
    <div className="slider-row">
      <label className="slider-label" htmlFor={id}>
        {label}
      </label>
      <div className="count-slider">
        <button
          type="button"
          className="button button-secondary button-compact"
          onClick={() => nudge(-step)}
          disabled={value <= min}
          aria-label={`${label}を減らす`}
        >
          −
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider"
        />
        <button
          type="button"
          className="button button-secondary button-compact"
          onClick={() => nudge(step)}
          disabled={value >= max}
          aria-label={`${label}を増やす`}
        >
          +
        </button>
      </div>
      {readout ? <span className="count-slider-readout">{readout}</span> : null}
    </div>
  )
}
