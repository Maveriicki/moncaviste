'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { BienFormPanel } from '@/features/immo-dashboard/components/BienFormPanel'
import { PhotoManager } from '@/features/immo-dashboard/components/PhotoManager'
import { QrCodeCard } from '@/features/immo-dashboard/components/QrCodeCard'
import {
  bienToForm,
  getBien,
  updateBien,
} from '@/services/immo-dashboard.service'
import {
  deleteBienPhoto,
  reorderBienPhotos,
  updatePhotoCaption,
  uploadBienPhotos,
} from '@/services/immo-photos.service'
import { buildBienPublicUrl } from '@/lib/immo/public-url'
import type { BienForm, BienPhoto, BienWithPhotos } from '@/types/immo'

export default function BienEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const bienId = params?.id

  const [bien, setBien] = useState<BienWithPhotos | null>(null)
  const [form, setForm] = useState<BienForm | null>(null)
  const [photos, setPhotos] = useState<BienPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const created = new URLSearchParams(window.location.search).get('created')

    if (created) setNotice('Bien créé. Importez maintenant ses photos.')
  }, [])

  const load = useCallback(async () => {
    if (!bienId) return

    const { data, error } = await getBien(bienId)

    if (error || !data) {
      setError(error || 'Bien introuvable.')
      setLoading(false)
      return
    }

    setBien(data)
    setForm(bienToForm(data))
    setPhotos(data.photos)
    setLoading(false)
  }, [bienId])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave() {
    if (!bienId || !form) return

    setSaving(true)
    setError(null)

    const { data, error } = await updateBien(bienId, form)

    if (error || !data) {
      setError(error || 'Enregistrement impossible.')
      setSaving(false)
      return
    }

    setBien(current => (current ? { ...current, ...data } : current))
    setNotice('Annonce enregistrée.')
    setSaving(false)
  }

  async function handleUpload(files: File[]) {
    if (!bien) return

    setUploading(true)
    setError(null)

    const { data, error } = await uploadBienPhotos(bien.agence_id, bien.id, files)

    if (error) {
      setError(error)
    } else if (data) {
      setPhotos(current => [...current, ...data])
      setNotice(`${data.length} photo(s) ajoutée(s).`)
    }

    setUploading(false)
  }

  async function handleDeletePhoto(photoId: string) {
    if (!bien) return

    const previous = photos
    setPhotos(current => current.filter(photo => photo.id !== photoId))

    const { error } = await deleteBienPhoto(bien.agence_id, photoId)

    if (error) {
      setError(error)
      setPhotos(previous)
    }
  }

  async function handleMovePhoto(photoId: string, direction: -1 | 1) {
    const index = photos.findIndex(photo => photo.id === photoId)
    const target = index + direction

    if (index === -1 || target < 0 || target >= photos.length) return

    const reordered = [...photos]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)

    setPhotos(reordered.map((photo, position) => ({ ...photo, position })))

    const { error } = await reorderBienPhotos(reordered.map(photo => photo.id))

    if (error) setError(error)
  }

  async function handleCaption(photoId: string, caption: string) {
    setPhotos(current =>
      current.map(photo =>
        photo.id === photoId ? { ...photo, caption: caption.trim() || null } : photo
      )
    )

    const { error } = await updatePhotoCaption(photoId, caption)

    if (error) setError(error)
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <p style={styles.info}>Chargement…</p>
        </div>
      </main>
    )
  }

  if (!bien || !form) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <p style={styles.error}>{error || 'Bien introuvable.'}</p>
          <Link href="/immo/dashboard" style={styles.backLink}>
            ← Retour aux biens
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/immo/dashboard" style={styles.backLink}>
          ← Retour aux biens
        </Link>

        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>{bien.title}</h1>
            <p style={styles.subtitle}>
              Réf. {bien.reference} · {bien.scans_count} scan
              {bien.scans_count > 1 ? 's' : ''} du QR code
            </p>
          </div>

          <a
            href={buildBienPublicUrl(bien.public_token)}
            target="_blank"
            rel="noreferrer"
            style={styles.previewLink}
          >
            Voir l’annonce publique ↗
          </a>
        </div>

        {notice && <p style={styles.notice}>{notice}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.columns}>
          <div style={styles.mainColumn}>
            <PhotoManager
              photos={photos}
              uploading={uploading}
              onUpload={handleUpload}
              onDelete={handleDeletePhoto}
              onMove={handleMovePhoto}
              onCaption={handleCaption}
            />

            <BienFormPanel
              form={form}
              saving={saving}
              submitLabel="Enregistrer l’annonce"
              onChange={patch => setForm(current => (current ? { ...current, ...patch } : current))}
              onSubmit={handleSave}
            />
          </div>

          <aside style={styles.sideColumn}>
            <QrCodeCard
              publicToken={bien.public_token}
              reference={bien.reference}
              onPrint={() => router.push(`/immo/dashboard/biens/${bien.id}/affiche`)}
            />
          </aside>
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 60px' },
  container: { maxWidth: 1080, margin: '0 auto' },
  backLink: {
    display: 'inline-block',
    marginBottom: 12,
    fontSize: 13,
    color: '#5A6A7A',
    textDecoration: 'none',
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { margin: 0, fontSize: 25, color: '#14263A' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#7A889A' },
  previewLink: {
    fontSize: 14,
    fontWeight: 600,
    color: '#123B5C',
    textDecoration: 'none',
  },
  notice: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#E8F4EC',
    color: '#1F6B3F',
    fontSize: 14,
  },
  error: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#FDECEC',
    color: '#B4232A',
    fontSize: 14,
  },
  info: { fontSize: 14, color: '#7A889A' },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 16,
    alignItems: 'start',
    marginTop: 8,
  },
  mainColumn: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  sideColumn: { position: 'sticky', top: 16 },
}
