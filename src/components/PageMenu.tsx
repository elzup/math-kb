import Link from 'next/link'
import { PAGE_CATEGORIES, PAGES_BY_CATEGORY } from '@/data/pages'

export default function PageMenu() {
  return (
    <nav className="page-menu">
      {PAGE_CATEGORIES.map((category) => {
        const pages = PAGES_BY_CATEGORY.get(category.id) ?? []
        if (pages.length === 0) return null

        return (
          <div key={category.id} className="page-menu-group">
            <h2 className="page-menu-label">{category.label}</h2>
            {pages.map((page) => (
              <Link key={page.id} href={page.href} className="page-menu-item">
                <span className="page-menu-icon" aria-hidden="true">
                  {page.icon}
                </span>
                <span className="page-menu-title">{page.title}</span>
              </Link>
            ))}
          </div>
        )
      })}
    </nav>
  )
}
