import type { Tag } from './tags'

export type PageCategory = {
  id: string
  label: string
  description: string
}

export type PageMeta = {
  id: string
  href: string
  title: string
  description: string
  categoryId: string
  tagIds: string[]
  icon: string
}

export const PAGE_CATEGORIES: PageCategory[] = [
  {
    id: 'number-theory',
    label: '数論',
    description: '整数の性質や数列を扱うトピック。',
  },
  {
    id: 'probability-combinatorics',
    label: '確率・組み合わせ',
    description: '確率過程や組み合わせを扱うトピック。',
  },
  {
    id: 'numerical-analysis',
    label: '数値解析',
    description: 'コンピュータを使った数値計算の手法。',
  },
  {
    id: 'geometry',
    label: '幾何学',
    description: '図形や曲線、空間の性質を扱うトピック。',
  },
]

export const PAGES: PageMeta[] = [
  {
    id: 'van-der-corput',
    href: '/van-der-corput',
    title: 'Van der Corput Sequence',
    description:
      '1 次元の低差異数列。整数の桁を逆順にして小数点以下に並べます。',
    categoryId: 'number-theory',
    tagIds: [
      'low-discrepancy-sequence',
      'van-der-corput-sequence',
      'number-theory',
    ],
    icon: '⊥',
  },
  {
    id: 'halton',
    href: '/halton',
    title: 'Halton Sequence',
    description:
      '異なる素数底の Van der Corput を組み合わせた 2 次元低差異数列。',
    categoryId: 'number-theory',
    tagIds: [
      'low-discrepancy-sequence',
      'van-der-corput-sequence',
      'halton-sequence',
      'number-theory',
      'quasi-monte-carlo',
    ],
    icon: '⊞',
  },
  {
    id: 'monte-carlo',
    href: '/monte-carlo',
    title: 'Monte Carlo 収束比較',
    description:
      'ランダムサンプリングと低差異数列で π を推定し、収束速度を比較します。',
    categoryId: 'numerical-analysis',
    tagIds: [
      'monte-carlo-method',
      'quasi-monte-carlo',
      'numerical-integration',
      'probability',
      'pi',
    ],
    icon: 'π',
  },
  {
    id: 'riffle-shuffle',
    href: '/riffle-shuffle',
    title: 'Riffle Shuffle シミュレーション',
    description:
      'リフルシャッフルの各ステップを可視化し、Rising Sequence の数を確認します。',
    categoryId: 'probability-combinatorics',
    tagIds: [
      'riffle-shuffle',
      'card-shuffling',
      'combinatorics',
      'probability',
      'markov-chain',
    ],
    icon: '♠',
  },
  {
    id: 'collatz-graph',
    href: '/collatz-graph',
    title: 'Collatz Graph',
    description: 'コラッツ予想の逆方向探索木をレベルごとに可視化します。',
    categoryId: 'number-theory',
    tagIds: ['number-theory', 'collatz-conjecture'],
    icon: '↺',
  },
  {
    id: 'gray-code',
    href: '/gray-code',
    title: 'Gray Code',
    description: '隣り合う値が 1 ビットだけ異なる二進符号を可視化します。',
    categoryId: 'number-theory',
    tagIds: ['number-theory', 'gray-code', 'binary'],
    icon: '⊕',
  },
  {
    id: 'weekday-calc',
    href: '/weekday-calc',
    title: '曜日計算',
    description:
      '世紀コード・年コード・月コードを使って、任意の日付の曜日を計算し、ステップを可視化します。',
    categoryId: 'number-theory',
    tagIds: ['number-theory', 'calendar', 'modular-arithmetic', 'algorithm'],
    icon: '📅',
  },
  {
    id: 'lissajous',
    href: '/lissajous',
    title: 'Lissajous Curve Grid',
    description:
      '2 つの直交する調和振動を合成したリサジュー曲線を、周波数比のグリッドで可視化します。',
    categoryId: 'geometry',
    tagIds: [
      'lissajous-curve',
      'parametric-curve',
      'harmonic-motion',
      'waveform',
      'geometry',
    ],
    icon: '∞',
  },
  {
    id: 'hilbert-shuffle',
    href: '/hilbert-shuffle',
    title: 'Hilbert Curve Shuffle',
    description:
      'グリッドに並べたカードをヒルベルト曲線の順に拾い直して得られるシャッフルを可視化します。',
    categoryId: 'probability-combinatorics',
    tagIds: [
      'hilbert-curve',
      'space-filling-curve',
      'permutation',
      'geometry',
      'combinatorics',
    ],
    icon: '⊓',
  },
  {
    id: 'dragon-curve',
    href: '/dragon-curve',
    title: 'Heighway Dragon',
    description:
      '紙を繰り返し折って開くと現れるドラゴン曲線を、折り目の規則と辺の書き換えの両面から可視化します。',
    categoryId: 'geometry',
    tagIds: [
      'dragon-curve',
      'fractal',
      'space-filling-curve',
      'binary',
      'geometry',
    ],
    icon: '🐉',
  },
]

export const PAGE_BY_ID = new Map(PAGES.map((page) => [page.id, page]))
export const PAGES_BY_CATEGORY = new Map(
  PAGE_CATEGORIES.map((category) => [
    category.id,
    PAGES.filter((page) => page.categoryId === category.id),
  ])
)

export function getPageTags(page: PageMeta, tagById: Map<string, Tag>): Tag[] {
  return page.tagIds
    .map((id) => tagById.get(id))
    .filter((tag): tag is Tag => tag !== undefined)
}
