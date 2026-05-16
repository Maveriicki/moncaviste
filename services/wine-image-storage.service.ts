import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/database'

export interface WineImageUploadResult {
  path: string
  publicUrl: string
}

interface WineImageRequest {
  cavisteId: string
  imageUrl: string
}

export async function uploadWineBottleImage(
  cavisteId: string,
  file: File
): Promise<ApiResponse<WineImageUploadResult>> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Session Supabase expirée.' }

  const body = new FormData()
  body.append('cavisteId', cavisteId)
  body.append('file', file)

  return fetchStorageApi<WineImageUploadResult>('/api/dashboard/wine-images', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })
}

export async function deleteWineBottleImage({
  cavisteId,
  imageUrl,
}: WineImageRequest): Promise<ApiResponse<null>> {
  if (!imageUrl.trim()) return { data: null, error: null }

  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Session Supabase expirée.' }

  return fetchStorageApi<null>('/api/dashboard/wine-images', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cavisteId, imageUrl }),
  })
}

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session?.access_token ?? null
}

async function fetchStorageApi<T>(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(input, init)
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!response.ok) {
    return {
      data: null,
      error: payload?.error || 'Opération Storage impossible.',
    }
  }

  if (!payload) {
    return { data: null, error: 'Réponse Storage invalide.' }
  }

  return payload
}
