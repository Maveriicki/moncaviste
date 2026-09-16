// ============================================================
//  Module Immobilier — Service dashboard agence (client)
// ============================================================

import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/database'
import type {
  Agence,
  AgenceStats,
  Bien,
  BienForm,
  BienWithPhotos,
  ImmoDashboardData,
} from '@/types/immo'

// ─── Agence ───

/**
 * Récupère l'agence de l'utilisateur connecté, et la crée
 * automatiquement lors de la première connexion.
 */
export async function ensureAgence(): Promise<ApiResponse<Agence>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Session expirée, reconnectez-vous.' }
  }

  const { data: existing } = await supabase
    .from('agences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { data: existing as Agence, error: null }

  const fallbackName =
    (user.user_metadata?.agency_name as string) ||
    (user.user_metadata?.shop_name as string) ||
    'Mon agence'

  const { data, error } = await supabase
    .from('agences')
    .insert({
      user_id: user.id,
      slug: await buildUniqueSlug(fallbackName, user.email ?? 'agence'),
      name: fallbackName,
      email: user.email ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data: data as Agence, error: null }
}

export async function updateAgence(
  agenceId: string,
  updates: Partial<Omit<Agence, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Agence>> {
  const { data, error } = await supabase
    .from('agences')
    .update(updates)
    .eq('id', agenceId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data: data as Agence, error: null }
}

// ─── Dashboard ───

export async function getImmoDashboardData(): Promise<ApiResponse<ImmoDashboardData>> {
  const agenceResponse = await ensureAgence()

  if (agenceResponse.error || !agenceResponse.data) {
    return { data: null, error: agenceResponse.error || 'Agence introuvable.' }
  }

  const agence = agenceResponse.data

  const [biensResponse, statsResponse] = await Promise.all([
    getBiens(agence.id),
    getAgenceStats(agence.id),
  ])

  if (biensResponse.error) {
    return { data: null, error: biensResponse.error }
  }

  return {
    data: {
      agence,
      biens: biensResponse.data ?? [],
      stats: statsResponse.data,
    },
    error: null,
  }
}

export async function getAgenceStats(
  agenceId: string
): Promise<ApiResponse<AgenceStats>> {
  const { data, error } = await supabase.rpc('get_agence_stats', {
    p_agence_id: agenceId,
  })

  if (error) return { data: null, error: error.message }

  return { data: data as AgenceStats, error: null }
}

// ─── Biens ───

export async function getBiens(
  agenceId: string
): Promise<ApiResponse<BienWithPhotos[]>> {
  const { data, error } = await supabase
    .from('biens')
    .select('*, photos:bien_photos(*)')
    .eq('agence_id', agenceId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  return { data: sortPhotos(data as BienWithPhotos[]), error: null }
}

export async function getBien(
  bienId: string
): Promise<ApiResponse<BienWithPhotos>> {
  const { data, error } = await supabase
    .from('biens')
    .select('*, photos:bien_photos(*)')
    .eq('id', bienId)
    .single()

  if (error) return { data: null, error: error.message }

  return { data: sortPhotos([data as BienWithPhotos])[0], error: null }
}

export async function createBien(
  agenceId: string,
  form: BienForm
): Promise<ApiResponse<Bien>> {
  const validationError = validateBienForm(form)
  if (validationError) return { data: null, error: validationError }

  const reference = form.reference.trim() || (await nextReference(agenceId))

  const { data, error } = await supabase
    .from('biens')
    .insert({ agence_id: agenceId, reference, ...formToPayload(form) })
    .select()
    .single()

  if (error) return { data: null, error: translateError(error.message) }

  return { data: data as Bien, error: null }
}

export async function updateBien(
  bienId: string,
  form: BienForm
): Promise<ApiResponse<Bien>> {
  const validationError = validateBienForm(form)
  if (validationError) return { data: null, error: validationError }

  const payload: Record<string, unknown> = formToPayload(form)

  if (form.reference.trim()) {
    payload.reference = form.reference.trim()
  }

  const { data, error } = await supabase
    .from('biens')
    .update(payload)
    .eq('id', bienId)
    .select()
    .single()

  if (error) return { data: null, error: translateError(error.message) }

  return { data: data as Bien, error: null }
}

export async function setBienPublished(
  bienId: string,
  isPublished: boolean
): Promise<ApiResponse<Bien>> {
  const { data, error } = await supabase
    .from('biens')
    .update({ is_published: isPublished })
    .eq('id', bienId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data: data as Bien, error: null }
}

export async function deleteBien(bienId: string): Promise<ApiResponse<null>> {
  const { error } = await supabase.from('biens').delete().eq('id', bienId)

  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function nextReference(agenceId: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_bien_reference', {
    p_agence_id: agenceId,
  })

  if (error || typeof data !== 'string') {
    return `REF-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`
  }

  return data
}

// ─── Formulaire ───

export const EMPTY_BIEN_FORM: BienForm = {
  title:         '',
  reference:     '',
  kind:          'maison',
  transaction:   'vente',
  status:        'disponible',
  price:         '',
  charges:       '',
  fees:          '',
  surface:       '',
  land_surface:  '',
  rooms:         '',
  bedrooms:      '',
  bathrooms:     '',
  floor:         '',
  year_built:    '',
  dpe:           '',
  ges:           '',
  city:          '',
  postal_code:   '',
  address:       '',
  description:   '',
  features:      '',
  contact_name:  '',
  contact_phone: '',
  contact_email: '',
  is_published:  true,
}

export function bienToForm(bien: Bien): BienForm {
  return {
    title:         bien.title,
    reference:     bien.reference,
    kind:          bien.kind,
    transaction:   bien.transaction,
    status:        bien.status,
    price:         numberToInput(bien.price),
    charges:       numberToInput(bien.charges),
    fees:          bien.fees ?? '',
    surface:       numberToInput(bien.surface),
    land_surface:  numberToInput(bien.land_surface),
    rooms:         numberToInput(bien.rooms),
    bedrooms:      numberToInput(bien.bedrooms),
    bathrooms:     numberToInput(bien.bathrooms),
    floor:         numberToInput(bien.floor),
    year_built:    numberToInput(bien.year_built),
    dpe:           bien.dpe ?? '',
    ges:           bien.ges ?? '',
    city:          bien.city ?? '',
    postal_code:   bien.postal_code ?? '',
    address:       bien.address ?? '',
    description:   bien.description ?? '',
    features:      (bien.features ?? []).join(', '),
    contact_name:  bien.contact_name ?? '',
    contact_phone: bien.contact_phone ?? '',
    contact_email: bien.contact_email ?? '',
    is_published:  bien.is_published,
  }
}

export function validateBienForm(form: BienForm): string | null {
  if (!form.title.trim()) return 'Le titre de l’annonce est obligatoire.'

  const price = Number(form.price.replace(',', '.'))
  if (!form.price.trim() || Number.isNaN(price) || price < 0) {
    return 'Indiquez un prix valide.'
  }

  if (form.contact_email.trim() && !form.contact_email.includes('@')) {
    return 'Adresse email de contact invalide.'
  }

  return null
}

function formToPayload(form: BienForm) {
  return {
    title:         form.title.trim(),
    kind:          form.kind,
    transaction:   form.transaction,
    status:        form.status,
    price:         parseDecimal(form.price) ?? 0,
    charges:       parseDecimal(form.charges),
    fees:          blankToNull(form.fees),
    surface:       parseDecimal(form.surface),
    land_surface:  parseDecimal(form.land_surface),
    rooms:         parseInteger(form.rooms),
    bedrooms:      parseInteger(form.bedrooms),
    bathrooms:     parseInteger(form.bathrooms),
    floor:         parseInteger(form.floor),
    year_built:    parseInteger(form.year_built),
    dpe:           form.dpe || null,
    ges:           form.ges || null,
    city:          blankToNull(form.city),
    postal_code:   blankToNull(form.postal_code),
    address:       blankToNull(form.address),
    description:   blankToNull(form.description),
    features:      parseFeatures(form.features),
    contact_name:  blankToNull(form.contact_name),
    contact_phone: blankToNull(form.contact_phone),
    contact_email: blankToNull(form.contact_email),
    is_published:  form.is_published,
  }
}

// ─── Utilitaires ───

function sortPhotos(biens: BienWithPhotos[]): BienWithPhotos[] {
  return biens.map(bien => ({
    ...bien,
    photos: [...(bien.photos ?? [])].sort(
      (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)
    ),
  }))
}

async function buildUniqueSlug(name: string, email: string): Promise<string> {
  const base =
    slugify(name) || slugify(email.split('@')[0]) || 'agence'

  let candidate = base
  let counter = 0

  // Quelques tentatives suffisent : le slug reste modifiable ensuite.
  while (counter < 20) {
    const { data } = await supabase
      .from('agences')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) return candidate

    counter += 1
    candidate = `${base}-${counter}`
  }

  return `${base}-${Date.now().toString(36)}`
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseDecimal(value: string): number | null {
  const trimmed = value.replace(/\s/g, '').replace(',', '.')
  if (!trimmed) return null

  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

function parseInteger(value: string): number | null {
  const parsed = parseDecimal(value)
  return parsed === null ? null : Math.round(parsed)
}

function parseFeatures(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function numberToInput(value: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

function translateError(message: string): string {
  if (message.includes('biens_agence_id_reference_key')) {
    return 'Cette référence est déjà utilisée par un autre bien.'
  }

  return message
}
