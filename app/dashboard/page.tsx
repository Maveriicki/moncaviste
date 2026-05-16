import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <pre style={{ padding: 40 }}>
      {JSON.stringify(user, null, 2)}
    </pre>
  )
}