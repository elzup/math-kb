import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('math-kb-theme')
    const initial = saved === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('math-kb-theme', theme)
  }, [theme, mounted])

  return (
    <div className="theme-toggle">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'active' : ''}
        aria-label="Light"
        title="Light"
      >
        <span className="theme-dot light" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'active' : ''}
        aria-label="Dark"
        title="Dark"
      >
        <span className="theme-dot dark" />
      </button>
    </div>
  )
}

type Props = {
  children: React.ReactNode
  title?: string
}

export default function Layout({ children, title = 'Math KB' }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="layout">
        <nav className="nav">
          <div className="container nav-inner">
            <Link href="/" className="logo" aria-label="Math KB">
              <img
                src="/logo.svg"
                alt="anozon/mathkb"
                height="32"
                width="180"
              />
            </Link>
            <ThemeToggle />
          </div>
        </nav>
        <main className="container page">{children}</main>
        <footer className="footer">
          <div className="container footer-inner">
            <span>&copy; 2026 Math KB</span>
            <Link href="https://github.com/elzup/math-kb">GitHub</Link>
          </div>
        </footer>
      </div>
    </>
  )
}
