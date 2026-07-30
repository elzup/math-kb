import { writeFileSync } from 'node:fs'
import { PAGE_CATEGORIES, PAGES } from '../src/data/pages'
import { TAG_BY_ID } from '../src/data/tags'

const rows = PAGES.map((page) => {
  const category =
    PAGE_CATEGORIES.find((c) => c.id === page.categoryId)?.label ?? ''
  const tags = page.tagIds
    .map((id) => TAG_BY_ID.get(id)?.label ?? id)
    .join(', ')

  return `| [${page.title}](${page.href}) | ${category} | ${page.description} | ${tags} |`
})

const markdown = `# ページ一覧

| ページ | カテゴリ | 概要 | タグ |
|---|---|---|---|
${rows.join('\n')}
`

writeFileSync('pages.md', markdown)
console.log('Generated pages.md')
