import type { WidgetWine } from '@/types/widget'
import { WineCard } from './WineCard'

interface WineGridProps {
  wines: WidgetWine[]
}

export function WineGrid({ wines }: WineGridProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-24">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[#7B1D2E] font-medium mb-2">
            Sélection du caviste
          </div>

          <h2 className="text-4xl font-serif">Nos recommandations</h2>
        </div>

        <button className="hidden md:block border border-[#E8DDD0] hover:bg-white px-6 py-3 rounded-2xl transition">
          Voir toute la cave
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {wines.map((wine) => (
          <WineCard key={wine.id} wine={wine} />
        ))}
      </div>
    </section>
  )
}
