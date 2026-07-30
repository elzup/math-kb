import Layout from '@/components/Layout'
import PageMenu from '@/components/PageMenu'

export default function Home() {
  return (
    <Layout title="anozon/mathkb">
      <div className="hero-tools">
        <div className="hero-tools-icon">
          <img src="/logo-icon.svg" alt="" width="64" height="64" />
        </div>
        <h1 className="hero-tools-title">anozon/mathkb</h1>
        <p className="hero-tools-lead">Collection of Math books</p>
      </div>
      <PageMenu />
    </Layout>
  )
}
