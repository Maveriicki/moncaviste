import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ImmoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/immo/dashboard')
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <Link href="/immo/dashboard" style={styles.brand}>
          🏠 Espace immobilier
        </Link>

        <nav style={styles.nav}>
          <Link href="/immo/dashboard" style={styles.navLink}>
            Mes biens
          </Link>

          <Link href="/immo/dashboard/biens/new" style={styles.navPrimary}>
            + Nouveau bien
          </Link>
        </nav>
      </header>

      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    background: '#F4F6F9',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    padding: '16px 24px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E4EAF1',
  },
  brand: {
    fontSize: 17,
    fontWeight: 700,
    color: '#14263A',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  navLink: {
    fontSize: 14,
    color: '#3D4C5C',
    textDecoration: 'none',
    padding: '8px 12px',
  },
  navPrimary: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    background: '#123B5C',
    borderRadius: 10,
    padding: '9px 16px',
    textDecoration: 'none',
  },
}
