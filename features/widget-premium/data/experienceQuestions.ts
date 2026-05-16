export interface ExperienceQuestion {
  title: string
  subtitle: string
  emoji: string
}

export const experienceQuestions: ExperienceQuestion[] = [
  {
    title: 'Que cuisinez-vous ce soir ?',
    subtitle: 'Viande rouge, poisson, fromage ou apéritif',
    emoji: '🍽️',
  },
  {
    title: 'Quel style aimez-vous ?',
    subtitle: 'Puissant, fruité, sec ou minéral',
    emoji: '🍷',
  },
  {
    title: 'Quel budget souhaitez-vous ?',
    subtitle: 'Une belle bouteille adaptée à votre soirée',
    emoji: '💎',
  },
]
