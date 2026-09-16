import type { BienKind, BienTransaction } from '@/types/immo'

const PRICE_FORMAT = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
})

export function formatPrice(
  price: number | null,
  transaction: BienTransaction = 'vente'
): string {
  if (price === null || price === undefined) return 'Prix sur demande'

  const formatted = PRICE_FORMAT.format(price)

  return transaction === 'location' ? `${formatted} / mois` : formatted
}

export function formatSurface(surface: number | null): string | null {
  if (surface === null || surface === undefined) return null

  return `${NUMBER_FORMAT.format(surface)} m²`
}

export function formatNumber(value: number | null): string | null {
  if (value === null || value === undefined) return null

  return NUMBER_FORMAT.format(value)
}

export function formatLocation(
  postalCode: string | null,
  city: string | null
): string | null {
  const parts = [postalCode, city].filter(Boolean)

  return parts.length > 0 ? parts.join(' ') : null
}

export function formatKindLine(
  kind: BienKind,
  transaction: BienTransaction
): string {
  const kindLabels: Record<BienKind, string> = {
    maison:      'Maison',
    appartement: 'Appartement',
    terrain:     'Terrain',
    local:       'Local / commerce',
    immeuble:    'Immeuble',
    parking:     'Parking / box',
  }

  return `${kindLabels[kind]} · ${transaction === 'vente' ? 'À vendre' : 'À louer'}`
}
