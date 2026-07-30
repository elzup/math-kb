export type GrayCodeEntry = {
  index: number
  binary: string
  shiftedBinary: string
  grayBinary: string
  grayDecimal: number
  formula: string
}

/**
 * Generate the binary-reflected Gray code sequence for a given bit width.
 * The i-th Gray code is defined as g(i) = i ^ (i >> 1).
 */
export function generateGrayCode(bits: number): GrayCodeEntry[] {
  const count = 2 ** bits
  const entries: GrayCodeEntry[] = []

  for (let i = 0; i < count; i++) {
    const gray = i ^ (i >> 1)
    entries.push({
      index: i,
      binary: i.toString(2).padStart(bits, '0'),
      shiftedBinary: (i >> 1).toString(2).padStart(bits, '0'),
      grayBinary: gray.toString(2).padStart(bits, '0'),
      grayDecimal: gray,
      formula: `${i} XOR (${i} >> 1) = ${i} XOR ${i >> 1} = ${gray}`,
    })
  }

  return entries
}
