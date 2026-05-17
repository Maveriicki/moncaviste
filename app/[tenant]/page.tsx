import { notFound } from 'next/navigation'
import { getTenantWidgetData } from '@/services/tenant-widget.service'
import { TenantCatalog } from '@/components/widget/TenantCatalog'

interface TenantPageProps {
  params: Promise<{
    tenant: string
  }>
}

export default async function TenantPage({
  params,
}: TenantPageProps) {
  const { tenant } = await params

  const data = await getTenantWidgetData(tenant)

  if (!data.caviste) {
    notFound()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F8F5F0',
        padding: '40px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            marginBottom: '40px',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              marginBottom: '10px',
              color: '#4E1020',
            }}
          >
            {data.caviste.name}
          </h1>

          <p
            style={{
              color: '#7A6A6F',
              fontSize: '18px',
            }}
          >
            Catalogue des vins
          </p>
        </header>

        <TenantCatalog wines={data.wines} />
      </div>
    </main>
  )
}