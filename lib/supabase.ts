// ============================================================
//  lib/supabase.ts
//  Client Supabase unique — côté client et serveur
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Caviste, Wine, Conversation, WineRating, CavisteStats, ApiResponse } from '@/types/database'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Variables Supabase manquantes dans .env.local')
}

// ─── Client singleton (côté browser) ───
export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
})

// ─── Client admin (côté serveur uniquement, dans les API routes) ───
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant')
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ============================================================
//  HELPERS — Cavistes
// ============================================================

/** Récupère le profil caviste de l'utilisateur connecté */
export async function getCavisteProfile(): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Récupère un caviste par son slug (public, pour le widget) */
export async function getCavisteBySlug(slug: string): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Met à jour le profil caviste */
export async function updateCavisteProfile(
  id: string,
  updates: Partial<Omit<Caviste, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ============================================================
//  HELPERS — Wines
// ============================================================

/** Catalogue complet d'un caviste (dashboard) */
export async function getWines(cavisteId: string): Promise<ApiResponse<Wine[]>> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('caviste_id', cavisteId)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Catalogue public (widget) — uniquement les vins en stock */
export async function getPublicWines(cavisteId: string): Promise<ApiResponse<Wine[]>> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('caviste_id', cavisteId)
    .eq('in_stock', true)
    .order('position', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/** Crée un vin */
export async function createWine(
  cavisteId: string,
  wine: Omit<Wine, 'id' | 'caviste_id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Wine>> {
  const { data, error } = await supabase
    .from('wines')
    .insert({ ...wine, caviste_id: cavisteId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Met à jour un vin */
export async function updateWine(
  id: string,
  updates: Partial<Omit<Wine, 'id' | 'caviste_id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Wine>> {
  const { data, error } = await supabase
    .from('wines')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Supprime un vin */
export async function deleteWine(id: string): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

/** Import CSV — upsert en masse */
export async function importWinesFromCSV(
  cavisteId: string,
  wines: Omit<Wine, 'id' | 'caviste_id' | 'created_at' | 'updated_at'>[]
): Promise<ApiResponse<{ count: number }>> {
  const rows = wines.map((w) => ({ ...w, caviste_id: cavisteId }))
  const { data, error } = await supabase
    .from('wines')
    .upsert(rows, { onConflict: 'caviste_id,name' })
    .select('id')

  if (error) return { data: null, error: error.message }
  return { data: { count: data?.length ?? 0 }, error: null }
}

// ============================================================
//  HELPERS — Conversations
// ============================================================

/** Enregistre une conversation (appelé depuis le widget) */
export async function saveConversation(
  cavisteId: string,
  sessionId: string,
  conversation: Partial<Omit<Conversation, 'id' | 'caviste_id' | 'session_id'>>
): Promise<ApiResponse<Conversation>> {
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      { caviste_id: cavisteId, session_id: sessionId, ...conversation },
      { onConflict: 'caviste_id,session_id' }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Liste les conversations d'un caviste */
export async function getConversations(
  cavisteId: string,
  limit = 50
): Promise<ApiResponse<Conversation[]>> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('caviste_id', cavisteId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

// ============================================================
//  HELPERS — Ratings
// ============================================================

/** Soumet une note client */
export async function submitRating(
  wineId: string,
  cavisteId: string,
  sessionId: string,
  score: number
): Promise<ApiResponse<WineRating>> {
  const { data, error } = await supabase
    .from('wine_ratings')
    .upsert(
      { wine_id: wineId, caviste_id: cavisteId, session_id: sessionId, score },
      { onConflict: 'wine_id,session_id' }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/** Moyenne des notes pour un vin */
export async function getWineRatingAvg(wineId: string): Promise<number> {
  const { data } = await supabase
    .from('wine_ratings')
    .select('score')
    .eq('wine_id', wineId)

  if (!data || data.length === 0) return 0
  const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length
  return Math.round(avg * 10) / 10
}

// ============================================================
//  HELPERS — Stats dashboard
// ============================================================

export async function getCavisteStats(cavisteId: string): Promise<ApiResponse<CavisteStats>> {
  const { data, error } = await supabase
    .rpc('get_caviste_stats', { p_caviste_id: cavisteId })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ============================================================
//  HELPERS — Auth
// ============================================================

export async function signUp(email: string, password: string, shopName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { shop_name: shopName } },
  })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
