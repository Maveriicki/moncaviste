// ============================================================
//  Module Immobilier — Annonce publique (scan du QR code)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { PublicListing } from '@/types/immo'

/**
 * Charge l'annonce associée à un token de QR code.
 * La fonction SQL get_bien_public filtre les brouillons, masque
 * l'adresse exacte et incrémente le compteur de scans.
 */
export async function getPublicListing(
  publicToken: string
): Promise<PublicListing | null> {
  if (!publicToken || !/^[a-zA-Z0-9_-]{6,128}$/.test(publicToken)) return null

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_bien_public', {
    p_token: publicToken,
  })

  if (error || !data) return null

  const listing = data as PublicListing

  if (!listing.bien) return null

  return {
    ...listing,
    photos: listing.photos ?? [],
  }
}
