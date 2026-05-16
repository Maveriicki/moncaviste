import type { WidgetCaviste } from '@/types/widget'

interface HeroSectionProps {
  caviste: WidgetCaviste
}

export function HeroSection({ caviste }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#1C0D12] text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#C8A96E,_transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm mb-6">
            🍷 Sommelier IA Premium
          </div>

          <h1 className="text-5xl lg:text-7xl font-serif leading-tight mb-6">
            Votre
            <span className="text-[#C8A96E]"> caviste </span>
            personnel
          </h1>

          <p className="text-lg text-white/70 max-w-xl leading-relaxed mb-10">
            Découvrez les meilleurs vins selon votre repas, vos goûts et votre
            budget.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="bg-[#C8A96E] hover:opacity-90 transition px-8 py-4 rounded-2xl text-black font-semibold shadow-2xl">
              Trouver mon vin
            </button>

            <button className="border border-white/20 hover:bg-white/10 transition px-8 py-4 rounded-2xl text-white">
              Découvrir la cave
            </button>
          </div>

          <div className="mt-12 flex gap-10 text-sm text-white/60">
            <div>
              <div className="text-2xl text-white font-bold">+1200</div>
              vins référencés
            </div>

            <div>
              <div className="text-2xl text-white font-bold">+80</div>
              cavistes partenaires
            </div>

            <div>
              <div className="text-2xl text-white font-bold">4.9★</div>
              satisfaction
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#C8A96E]/20 blur-3xl rounded-full" />

          <div className="relative bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl p-6 shadow-2xl">
            <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative bg-gradient-to-br from-[#3A101A] via-[#5A1223] to-[#1C0D12] flex items-center justify-center text-8xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,150,0.15),_transparent_60%)]" />

              <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs border border-white/10 text-white">
                Sélection premium
              </div>

              <div className="drop-shadow-2xl animate-pulse">🍷</div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold">{caviste.name}</div>

                  <div className="text-white/60 text-sm mt-1">
                    Sélection premium du caviste
                  </div>
                </div>

                <div className="bg-[#C8A96E]/20 text-[#E8C98B] border border-[#C8A96E]/20 rounded-full px-3 py-1 text-xs uppercase tracking-wide">
                  Sommelier IA
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
