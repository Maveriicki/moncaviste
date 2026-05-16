import type { Caviste, Wine } from '@/types/database'

export type WidgetCaviste = Pick<Caviste, 'id' | 'name'>

export type WidgetWine = Pick<
  Wine,
  | 'id'
  | 'name'
  | 'color'
  | 'region'
  | 'accord'
  | 'description'
  | 'image_url'
  | 'price'
>

export interface WidgetPremiumProps {
  caviste: WidgetCaviste
  initialWines: WidgetWine[]
}
