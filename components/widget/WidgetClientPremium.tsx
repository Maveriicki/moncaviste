'use client'

import {
  ExperienceSection,
  HeroSection,
  WineGrid,
  experienceQuestions,
} from '@/features/widget-premium'
import type { WidgetPremiumProps } from '@/types/widget'

export default function WidgetClientPremium({
  caviste,
  initialWines,
}: WidgetPremiumProps) {
  return (
    <div className="min-h-screen bg-[#FBF7F2] text-[#1C0D12]">
      <HeroSection caviste={caviste} />
      <ExperienceSection questions={experienceQuestions} />
      <WineGrid wines={initialWines} />
    </div>
  )
}
