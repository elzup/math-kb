export type TagCategory = 'sequence' | 'method' | 'field' | 'concept'

export type Tag = {
  id: string
  label: string
  category: TagCategory
  description: string
  relatedTagIds: string[]
}

export const TAG_CATEGORIES: Record<TagCategory, string> = {
  sequence: '数列',
  method: '方法',
  field: '分野',
  concept: '概念',
}

export const TAGS: Tag[] = [
  {
    id: 'low-discrepancy-sequence',
    label: '低差異数列',
    category: 'sequence',
    description: '有限個の点をできるだけ均一に分布させる数列。',
    relatedTagIds: ['quasi-monte-carlo', 'numerical-integration'],
  },
  {
    id: 'van-der-corput-sequence',
    label: 'Van der Corput 数列',
    category: 'sequence',
    description: '底 b で整数の桁を逆順に並べた 1 次元低差異数列。',
    relatedTagIds: ['low-discrepancy-sequence', 'halton-sequence'],
  },
  {
    id: 'halton-sequence',
    label: 'Halton 数列',
    category: 'sequence',
    description: '互いに素な底を使った 2 次元低差異数列。',
    relatedTagIds: [
      'low-discrepancy-sequence',
      'van-der-corput-sequence',
      'quasi-monte-carlo',
    ],
  },
  {
    id: 'gray-code',
    label: 'Gray Code',
    category: 'sequence',
    description: '隣り合う値が 1 ビットだけ異なる二進数列表現。',
    relatedTagIds: ['binary', 'number-theory'],
  },
  {
    id: 'monte-carlo-method',
    label: 'Monte Carlo 法',
    category: 'method',
    description: '乱数を使って数値計算やシミュレーションを行う手法。',
    relatedTagIds: ['numerical-integration', 'probability'],
  },
  {
    id: 'quasi-monte-carlo',
    label: '疑似 Monte Carlo 法',
    category: 'method',
    description: '低差異数列を使って Monte Carlo 法を高速化する手法。',
    relatedTagIds: [
      'low-discrepancy-sequence',
      'monte-carlo-method',
      'numerical-integration',
    ],
  },
  {
    id: 'numerical-integration',
    label: '数値積分',
    category: 'method',
    description: 'コンピュータで積分の近似値を求める手法。',
    relatedTagIds: ['monte-carlo-method', 'quasi-monte-carlo'],
  },
  {
    id: 'algorithm',
    label: 'アルゴリズム',
    category: 'method',
    description: '問題を解くための手順や計算方法。',
    relatedTagIds: ['number-theory', 'modular-arithmetic', 'calendar'],
  },
  {
    id: 'probability',
    label: '確率',
    category: 'field',
    description: '不確実性を数学的に扱う分野。',
    relatedTagIds: ['monte-carlo-method'],
  },
  {
    id: 'number-theory',
    label: '数論',
    category: 'field',
    description: '整数や素数の性質を扱う分野。',
    relatedTagIds: [
      'van-der-corput-sequence',
      'halton-sequence',
      'collatz-conjecture',
      'gray-code',
      'binary',
      'calendar',
      'modular-arithmetic',
      'algorithm',
    ],
  },
  {
    id: 'geometry',
    label: '幾何学',
    category: 'field',
    description: '図形や空間の性質を扱う数学分野。',
    relatedTagIds: [
      'lissajous-curve',
      'parametric-curve',
      'harmonic-motion',
      'waveform',
      'hilbert-curve',
      'space-filling-curve',
      'dragon-curve',
      'fractal',
    ],
  },
  {
    id: 'pi',
    label: '円周率',
    category: 'concept',
    description: '円の周長と直径の比を表す定数。',
    relatedTagIds: ['monte-carlo-method', 'numerical-integration'],
  },
  {
    id: 'binary',
    label: '二進法',
    category: 'concept',
    description: '2 を底とする記数法およびその性質。',
    relatedTagIds: ['number-theory', 'gray-code', 'dragon-curve'],
  },
  {
    id: 'collatz-conjecture',
    label: 'コラッツ予想',
    category: 'concept',
    description:
      '任意の正の整数から Collatz 写像を繰り返すと 1 に到達するという未解決問題。',
    relatedTagIds: ['number-theory'],
  },
  {
    id: 'calendar',
    label: '暦',
    category: 'concept',
    description: '日付や曜日、閏年を扱う暦に関する概念。',
    relatedTagIds: ['number-theory', 'modular-arithmetic', 'algorithm'],
  },
  {
    id: 'modular-arithmetic',
    label: '合同算術',
    category: 'concept',
    description: '剰余を用いた整数の計算体系。',
    relatedTagIds: ['number-theory', 'calendar', 'algorithm'],
  },
  {
    id: 'lissajous-curve',
    label: 'Lissajous Curve',
    category: 'concept',
    description: '2 つの直交する調和振動の合成によって描かれる曲線。',
    relatedTagIds: [
      'geometry',
      'parametric-curve',
      'harmonic-motion',
      'waveform',
    ],
  },
  {
    id: 'parametric-curve',
    label: '媒介変数表示',
    category: 'concept',
    description: 'パラメータを用いて表される曲線。',
    relatedTagIds: ['geometry', 'lissajous-curve'],
  },
  {
    id: 'harmonic-motion',
    label: '調和振動',
    category: 'concept',
    description: '正弦波に従う周期的な振動。',
    relatedTagIds: ['geometry', 'lissajous-curve', 'waveform'],
  },
  {
    id: 'waveform',
    label: '波形',
    category: 'concept',
    description: '音や信号の振幅の時間変化を表す形状。',
    relatedTagIds: ['geometry', 'lissajous-curve', 'harmonic-motion'],
  },
  {
    id: 'riffle-shuffle',
    label: 'Riffle Shuffle',
    category: 'method',
    description: '山を 2 つに分けて交互に落とし込むカードシャッフル。',
    relatedTagIds: ['card-shuffling', 'combinatorics', 'probability'],
  },
  {
    id: 'card-shuffling',
    label: 'カードシャッフル',
    category: 'method',
    description: 'カードの山を混ぜる操作全般。',
    relatedTagIds: ['riffle-shuffle', 'probability', 'combinatorics'],
  },
  {
    id: 'combinatorics',
    label: '組み合わせ論',
    category: 'field',
    description: '組み合わせや順列を扱う数学分野。',
    relatedTagIds: ['probability', 'riffle-shuffle', 'permutation'],
  },
  {
    id: 'hilbert-curve',
    label: 'ヒルベルト曲線',
    category: 'concept',
    description:
      '正方形を再帰的に埋め尽くす空間充填曲線。近い点の近さを保つ性質を持つ。',
    relatedTagIds: ['space-filling-curve', 'geometry', 'permutation'],
  },
  {
    id: 'space-filling-curve',
    label: '空間充填曲線',
    category: 'concept',
    description: '1 次元の区間から高次元領域全体への連続な全射で表される曲線。',
    relatedTagIds: ['hilbert-curve', 'dragon-curve', 'geometry'],
  },
  {
    id: 'dragon-curve',
    label: 'ドラゴン曲線',
    category: 'concept',
    description:
      '紙を繰り返し半分に折り、折り目を直角に開いて得られる自己相似な曲線。',
    relatedTagIds: ['fractal', 'space-filling-curve', 'binary', 'geometry'],
  },
  {
    id: 'fractal',
    label: 'フラクタル',
    category: 'concept',
    description: '拡大しても同じ構造が現れる自己相似な図形。',
    relatedTagIds: ['dragon-curve', 'space-filling-curve', 'geometry'],
  },
  {
    id: 'permutation',
    label: '置換',
    category: 'concept',
    description: '要素の並べ替え。巡回に分解でき、繰り返すと元の並びに戻る。',
    relatedTagIds: ['combinatorics', 'card-shuffling', 'hilbert-curve'],
  },
  {
    id: 'markov-chain',
    label: 'マルコフ連鎖',
    category: 'concept',
    description: '次の状態が現在の状態だけに依存する確率過程。',
    relatedTagIds: ['monte-carlo-method', 'probability'],
  },
]

export const TAG_BY_ID = new Map(TAGS.map((tag) => [tag.id, tag]))
