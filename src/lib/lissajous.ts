export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth'

export const WAVEFORM_LABELS: Record<WaveformType, string> = {
  sine: 'Sine',
  triangle: 'Triangle',
  square: 'Square',
  sawtooth: 'Sawtooth',
}

export const waveforms: Record<
  WaveformType | 'custom',
  (t: number, customPoints?: number[]) => number
> = {
  sine: (t) => Math.sin(t),
  triangle: (t) => {
    const normalized = ((t / Math.PI) % 2) - 1
    return 2 * Math.abs(normalized) - 1
  },
  square: (t) => (Math.sin(t) >= 0 ? 1 : -1),
  sawtooth: (t) => 2 * ((t / (Math.PI * 2)) % 1) - 1,
  custom: (t, customPoints) => {
    if (!customPoints || customPoints.length === 0) return Math.sin(t)
    const normalized = ((t / (Math.PI * 2)) % 1) * customPoints.length
    const index = Math.floor(normalized)
    const frac = normalized - index
    const p1 = customPoints[index % customPoints.length]
    const p2 = customPoints[(index + 1) % customPoints.length]
    return p1 + (p2 - p1) * frac
  },
}

export function generateWaveformPoints(
  waveform: WaveformType,
  length = 16
): number[] {
  const waveFn = waveforms[waveform]
  return Array.from({ length }, (_, i) => {
    const t = (i / length) * Math.PI * 2
    return waveFn(t)
  })
}
