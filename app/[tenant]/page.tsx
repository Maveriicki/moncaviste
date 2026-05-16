import { notFound } from 'next/navigation'
import WidgetClientPremium from '@/components/widget/WidgetClientPremium'
import { getTenantWidgetData } from '@/services/tenant-widget.service'

interface Props {
  params: Promise<{
    tenant: string
  }>
}

export default async function TenantWidgetPage({ params }: Props) {
  const { tenant } = await params

  const { caviste, wines } = await getTenantWidgetData(tenant)

  if (!caviste) {
    notFound()
  }

  return (
    <WidgetClientPremium
      caviste={caviste}
      initialWines={wines}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { tenant } = await params

  return {
    title: `${tenant} — MonCaviste`,
  }
}
