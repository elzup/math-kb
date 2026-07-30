export type CollatzPoint = {
  x: number
  y: number
}

export type CollatzTree = {
  plots: CollatzPoint[]
  subplots: CollatzPoint[]
  counts: Record<number, number>
}

/**
 * tools/src/pages/collatz-graph.tsx と同じ探索ロジックで、
 * Collatz 写像の逆方向から到達可能な数をレベルごとに列挙します。
 */
export function buildCollatzTree({
  depth,
  maxY,
}: {
  depth: number
  maxY: number
}): CollatzTree {
  const counts: Record<number, number> = { 1: 1 }
  const plots: CollatzPoint[] = []
  const subplots: CollatzPoint[] = []
  let nums: number[] = [1]

  for (let i = 0; i < depth; i++) {
    const newNums: number[] = [1]

    for (const v of nums) {
      const poss: number[] = [v * 2]

      if ((v - 1) % 3 === 0 && v !== 1) {
        poss.push((v - 1) / 3)
      }

      for (const pos of poss) {
        if (!counts[pos]) {
          counts[pos] = 1
          newNums.push(pos)
          plots.push({ x: i, y: pos })
        } else {
          counts[pos]++
          if (maxY >= pos) {
            subplots.push({ x: i, y: pos })
          }
        }
      }
    }

    nums = newNums
  }

  return { plots, subplots, counts }
}
