import Layout from '@/components/Layout'
import PageTags from '@/components/PageTags'
import Tex from '@/components/Tex'
import WeekdayCalcExplainer from '@/components/WeekdayCalcExplainer'

export default function WeekdayCalcPage() {
  return (
    <Layout title="曜日計算 - Math KB">
      <div className="container">
        <h1 className="page-title">曜日計算</h1>
        <PageTags pageId="weekday-calc" />
        <p className="page-lead">
          西暦年月日から曜日を求める「月コード法」を可視化します。 各項を{' '}
          <Tex tex="\bmod 7" />{' '}
          で折りたたみ、最終的な曜日インデックスを導きます。
        </p>

        <section className="section">
          <h2 className="section-title">公式</h2>
          <p className="section-text">
            年の下2桁を <Tex tex="y" />
            、世紀コードを <Tex tex="C" />、 月コードを <Tex tex="m" />
            、日を <Tex tex="D" /> とすると、 曜日インデックス <Tex tex="w" />{' '}
            は次式で求まります。
          </p>
          <div className="formula">
            <Tex
              tex="w = (D + m + y + \lfloor y/4 \rfloor + C) \bmod 7"
              display
            />
          </div>
          <p className="section-text">
            <Tex tex="w = 0" /> が日曜日、
            <Tex tex="w = 6" /> が土曜日です。 閏年の1月・2月は月コードから{' '}
            <Tex tex="1" /> を引いて補正します。
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">Explainer</h2>
          <WeekdayCalcExplainer />
        </section>
      </div>
    </Layout>
  )
}
