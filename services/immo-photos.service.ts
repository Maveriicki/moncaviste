// ============================================================
//  Module Immobilier — Service photos (upload / suppression)
// ============================================================

import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/database'
import type { BienPhoto } from '@/types/immo'

export async function uploadBienPhotos(
  agenceId: string,
  bienId: string,
  files: File[]
): Promise<ApiResponse<BienPhoto[]>> {
  if (files.length === 0) return { data: [], error: null }

  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Session Supabase expirée.' }

  const body = new FormData()
  body.append('agenceId', agenceId)
  body.append('bienId', bienId)
  files.forEach(file => body.append('files', file))

  return fetchPhotoApi<BienPhoto[]>('/api/immo/photos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
}

export async function deleteBienPhoto(
  agenceId: string,
  photoId: string
): Promise<ApiResponse<null>> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Session Supabase expirée.' }

  return fetchPhotoApi<null>('/api/immo/photos', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agenceId, photoId }),
  })
}

/** Réordonne les photos (la première sert de photo de couverture). */
export async function reorderBienPhotos(
  photoIds: string[]
): Promise<ApiResponse<null>> {
  for (let index = 0; index < photoIds.length; index += 1) {
    const { error } = await supabase
      .from('bien_photos')
      .update({ position: index })
      .eq('id', photoIds[index])

    if (error) return { data: null, error: error.message }
  }

  return { data: null, error: null }
}

export async function updatePhotoCaption(
  photoId: string,
  caption: string
): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from('bien_photos')
    .update({ caption: caption.trim() || null })
    .eq('id', photoId)

  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.access_token ?? null
}

async function fetchPhotoApi<T>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(input, init)
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!response.ok) {
    return { data: null, error: payload?.error || 'Envoi des photos impossible.' }
  }

  if (!payload) {
    return { data: null, error: 'Réponse Storage invalide.' }
  }

  return payload
}
