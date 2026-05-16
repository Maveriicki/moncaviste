import type { WineDashboardStats } from '@/types/caviste-dashboard'
import type { Caviste } from '@/types/database'

interface DashboardHeaderProps {
  caviste: Caviste | null
  stats: WineDashboardStats
  widgetUrl: string
  onAddWine: () => void
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function DashboardHeader({
  caviste,
  stats,
  widgetUrl,
  onAddWine,
}: DashboardHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#17090F] text-white shadow-2xl shadow-[#4E1020]/20">
      <div className="bg-[linear-gradient(135deg,rgba(123,29,46,0.34),rgba(23,9,15,0)_48%,rgba(91,155,170,0.18))] px-5 py-6 sm:px-7 lg:px-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/75">
              Dashboard caviste
            </div>

            <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
              {caviste?.name ?? 'Votre cave'}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/[0.65]">
              <span className="rounded-full bg-white/[0.08] px-3 py-1">
                /{caviste?.slug ?? 'catalogue'}
              </span>
              <span>{stats.total} vins</span>
              <span>{stats.inStock} en stock</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {widgetUrl && (
              <a
                href={widgetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/[0.15] px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Aperçu catalogue
              </a>
            )}

            <button
              type="button"
              onClick={onAddWine}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D9B96F] px-5 text-sm font-semibold text-[#1C0D12] shadow-lg shadow-[#D9B96F]/20 transition hover:bg-[#E3C985]"
            >
              Ajouter un vin
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeaderStat label="Catalogue" value={stats.total} />
          <HeaderStat label="Stock actif" value={stats.inStock} />
          <HeaderStat label="Prix moyen" value={currencyFormatter.format(stats.averagePrice)} />
          <HeaderStat label="Couleurs" value={stats.colorCount} />
        </div>
      </div>
    </section>
  )
}

function HeaderStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase text-white/[0.45]">{label}</div>
    </div>
  )
}
