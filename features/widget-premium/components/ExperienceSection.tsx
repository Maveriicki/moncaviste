import type { ExperienceQuestion } from '@/features/widget-premium/data/experienceQuestions'

interface ExperienceSectionProps {
  questions: ExperienceQuestion[]
}

export function ExperienceSection({ questions }: ExperienceSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <div className="inline-flex bg-[#7B1D2E]/10 text-[#7B1D2E] rounded-full px-4 py-2 text-sm font-medium mb-4">
          Expérience personnalisée
        </div>

        <h2 className="text-4xl lg:text-5xl font-serif mb-5">
          Votre sommelier vous guide
        </h2>

        <p className="text-[#6B4D55] max-w-2xl mx-auto text-lg leading-relaxed">
          Une expérience pensée pour retrouver le conseil humain d&apos;un vrai
          caviste.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {questions.map((question) => (
          <div
            key={question.title}
            className="bg-white rounded-[32px] p-8 border border-[#F0E8DC] shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#7B1D2E]/10 flex items-center justify-center text-3xl mb-6">
              {question.emoji}
            </div>

            <h3 className="text-2xl font-serif mb-3 leading-snug">
              {question.title}
            </h3>

            <p className="text-[#6B4D55] leading-relaxed">
              {question.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
