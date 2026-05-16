import {
  createWine,
  deleteWine,
  getCavisteProfile,
  getWines,
  updateWine,
} from '@/lib/supabase'
import type { DashboardWineForm, WineDashboardData } from '@/types/caviste-dashboard'
import type { ApiResponse, Wine, WineProfil } from '@/types/database'

const DEFAULT_PROFIL: WineProfil = {
  tanins: 50,
  acidite: 50,
  corps: 50,
  fruit: 60,
  sucre: 20,
}

export async function getWineDashboardData(): Promise<ApiResponse<WineDashboardData>> {
  const cavisteResponse = await getCavisteProfile()

  if (cavisteResponse.error || !cavisteResponse.data) {
    return {
      data: null,
      error: cavisteResponse.error || 'Profil caviste introuvable.',
    }
  }

  const winesResponse = await getWines(cavisteResponse.data.id)

  if (winesResponse.error) {
    return {
      data: null,
      error: winesResponse.error,
    }
  }

  return {
    data: {
      caviste: cavisteResponse.data,
      wines: winesResponse.data ?? [],
    },
    error: null,
  }
}

export async function createDashboardWine(
  cavisteId: string,
  form: DashboardWineForm,
  position: number
): Promise<ApiResponse<Wine>> {
  const validationError = validateWineForm(form)
  if (validationError) return { data: null, error: validationError }

  return createWine(cavisteId, {
    name: form.name.trim(),
    color: form.color,
    style: null,
    region: blankToNull(form.region),
    appellation: null,
    price: parsePrice(form.price),
    dryness: null,
    tannin: null,
    vintage: null,
    in_stock: form.in_stock,
    stock_qty: parseOptionalInteger(form.stock_qty),
    foods: parsePairings(form.pairings),
    occasions: [],
    degustation: null,
    accord: blankToNull(form.pairings),
    description: blankToNull(form.description),
    temperature: null,
    garde: null,
    profil: DEFAULT_PROFIL,
    image_url: blankToNull(form.image_url),
    position,
  })
}

export async function updateDashboardWine(
  wineId: string,
  form: DashboardWineForm
): Promise<ApiResponse<Wine>> {
  const validationError = validateWineForm(form)
  if (validationError) return { data: null, error: validationError }

  return updateWine(wineId, {
    name: form.name.trim(),
    color: form.color,
    region: blankToNull(form.region),
    price: parsePrice(form.price),
    in_stock: form.in_stock,
    stock_qty: parseOptionalInteger(form.stock_qty),
    foods: parsePairings(form.pairings),
    accord: blankToNull(form.pairings),
    description: blankToNull(form.description),
    image_url: blankToNull(form.image_url),
  })
}

export async function removeDashboardWine(wineId: string): Promise<ApiResponse<null>> {
  return deleteWine(wineId)
}

export async function setDashboardWineStock(
  wine: Wine,
  inStock: boolean
): Promise<ApiResponse<Wine>> {
  return updateWine(wine.id, { in_stock: inStock })
}

export function wineToDashboardForm(wine: Wine): DashboardWineForm {
  return {
    name: wine.name,
    price: String(wine.price),
    description: wine.description ?? '',
    image_url: wine.image_url ?? '',
    region: wine.region ?? '',
    color: wine.color,
    in_stock: wine.in_stock,
    stock_qty: wine.stock_qty ? String(wine.stock_qty) : '',
    pairings: wine.accord || wine.foods.join(', '),
  }
}

function validateWineForm(form: DashboardWineForm): string | null {
  if (!form.name.trim()) return 'Le nom du vin est obligatoire.'
  if (!Number.isFinite(parsePrice(form.price))) return 'Le prix doit être valide.'
  if (parsePrice(form.price) < 0) return 'Le prix ne peut pas être négatif.'
  return null
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parsePrice(value: string): number {
  return Number.parseFloat(value.replace(',', '.'))
}

function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePairings(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((pairing) => pairing.trim())
    .filter(Boolean)
}
