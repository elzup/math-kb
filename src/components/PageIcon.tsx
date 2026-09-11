import type { IconType } from 'react-icons'
import {
  FaBraille,
  FaCalendarAlt,
  FaChartBar,
  FaCircle,
  FaCode,
  FaDice,
  FaInfinity,
  FaListOl,
  FaPenNib,
  FaProjectDiagram,
  FaRandom,
  FaRoute,
  FaVectorSquare,
} from 'react-icons/fa'
import { GiDragonHead, GiTriangleTarget } from 'react-icons/gi'

const PAGE_ICONS: Record<string, IconType> = {
  'van-der-corput': FaListOl,
  halton: FaBraille,
  'monte-carlo': FaDice,
  'riffle-shuffle': FaRandom,
  'collatz-graph': FaProjectDiagram,
  'gray-code': FaCode,
  'weekday-calc': FaCalendarAlt,
  lissajous: FaInfinity,
  'hilbert-shuffle': FaRoute,
  'dragon-curve': GiDragonHead,
  'chaos-game': GiTriangleTarget,
  'rewrite-lab': FaPenNib,
  'galton-board': FaChartBar,
  'cut-and-project': FaVectorSquare,
}

type Props = {
  pageId: string
}

export default function PageIcon({ pageId }: Props) {
  const Icon = PAGE_ICONS[pageId] ?? FaCircle
  return <Icon aria-hidden="true" />
}
