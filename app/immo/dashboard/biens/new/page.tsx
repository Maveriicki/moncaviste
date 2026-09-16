'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BienFormPanel } from '@/features/immo-dashboard/components/BienFormPanel'
import {
  EMPTY_BIEN_FORM,
  createBien,
  ensureAgence,
  nextReference,
} from '@/services/immo-dashboard.service'
import type { BienForm } from '@/types/immo'

export default function NewBienPage() {
  const router = useRouter()
  const [form, setForm] = useState<BienForm>(EMPTY_BIEN_FORM)
  const [agenceId, setAgenceId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await ensureAgence()

      if (cancelled) return

      if (error || !data) {
        setError(error || 'Agence introuvable.')
        return
      }

      const reference = await nextReferenceSafe(data.id)

      if (cancelled) return

      setAgenceId(data.id)
      setForm(current => ({
        ...current,
        contact_name: current.contact_name || data.name,
        contact_phone: current.contact_phone || data.phone || '',
        contact_email: current.contact_email || data.email || '',
        reference: current.reference || reference,
      }))
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit() {
    if (!agenceId) return

    setSaving(true)
    setError(null)

    const { data, error } = await createBien(agenceId, form)

    if (error || !data) {
      setError(error || 'Création impossible.')
      setSaving(false)
      return
    }

    router.push(`/immo/dashboard/biens/${data.id}?created=1`)
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Nouveau bien</h1>
        <p style={styles.subtitle}>
          Renseignez l’annonce, puis importez les photos à l’étape suivante. Le QR
          code est généré automatiquement.
        </p>

        <BienFormPanel
          form={form}
          saving={saving}
          submitLabel="Créer et ajouter les photos"
          error={error}
          onChange={patch => setForm(current => ({ ...current, ...patch }))}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/immo/dashboard')}
        />
      </div>
    </main>
  )
}

async function nextReferenceSafe(agenceId: string) {
  try {
    return await nextReference(agenceId)
  } catch {
    return ''
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px 60px' },
  container: { maxWidth: 880, margin: '0 auto' },
  title: { margin: 0, fontSize: 26, color: '#14263A' },
  subtitle: { margin: '6px 0 18px', fontSize: 14, color: '#7A889A' },
}
