import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Vérifie utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Vérifie caviste associé au user
  const { data: caviste } = await supabase
    .from('cavistes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Aucun caviste → onboarding
  if (!caviste) {
    redirect('/onboarding')
  }

  return <DashboardClient />
}