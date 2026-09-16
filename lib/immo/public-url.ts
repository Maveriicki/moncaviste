/**
 * URL publique encodée dans le QR code d'un bien.
 * C'est cette adresse que le client ouvre en scannant l'affiche en vitrine.
 */
export function buildBienPublicUrl(publicToken: string): string {
  return `${getAppOrigin()}/bien/${publicToken}`
}

export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) return configured.replace(/\/+$/, '')

  if (typeof window !== 'undefined') return window.location.origin

  return 'http://localhost:3000'
}
