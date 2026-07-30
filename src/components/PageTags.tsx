import Link from 'next/link'
import { TAG_BY_ID } from '@/data/tags'
import { PAGES } from '@/data/pages'

type Props = {
  pageId: string
}

export default function PageTags({ pageId }: Props) {
  const page = PAGES.find((p) => p.id === pageId)
  if (!page) return null

  const tags = page.tagIds
    .map((id) => TAG_BY_ID.get(id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined)

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Link key={tag.id} href="#" className="tag-chip">
          {tag.label}
        </Link>
      ))}
    </div>
  )
}
