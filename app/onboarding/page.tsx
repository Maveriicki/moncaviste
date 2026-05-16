'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('cavistes')
      .insert({
        user_id: user.id,
        name,
        slug,
        is_active: true,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#4E1020',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 40,
          borderRadius: 20,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            marginBottom: 10,
          }}
        >
          Créer votre cave
        </h1>

        <p
          style={{
            marginBottom: 30,
            color: '#777',
          }}
        >
          Configurez votre espace caviste.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <input
            placeholder="Nom de la cave"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
            style={inputStyle}
          />

          <input
            placeholder="slug-public"
            value={slug}
            onChange={(e) =>
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
              )
            }
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ color: 'red' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? 'Création...'
              : 'Créer ma cave'}
          </button>
        </form>
      </div>
    </main>
  )
}

const inputStyle = {
  padding: 14,
  borderRadius: 10,
  border: '1px solid #ddd',
  fontSize: 14,
}

const buttonStyle = {
  background: '#7B1D2E',
  color: '#fff',
  border: 'none',
  padding: 14,
  borderRadius: 999,
  fontWeight: 700,
  cursor: 'pointer',
}