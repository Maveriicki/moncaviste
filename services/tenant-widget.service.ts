import { createAdminClient } from '@/lib/supabase'
import type { Caviste, Wine } from '@/types/database'

export interface TenantWidgetData {
  caviste: Caviste | null
  wines: Wine[]
}

export async function getTenantWidgetData(
  tenant: string
): Promise<TenantWidgetData> {
  const supabase = createAdminClient()

  const { data: caviste } = await supabase
    .from('cavistes')
    .select('*')
    .eq('slug', tenant)
    .single()

  if (!caviste) {
    return { caviste: null, wines: [] }
  }

  const { data: wines } = await supabase
  .from('wines')
  .select('*')
  .eq('caviste_id', caviste.id)
  .eq('in_stock', true)
  .order('position', { ascending: true })

  return {
    caviste: caviste as Caviste,
    wines: (wines ?? []) as Wine[],
  }
}
