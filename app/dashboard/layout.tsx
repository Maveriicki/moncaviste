'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCavisteProfile, signOut, supabase } from '@/lib/supabase'
import type { Caviste } from '@/types/database'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/wines', label: 'Catalogue' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [caviste, setCaviste] = useState<Caviste | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await getCavisteProfile()

      if (error || !data) {
        router.push('/login')
        return
      }

      setCaviste(data)
      setLoading(false)
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF7F2]">
        <div className="rounded-[28px] border border-[#F0E8DC] bg-white px-8 py-7 text-center shadow-xl shadow-[#4E1020]/10">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[#7B1D2E]/10" />
          <p className="text-sm font-medium text-[#6B4D55]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] text-[#1C0D12]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#17090F] px-4 py-5 text-white shadow-2xl shadow-black/20 transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D9B96F] font-serif text-xl font-bold text-[#17090F]">
              M
            </span>
            <span>
              <span className="block font-serif text-lg text-white">MonCaviste</span>
              <span className="block text-xs uppercase tracking-[0.18em] text-white/40">
                Wine-tech
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/60 md:hidden"
          >
            ×
          </button>
        </div>

        {caviste && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
            <p className="font-serif text-lg leading-tight text-white">{caviste.name}</p>
            <p className="mt-2 text-sm text-white/[0.45]">/{caviste.slug}</p>
            <span className="mt-4 inline-flex rounded-full bg-[#D9B96F]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9B96F]">
              {caviste.plan}
            </span>
          </div>
        )}

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {NAV.map((item) => {
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#D9B96F] text-[#17090F]'
                    : 'text-white/[0.62] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {caviste && (
          <a
            href={`/${caviste.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Aperçu public
          </a>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-2xl border border-white/10 px-4 py-3 text-left text-sm font-semibold text-white/[0.55] transition hover:bg-white/[0.08] hover:text-white"
        >
          Se déconnecter
        </button>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-[#17090F]/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="md:pl-[280px]">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#F0E8DC] bg-[#FBF7F2]/90 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-full border border-[#E8DDD0] px-3 py-2 text-sm font-semibold text-[#4E1020]"
          >
            Menu
          </button>
          <span className="max-w-[180px] truncate text-sm font-semibold text-[#4E1020]">
            {caviste?.name}
          </span>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
