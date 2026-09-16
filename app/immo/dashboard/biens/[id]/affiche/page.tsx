'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { QrCodeCard } from '@/features/immo-dashboard/components/QrCodeCard'
import { ensureAgence, getBien } from '@/services/immo-dashboard.service'
import {
  formatKindLine,
  formatLocation,
  formatNumber,
  formatPrice,
  formatSurface,
} from '@/lib/immo/format'
import type { Agence, BienWithPhotos } from '@/types/immo'

/** Affiche A4 à imprimer et à coller en vitrine. */
export default function AffichePage() {
  const params = useParams<{ id: string }>()
  const bienId = params?.id

  const [bien, setBien] = useState<BienWithPhotos | null>(null)
  const [agence, setAgence] = useState<Agence | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!bienId) return

      const [bienResponse, agenceResponse] = await Promise.all([
        getBien(bienId),
        ensureAgence(),
      ])

      if (cancelled) return

      if (bienResponse.error || !bienResponse.data) {
        setError(bienResponse.error || 'Bien introuvable.')
        return
      }

      setBien(bienResponse.data)
      setAgence(agenceResponse.data)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [bienId])

  if (error) {
    return (
      <main style={styles.page}>
        <p style={styles.error}>{error}</p>
        <Link href="/immo/dashboard" style={styles.link}>
          ← Retour aux biens
        </Link>
      </main>
    )
  }

  if (!bien) {
    return (
      <main style={styles.page}>
        <p style={styles.info}>Préparation de l’affiche…</p>
      </main>
    )
  }

  const facts = [
    formatSurface(bien.surface),
    bien.rooms ? `${formatNumber(bien.rooms)} pièces` : null,
    bien.bedrooms ? `${formatNumber(bien.bedrooms)} chambres` : null,
    bien.land_surface ? `Terrain ${formatSurface(bien.land_surface)}` : null,
    bien.dpe ? `DPE ${bien.dpe}` : null,
  ].filter(Boolean)

  return (
    <main style={styles.page}>
      <div style={styles.toolbar} className="affiche-toolbar">
        <Link href={`/immo/dashboard/biens/${bien.id}`} style={styles.link}>
          ← Retour au bien
        </Link>

        <button type="button" style={styles.printButton} onClick={() => window.print()}>
          Imprimer l’affiche
        </button>
      </div>

      <section style={styles.sheet} className="affiche-sheet">
        <header style={styles.sheetHeader}>
          <div>
            <p style={styles.agency}>{agence?.name ?? ''}</p>
            <p style={styles.reference}>Réf. {bien.reference}</p>
          </div>

          <p style={styles.kind}>{formatKindLine(bien.kind, bien.transaction)}</p>
        </header>

        {bien.photos[0] && (
          <img src={bien.photos[0].url} alt="" style={styles.cover} />
        )}

        <h1 style={styles.title}>{bien.title}</h1>

        <p style={styles.location}>
          {formatLocation(bien.postal_code, bien.city) ?? ''}
        </p>

        <p style={styles.price}>{formatPrice(bien.price, bien.transaction)}</p>

        {facts.length > 0 && <p style={styles.facts}>{facts.join('  ·  ')}</p>}

        <div style={styles.qrRow}>
          <QrCodeCard
            publicToken={bien.public_token}
            reference={bien.reference}
            size={210}
            compact
          />

          <div style={styles.qrText}>
            <p style={styles.qrTitle}>Scannez pour voir toutes les photos</p>
            <p style={styles.qrSubtitle}>
              Ouvrez l’appareil photo de votre téléphone et visez ce code : l’annonce
              complète et la galerie s’affichent immédiatement.
            </p>

            {(bien.contact_phone || agence?.phone) && (
              <p style={styles.contact}>
                📞 {bien.contact_phone || agence?.phone}
              </p>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          .affiche-toolbar { display: none !important; }
          body { background: #FFFFFF !important; }
          .affiche-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
          }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 60px' },
  toolbar: {
    maxWidth: 760,
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  link: { fontSize: 13, color: '#5A6A7A', textDecoration: 'none' },
  printButton: {
    padding: '10px 18px',
    borderRadius: 12,
    border: 'none',
    background: '#123B5C',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  sheet: {
    maxWidth: 760,
    margin: '0 auto',
    background: '#FFFFFF',
    borderRadius: 8,
    padding: 36,
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.08)',
  },
  sheetHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottom: '2px solid #123B5C',
    paddingBottom: 12,
    marginBottom: 20,
  },
  agency: { margin: 0, fontSize: 20, fontWeight: 700, color: '#14263A' },
  reference: { margin: '2px 0 0', fontSize: 13, color: '#7A889A' },
  kind: { margin: 0, fontSize: 14, fontWeight: 600, color: '#123B5C' },
  cover: {
    width: '100%',
    height: 300,
    objectFit: 'cover',
    borderRadius: 6,
    display: 'block',
  },
  title: { margin: '20px 0 4px', fontSize: 30, color: '#14263A', lineHeight: 1.2 },
  location: { margin: 0, fontSize: 16, color: '#5A6A7A' },
  price: { margin: '14px 0 6px', fontSize: 38, fontWeight: 700, color: '#123B5C' },
  facts: { margin: 0, fontSize: 16, color: '#3D4C5C' },
  qrRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    marginTop: 28,
    padding: 20,
    borderRadius: 8,
    background: '#F4F6F9',
  },
  qrText: { flex: 1 },
  qrTitle: { margin: 0, fontSize: 21, fontWeight: 700, color: '#14263A' },
  qrSubtitle: { margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: '#5A6A7A' },
  contact: { margin: '12px 0 0', fontSize: 17, fontWeight: 600, color: '#123B5C' },
  info: { textAlign: 'center', fontSize: 14, color: '#7A889A' },
  error: { textAlign: 'center', fontSize: 14, color: '#B4232A' },
}
