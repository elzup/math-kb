import { TAGS, TAG_BY_ID, type Tag } from '@/data/tags'
import { PAGES, type PageMeta } from '@/data/pages'

export type GraphNode =
  | {
      id: string
      type: 'page'
      label: string
      href: string
      description: string
    }
  | {
      id: string
      type: 'tag'
      label: string
      category: string
      description: string
    }

export type GraphEdge = {
  source: string
  target: string
  type: 'page-tag' | 'tag-tag'
}

export function buildKnowledgeGraph(): {
  nodes: GraphNode[]
  edges: GraphEdge[]
} {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const page of PAGES) {
    nodes.push({
      id: page.id,
      type: 'page',
      label: page.title,
      href: page.href,
      description: page.description,
    })

    for (const tagId of page.tagIds) {
      edges.push({
        source: page.id,
        target: tagId,
        type: 'page-tag',
      })
    }
  }

  for (const tag of TAGS) {
    nodes.push({
      id: tag.id,
      type: 'tag',
      label: tag.label,
      category: tag.category,
      description: tag.description,
    })

    for (const relatedId of tag.relatedTagIds) {
      if (TAG_BY_ID.has(relatedId)) {
        edges.push({
          source: tag.id,
          target: relatedId,
          type: 'tag-tag',
        })
      }
    }
  }

  return { nodes, edges }
}

export function getRelatedPages(tagId: string): PageMeta[] {
  return PAGES.filter((page) => page.tagIds.includes(tagId))
}

export function getRelatedTags(pageId: string): Tag[] {
  const page = PAGES.find((p) => p.id === pageId)
  if (!page) return []
  return page.tagIds
    .map((id) => TAG_BY_ID.get(id))
    .filter((tag): tag is Tag => tag !== undefined)
}
