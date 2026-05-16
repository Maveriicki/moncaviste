import type { DashboardWineForm, WineStockFilter } from '@/types/caviste-dashboard'
import type { WineColor } from '@/types/database'

export const WINE_COLOR_OPTIONS: Array<{
  value: WineColor
  label: string
  swatchClassName: string
  badgeClassName: string
}> = [
  {
    value: 'rouge',
    label: 'Rouge',
    swatchClassName: 'bg-[#7B1D2E]',
    badgeClassName: 'bg-[#7B1D2E]/10 text-[#7B1D2E] ring-[#7B1D2E]/15',
  },
  {
    value: 'blanc',
    label: 'Blanc',
    swatchClassName: 'bg-[#D9B96F]',
    badgeClassName: 'bg-[#D9B96F]/15 text-[#6F5618] ring-[#D9B96F]/20',
  },
  {
    value: 'rose',
    label: 'Rosé',
    swatchClassName: 'bg-[#D9848A]',
    badgeClassName: 'bg-[#D9848A]/15 text-[#8B3040] ring-[#D9848A]/20',
  },
  {
    value: 'effervescent',
    label: 'Effervescent',
    swatchClassName: 'bg-[#5B9BAA]',
    badgeClassName: 'bg-[#5B9BAA]/15 text-[#2A6070] ring-[#5B9BAA]/20',
  },
]

export const STOCK_FILTER_OPTIONS: Array<{
  value: WineStockFilter
  label: string
}> = [
  { value: 'all', label: 'Tous les stocks' },
  { value: 'in_stock', label: 'En stock' },
  { value: 'out_of_stock', label: 'Rupture' },
]

export function getDefaultWineForm(): DashboardWineForm {
  return {
    name: '',
    price: '',
    description: '',
    image_url: '',
    region: '',
    color: 'rouge',
    in_stock: true,
    stock_qty: '',
    pairings: '',
  }
}

export function getWineColorOption(color: WineColor) {
  return WINE_COLOR_OPTIONS.find((option) => option.value === color) ?? WINE_COLOR_OPTIONS[0]
}
