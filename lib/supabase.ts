// ============================================================
// lib/supabase.ts
// Helpers Supabase — client browser SSR compatible
// ============================================================

export { supabase } from './supabase/client'
import type {
  Caviste,
  Wine,
  Conversation,
  WineRating,
  CavisteStats,
  ApiResponse,
} from '@/types/database'

import { supabase } from './supabase/client'

// ============================================================
// HELPERS — Cavistes
// ============================================================

export async function getCavisteProfile(): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .select('*')
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getCavisteBySlug(
  slug: string
): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateCavisteProfile(
  id: string,
  updates: Partial<
    Omit<Caviste, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >
): Promise<ApiResponse<Caviste>> {
  const { data, error } = await supabase
    .from('cavistes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============================================================
// HELPERS — Wines
// ============================================================

export async function getWines(
  cavisteId: string
): Promise<ApiResponse<Wine[]>> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('caviste_id', cavisteId)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

export async function getPublicWines(
  cavisteId: string
): Promise<ApiResponse<Wine[]>> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('caviste_id', cavisteId)
    .eq('in_stock', true)
    .order('position', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

export async function createWine(
  cavisteId: string,
  wine: Omit<
    Wine,
    'id' | 'caviste_id' | 'created_at' | 'updated_at'
  >
): Promise<ApiResponse<Wine>> {
  const { data, error } = await supabase
    .from('wines')
    .insert({
      ...wine,
      caviste_id: cavisteId,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateWine(
  id: string,
  updates: Partial<
    Omit<Wine, 'id' | 'caviste_id' | 'created_at' | 'updated_at'>
  >
): Promise<ApiResponse<Wine>> {
  const { data, error } = await supabase
    .from('wines')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteWine(
  id: string
): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

// ============================================================
// HELPERS — Conversations
// ============================================================

export async function saveConversation(
  cavisteId: string,
  sessionId: string,
  conversation: Partial<
    Omit<Conversation, 'id' | 'caviste_id' | 'session_id'>
  >
): Promise<ApiResponse<Conversation>> {
  const { data, error } = await supabase
    .from('conversations')
    .upsert(
      {
        caviste_id: cavisteId,
        session_id: sessionId,
        ...conversation,
      },
      {
        onConflict: 'caviste_id,session_id',
      }
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============================================================
// HELPERS — Ratings
// ============================================================

export async function submitRating(
  wineId: string,
  cavisteId: string,
  sessionId: string,
  score: number
): Promise<ApiResponse<WineRating>> {
  const { data, error } = await supabase
    .from('wine_ratings')
    .upsert(
      {
        wine_id: wineId,
        caviste_id: cavisteId,
        session_id: sessionId,
        score,
      },
      {
        onConflict: 'wine_id,session_id',
      }
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============================================================
// HELPERS — Stats
// ============================================================

export async function getCavisteStats(
  cavisteId: string
): Promise<ApiResponse<CavisteStats>> {
  const { data, error } = await supabase.rpc(
    'get_caviste_stats',
    {
      p_caviste_id: cavisteId,
    }
  )

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============================================================
// HELPERS — Auth
// ============================================================

export async function signUp(
  email: string,
  password: string,
  shopName: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        shop_name: shopName,
      },
    },
  })
}

export async function signIn(
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}