'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  deleteBien,
  getImmoDashboardData,
  setBienPublished,
} from '@/services/immo-dashboard.service'
import { buildBienPublicUrl } from '@/lib/immo/public-url'
import { formatPrice, formatSurface, formatLocation } from '@/lib/immo/format'
import { BIEN_KIND_LABELS, BIEN_STATUS_LABELS } from '@/types/immo'
import type { AgenceStats, BienWithPhotos } from '@/types/immo'

export default function ImmoDashboardPage() {
  const [biens, setBiens] = useState<BienWithPhotos[]>([])
  const [stats, setStats] = useState<AgenceStats | null>(null)
  const [agenceName, setAgenceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await getImmoDashboardData()

      if (cancelled) return

      if (error || !data) {
        setError(error || 'Tableau de bord indisponible.')
        setLoading(false)
        return
      }

      setAgenceName(data.agence.name)
      setBiens(data.biens)
      setStats(data.stats)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) return biens

    return biens.filter(bien =>
      [bien.title, bien.reference, bien.city, bien.postal_code]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(needle))
    )
  }, [biens, query])

  async function handleTogglePublished(bien: BienWithPhotos) {
    setBusyId(bien.id)

    const { data, error } = await setBienPublished(bien.id, !bien.is_published)

    if (!error && data) {
      setBiens(current =>
        current.map(item =>
          item.id === bien.id ? { ...item, is_published: data.is_published } : item
        )
      )
    } else if (error) {
      setError(error)
    }

    setBusyId(null)
  }

  async function handleDelete(bien: BienWithPhotos) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${bien.title} » et ses ${bien.photos.length} photo(s) ?`
    )

    if (!confirmed) return

    setBusyId(bien.id)

    const { error } = await deleteBien(bien.id)

    if (error) {
      setError(error)
    } else {
      setBiens(current => current.filter(item => item.id !== bien.id))
    }

    setBusyId(null)
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Mes biens</h1>
            {agenceName && <p style={styles.subtitle}>{agenceName}</p>}
          </div>

          <input
            style={styles.search}
            value={query}
            placeholder="Rechercher un bien, une référence, une ville…"
            onChange={event => setQuery(event.target.value)}
          />
        </div>

        {stats && (
          <ul style={styles.stats}>
            <StatCard label="Biens" value={stats.total_biens} />
            <StatCard label="En vitrine" value={stats.biens_publies} />
            <StatCard label="Photos" value={stats.total_photos} />
            <StatCard label="Scans QR (7 j)" value={stats.scans_7j} />
            <StatCard label="Scans QR (total)" value={stats.total_scans} />
          </ul>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {loading ? (
          <p style={styles.info}>Chargement…</p>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>Aucun bien pour le moment</p>
            <p style={styles.emptyText}>
              Créez une annonce, importez les photos de la maison, puis imprimez son
              QR code pour la vitrine.
            </p>

            <Link href="/immo/dashboard/biens/new" style={styles.emptyButton}>
              Créer mon premier bien
            </Link>
          </div>
        ) : (
          <ul style={styles.list}>
            {filtered.map(bien => (
              <li key={bien.id} style={styles.card}>
                <div style={styles.coverWrapper}>
                  {bien.photos[0] ? (
                    <img src={bien.photos[0].url} alt="" style={styles.cover} />
                  ) : (
                    <span style={styles.coverEmpty}>Pas encore de photo</span>
                  )}

                  <span style={styles.photoCount}>
                    {bien.photos.length} photo{bien.photos.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <p style={styles.cardMeta}>
                    {BIEN_KIND_LABELS[bien.kind]} · Réf. {bien.reference} ·{' '}
                    {BIEN_STATUS_LABELS[bien.status]}
                  </p>

                  <h2 style={styles.cardTitle}>{bien.title}</h2>

                  <p style={styles.cardLocation}>
                    {[formatLocation(bien.postal_code, bien.city), formatSurface(bien.surface)]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>

                  <p style={styles.cardPrice}>
                    {formatPrice(bien.price, bien.transaction)}
                  </p>

                  <p style={styles.cardScans}>
                    {bien.scans_count} scan{bien.scans_count > 1 ? 's' : ''} du QR code
                  </p>

                  <div style={styles.cardActions}>
                    <Link href={`/immo/dashboard/biens/${bien.id}`} style={styles.action}>
                      Modifier / photos
                    </Link>

                    <Link
                      href={`/immo/dashboard/biens/${bien.id}/affiche`}
                      style={styles.action}
                    >
                      Affiche QR
                    </Link>

                    <a
                      href={buildBienPublicUrl(bien.public_token)}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.action}
                    >
                      Voir l’annonce
                    </a>

                    <button
                      type="button"
                      style={styles.action}
                      onClick={() => handleTogglePublished(bien)}
                      disabled={busyId === bien.id}
                    >
                      {bien.is_published ? 'Retirer de la vitrine' : 'Publier'}
                    </button>

                    <button
                      type="button"
                      style={{ ...styles.action, ...styles.danger }}
                      onClick={() => handleDelete(bien)}
                      disabled={busyId === bien.id}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <li style={styles.statCard}>
      <span style={styles.statValue}>{value ?? 0}</span>
      <span style={styles.statLabel}>{label}</span>
    </li>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 60px' },
  container: { maxWidth: 1080, margin: '0 auto' },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { margin: 0, fontSize: 26, color: '#14263A' },
  subtitle: { margin: '4px 0 0', fontSize: 14, color: '#7A889A' },
  search: {
    flex: '1 1 280px',
    maxWidth: 380,
    borderRadius: 12,
    border: '1px solid #D6DEE8',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
  },
  stats: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
    margin: '0 0 20px',
    padding: 0,
  },
  statCard: {
    background: '#FFFFFF',
    borderRadius: 14,
    padding: '14px 16px',
    boxShadow: '0 4px 16px rgba(20, 38, 58, 0.05)',
  },
  statValue: { display: 'block', fontSize: 24, fontWeight: 700, color: '#123B5C' },
  statLabel: { display: 'block', fontSize: 13, color: '#7A889A' },
  error: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#FDECEC',
    color: '#B4232A',
    fontSize: 14,
  },
  info: { fontSize: 14, color: '#7A889A' },
  empty: {
    background: '#FFFFFF',
    borderRadius: 18,
    padding: '40px 24px',
    textAlign: 'center',
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.06)',
  },
  emptyTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: '#14263A' },
  emptyText: { margin: '8px auto 18px', maxWidth: 420, fontSize: 14, color: '#7A889A' },
  emptyButton: {
    display: 'inline-block',
    padding: '11px 20px',
    borderRadius: 12,
    background: '#123B5C',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
  list: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
    margin: 0,
    padding: 0,
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#EEF2F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  coverEmpty: { fontSize: 13, color: '#8A97A6' },
  photoCount: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    padding: '3px 9px',
    borderRadius: 999,
    background: 'rgba(18,59,92,0.85)',
    color: '#FFFFFF',
    fontSize: 11,
  },
  cardBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 4 },
  cardMeta: { margin: 0, fontSize: 12, color: '#8A97A6' },
  cardTitle: { margin: '2px 0', fontSize: 17, color: '#14263A' },
  cardLocation: { margin: 0, fontSize: 13, color: '#5A6A7A' },
  cardPrice: { margin: '6px 0 0', fontSize: 20, fontWeight: 700, color: '#123B5C' },
  cardScans: { margin: '2px 0 0', fontSize: 12, color: '#8A97A6' },
  cardActions: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  action: {
    padding: '7px 11px',
    borderRadius: 9,
    border: '1px solid #D6DEE8',
    background: '#FFFFFF',
    color: '#14263A',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  danger: { color: '#B4232A', borderColor: '#F0CFD1' },
}
