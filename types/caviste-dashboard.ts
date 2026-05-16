import type { Caviste, Wine, WineColor } from '@/types/database'

export type WineStockFilter = 'all' | 'in_stock' | 'out_of_stock'
export type WineFormMode = 'create' | 'edit'
export type ToastType = 'success' | 'error' | 'info'

export interface WineDashboardData {
  caviste: Caviste
  wines: Wine[]
}

export interface WineDashboardStats {
  total: number
  inStock: number
  outOfStock: number
  averagePrice: number
  colorCount: number
}

export interface DashboardWineForm {
  name: string
  price: string
  description: string
  image_url: string
  region: string
  color: WineColor
  in_stock: boolean
  stock_qty: string
  pairings: string
}

export interface DashboardToast {
  id: string
  type: ToastType
  title: string
  message?: string
}
