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
    relatedTagIds: [
      'quasi-monte-carlo',
      'numerical-integration',
      'irrational-rotation',
    ],
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
      'golden-ratio',
      'irrational-rotation',
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
      'quasiperiodicity',
      'cut-and-project',
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
  {
    id: 'normal-distribution',
    label: '正規分布',
    category: 'concept',
    description: '独立な小さいゆらぎの和が近づく釣鐘型の分布。',
    relatedTagIds: [
      'binomial-distribution',
      'central-limit-theorem',
      'probability',
    ],
  },
  {
    id: 'binomial-distribution',
    label: '二項分布',
    category: 'concept',
    description:
      '成功確率が一定の独立な試行を n 回繰り返したときの成功回数の分布。',
    relatedTagIds: [
      'normal-distribution',
      'galton-board',
      'combinatorics',
      'probability',
    ],
  },
  {
    id: 'central-limit-theorem',
    label: '中心極限定理',
    category: 'concept',
    description: '独立同分布な確率変数の和が正規分布に近づくという定理。',
    relatedTagIds: ['normal-distribution', 'binomial-distribution'],
  },
  {
    id: 'galton-board',
    label: 'ゴルトンボード',
    category: 'concept',
    description: '釘の列に玉を落として二項分布を物理的に作る装置。',
    relatedTagIds: ['binomial-distribution', 'normal-distribution'],
  },
  {
    id: 'hypothesis-testing',
    label: '仮説検定',
    category: 'method',
    description:
      '観測が仮定した分布から出たと考えて矛盾しないかを、統計量の裾確率で判断する手続き。',
    relatedTagIds: ['probability', 'normal-distribution'],
  },
  {
    id: 'exclusion-process',
    label: '排除過程',
    category: 'concept',
    description:
      '1 つの場所に 1 個までしか入れない粒子が動く確率過程。粒子同士に相関が生まれる。',
    relatedTagIds: ['probability', 'markov-chain', 'galton-board'],
  },
  {
    id: 'cut-and-project',
    label: 'カット＆プロジェクト法',
    category: 'method',
    description:
      '高い次元の格子を帯で切り取り、低い次元へ射影して準周期構造を作る手法。',
    relatedTagIds: [
      'quasiperiodicity',
      'sturmian-word',
      'fibonacci-word',
      'irrational-rotation',
      'geometry',
    ],
  },
  {
    id: 'quasiperiodicity',
    label: '準周期',
    category: 'concept',
    description:
      '周期を持たないのに、どの部分を見ても同じ有限の並びだけが現れる秩序。',
    relatedTagIds: [
      'cut-and-project',
      'sturmian-word',
      'irrational-rotation',
      'golden-ratio',
      'geometry',
    ],
  },
  {
    id: 'sturmian-word',
    label: 'スツルム語',
    category: 'sequence',
    description:
      '無理数の傾きの直線を格子で読み取って得られる、2 文字からなる非周期列。',
    relatedTagIds: [
      'fibonacci-word',
      'cut-and-project',
      'quasiperiodicity',
      'irrational-rotation',
    ],
  },
  {
    id: 'fibonacci-word',
    label: 'フィボナッチ語',
    category: 'sequence',
    description: 'L → LS, S → L の置き換えで伸びる語。黄金比のスツルム語。',
    relatedTagIds: ['sturmian-word', 'golden-ratio', 'cut-and-project'],
  },
  {
    id: 'golden-ratio',
    label: '黄金比',
    category: 'concept',
    description:
      '1 : (1 + √5) / 2 の比。有理数で最も近似しにくい無理数でもある。',
    relatedTagIds: ['fibonacci-word', 'quasiperiodicity', 'number-theory'],
  },
  {
    id: 'irrational-rotation',
    label: '無理数回転',
    category: 'concept',
    description:
      '円周を無理数の割合で回し続ける写像。同じ点に戻らず、軌道は一様に散らばる。',
    relatedTagIds: [
      'quasiperiodicity',
      'sturmian-word',
      'low-discrepancy-sequence',
      'number-theory',
    ],
  },
]

export const TAG_BY_ID = new Map(TAGS.map((tag) => [tag.id, tag]))
