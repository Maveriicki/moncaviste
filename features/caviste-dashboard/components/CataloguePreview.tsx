import { EmptyState } from '@/components/ui/EmptyState'
import { getWineColorOption } from '@/features/caviste-dashboard/constants'
import type { Caviste, Wine } from '@/types/database'
import { WineImage } from './WineImage'

interface CataloguePreviewProps {
  caviste: Caviste | null
  wines: Wine[]
  widgetUrl: string
}

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function CataloguePreview({ caviste, wines, widgetUrl }: CataloguePreviewProps) {
  const previewWines = wines.filter((wine) => wine.in_stock).slice(0, 4)

  return (
    <aside className="rounded-[24px] border border-[#F0E8DC] bg-[#17090F] p-4 text-white shadow-xl shadow-[#4E1020]/10 lg:sticky lg:top-6">
      <div className="rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#D9B96F]">
              Aperçu catalogue
            </p>
            <h2 className="mt-2 font-serif text-2xl">{caviste?.name ?? 'La cave'}</h2>
          </div>

          {widgetUrl && (
            <a
              href={widgetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#D9B96F] px-3 py-2 text-xs font-semibold text-[#17090F] transition hover:bg-[#E3C985]"
            >
              Ouvrir
            </a>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {previewWines.length === 0 ? (
            <EmptyState
              title="Aucun vin en stock"
              description="Les vins actifs apparaîtront ici dès qu’ils seront disponibles."
            />
          ) : (
            previewWines.map((wine) => {
              const color = getWineColorOption(wine.color)

              return (
                <article
                  key={wine.id}
                  className="grid grid-cols-[78px_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-3"
                >
                  <div className="h-24 overflow-hidden rounded-xl">
                    <WineImage src={wine.image_url} alt={wine.name} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${color.swatchClassName}`} />
                      <span className="text-xs text-white/[0.55]">{color.label}</span>
                    </div>

                    <h3 className="mt-2 truncate text-sm font-semibold text-white">
                      {wine.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/[0.55]">{wine.region || 'Région libre'}</p>
                    <p className="mt-2 text-sm font-semibold text-[#D9B96F]">
                      {priceFormatter.format(wine.price)}
                    </p>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
