import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: caviste } = await supabase
    .from('cavistes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!caviste) {
    redirect('/onboarding')
  }

  return <DashboardClient />
}