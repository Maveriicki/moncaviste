import { EmptyState } from '@/components/ui/EmptyState'
import {
  STOCK_FILTER_OPTIONS,
  WINE_COLOR_OPTIONS,
  getWineColorOption,
} from '@/features/caviste-dashboard/constants'
import type { WineStockFilter } from '@/types/caviste-dashboard'
import type { Wine, WineColor } from '@/types/database'
import { WineImage } from './WineImage'

interface WineInventoryProps {
  wines: Wine[]
  filteredWines: Wine[]
  query: string
  colorFilter: WineColor | 'all'
  stockFilter: WineStockFilter
  deletingId: string | null
  togglingStockId: string | null
  onQueryChange: (value: string) => void
  onColorFilterChange: (value: WineColor | 'all') => void
  onStockFilterChange: (value: WineStockFilter) => void
  onResetFilters: () => void
  onAddWine: () => void
  onEditWine: (wine: Wine) => void
  onDeleteWine: (wine: Wine) => void
  onToggleStock: (wine: Wine) => void
}

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function WineInventory({
  wines,
  filteredWines,
  query,
  colorFilter,
  stockFilter,
  deletingId,
  togglingStockId,
  onQueryChange,
  onColorFilterChange,
  onStockFilterChange,
  onResetFilters,
  onAddWine,
  onEditWine,
  onDeleteWine,
  onToggleStock,
}: WineInventoryProps) {
  const hasFilters = query || colorFilter !== 'all' || stockFilter !== 'all'

  return (
    <section className="rounded-[24px] border border-[#F0E8DC] bg-white p-4 shadow-xl shadow-[#4E1020]/5 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B1D2E]">
            Inventaire
          </p>
          <h2 className="mt-1 font-serif text-3xl text-[#1C0D12]">Liste des vins</h2>
        </div>

        <button
          type="button"
          onClick={onAddWine}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#7B1D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#651827]"
        >
          Ajouter un vin
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
        <label className="block">
          <span className="sr-only">Rechercher</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher un nom, une région, un accord..."
            className="h-12 w-full rounded-2xl border border-[#E8DDD0] bg-[#FBF7F2] px-4 text-sm text-[#1C0D12] outline-none transition placeholder:text-[#A8909A] focus:border-[#7B1D2E] focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="sr-only">Filtrer par couleur</span>
          <select
            value={colorFilter}
            onChange={(event) => onColorFilterChange(event.target.value as WineColor | 'all')}
            className="h-12 w-full rounded-2xl border border-[#E8DDD0] bg-[#FBF7F2] px-4 text-sm font-medium text-[#1C0D12] outline-none transition focus:border-[#7B1D2E] focus:bg-white"
          >
            <option value="all">Toutes les couleurs</option>
            {WINE_COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Filtrer par stock</span>
          <select
            value={stockFilter}
            onChange={(event) => onStockFilterChange(event.target.value as WineStockFilter)}
            className="h-12 w-full rounded-2xl border border-[#E8DDD0] bg-[#FBF7F2] px-4 text-sm font-medium text-[#1C0D12] outline-none transition focus:border-[#7B1D2E] focus:bg-white"
          >
            {STOCK_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        {wines.length === 0 ? (
          <EmptyState
            title="Aucun vin dans le catalogue"
            description="Ajoutez une première référence pour alimenter le dashboard et l’aperçu client."
            action={
              <button
                type="button"
                onClick={onAddWine}
                className="rounded-full bg-[#7B1D2E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#651827]"
              >
                Ajouter le premier vin
              </button>
            }
          />
        ) : filteredWines.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            description="Aucun vin ne correspond aux filtres actifs."
            action={
              hasFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="rounded-full border border-[#E8DDD0] px-5 py-3 text-sm font-semibold text-[#6B4D55] transition hover:bg-[#FBF7F2]"
                >
                  Réinitialiser
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-[#F0E8DC] lg:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#FBF7F2] text-xs uppercase tracking-[0.14em] text-[#8B7480]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vin</th>
                    <th className="px-4 py-3 font-semibold">Région</th>
                    <th className="px-4 py-3 font-semibold">Couleur</th>
                    <th className="px-4 py-3 font-semibold">Prix</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F0E8DC]">
                  {filteredWines.map((wine) => (
                    <WineTableRow
                      key={wine.id}
                      wine={wine}
                      deleting={deletingId === wine.id}
                      togglingStock={togglingStockId === wine.id}
                      onEditWine={onEditWine}
                      onDeleteWine={onDeleteWine}
                      onToggleStock={onToggleStock}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredWines.map((wine) => (
                <WineMobileCard
                  key={wine.id}
                  wine={wine}
                  deleting={deletingId === wine.id}
                  togglingStock={togglingStockId === wine.id}
                  onEditWine={onEditWine}
                  onDeleteWine={onDeleteWine}
                  onToggleStock={onToggleStock}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

interface WineRowActionsProps {
  wine: Wine
  deleting: boolean
  togglingStock: boolean
  onEditWine: (wine: Wine) => void
  onDeleteWine: (wine: Wine) => void
  onToggleStock: (wine: Wine) => void
}

function WineTableRow(props: WineRowActionsProps) {
  const { wine } = props
  const color = getWineColorOption(wine.color)

  return (
    <tr className="bg-white transition hover:bg-[#FBF7F2]">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#FBF7F2]">
            <WineImage src={wine.image_url} alt={wine.name} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1C0D12]">{wine.name}</p>
            <p className="mt-1 line-clamp-1 text-xs text-[#8B7480]">
              {wine.description || wine.accord || 'Aucune note'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-[#6B4D55]">{wine.region || '—'}</td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${color.badgeClassName}`}>
          <span className={`h-2 w-2 rounded-full ${color.swatchClassName}`} />
          {color.label}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-[#7B1D2E]">
        {priceFormatter.format(wine.price)}
      </td>
      <td className="px-4 py-4">
        <StockButton {...props} />
      </td>
      <td className="px-4 py-4">
        <ActionButtons {...props} />
      </td>
    </tr>
  )
}

function WineMobileCard(props: WineRowActionsProps) {
  const { wine } = props
  const color = getWineColorOption(wine.color)

  return (
    <article className="rounded-2xl border border-[#F0E8DC] bg-white p-3 shadow-sm">
      <div className="grid grid-cols-[88px_1fr] gap-3">
        <div className="h-28 overflow-hidden rounded-xl">
          <WineImage src={wine.image_url} alt={wine.name} />
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[#1C0D12]">
                {wine.name}
              </h3>
              <p className="mt-1 text-sm text-[#8B7480]">{wine.region || '—'}</p>
            </div>
            <p className="text-sm font-semibold text-[#7B1D2E]">
              {priceFormatter.format(wine.price)}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${color.badgeClassName}`}>
              <span className={`h-2 w-2 rounded-full ${color.swatchClassName}`} />
              {color.label}
            </span>
            <StockButton {...props} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <ActionButtons {...props} />
      </div>
    </article>
  )
}

function StockButton({ wine, togglingStock, onToggleStock }: WineRowActionsProps) {
  return (
    <button
      type="button"
      disabled={togglingStock}
      onClick={() => onToggleStock(wine)}
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        wine.in_stock
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
      }`}
    >
      {togglingStock ? 'Mise à jour...' : wine.in_stock ? 'En stock' : 'Rupture'}
    </button>
  )
}

function ActionButtons({
  wine,
  deleting,
  onEditWine,
  onDeleteWine,
}: WineRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEditWine(wine)}
        className="rounded-full border border-[#E8DDD0] px-3 py-2 text-xs font-semibold text-[#6B4D55] transition hover:bg-[#FBF7F2]"
      >
        Modifier
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => onDeleteWine(wine)}
        className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
      >
        {deleting ? 'Suppression...' : 'Supprimer'}
      </button>
    </div>
  )
}
