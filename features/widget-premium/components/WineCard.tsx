import type { WidgetWine } from '@/types/widget'

interface WineCardProps {
  wine: WidgetWine
}

export function WineCard({ wine }: WineCardProps) {
  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-[#F0E8DC] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="bg-gradient-to-br from-[#2B0E15] to-[#7B1D2E] flex items-center justify-center min-h-[320px] text-8xl text-white overflow-hidden">
          {wine.image_url ? (
            <img
              src={wine.image_url}
              alt={wine.name}
              className="h-full min-h-[320px] w-full object-cover"
            />
          ) : (
            '🍷'
          )}
        </div>

        <div className="p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 bg-[#7B1D2E]/10 text-[#7B1D2E] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {wine.color}
            </div>

            <div className="text-2xl font-serif text-[#7B1D2E]">
              {wine.price} €
            </div>
          </div>

          <h3 className="text-3xl font-serif leading-tight mb-3">
            {wine.name}
          </h3>

          <div className="flex flex-wrap gap-2 mb-5">
            {wine.region && (
              <span className="bg-[#FBF7F2] px-3 py-1 rounded-full text-sm">
                📍 {wine.region}
              </span>
            )}

            {wine.accord && (
              <span className="bg-[#FBF7F2] px-3 py-1 rounded-full text-sm">
                🍽️ {wine.accord}
              </span>
            )}
          </div>

          <div className="bg-[#FBF7F2] rounded-2xl p-4 mb-6 border border-[#F0E8DC]">
            <div className="text-sm uppercase tracking-wide text-[#7B1D2E] font-semibold mb-2">
              Conseil du caviste
            </div>

            <p className="text-[#6B4D55] leading-relaxed">
              Ce vin est idéal pour une soirée conviviale et accompagnera
              parfaitement vos plats généreux.
            </p>
          </div>

          <p className="text-[#6B4D55] leading-relaxed mb-8 flex-1">
            {wine.description}
          </p>

          <div className="flex gap-4">
            <button className="flex-1 bg-[#7B1D2E] hover:opacity-90 text-white rounded-2xl py-4 font-semibold transition">
              Découvrir
            </button>

            <button className="border border-[#E8DDD0] hover:bg-[#FBF7F2] rounded-2xl px-6 transition">
              ❤️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
