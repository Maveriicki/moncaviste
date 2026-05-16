// app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', shop_name: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signUp(form.email, form.password, form.shop_name)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Le trigger SQL crée automatiquement le caviste
    router.push('/dashboard?welcome=1')
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🍷</div>
        <h1 style={styles.title}>MonCaviste SaaS</h1>
        <p style={styles.subtitle}>Créez votre espace caviste</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nom du magasin</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Cave Excellence Paris"
              value={form.shop_name}
              onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))}
              required
              minLength={2}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email professionnel</label>
            <input
              style={styles.input}
              type="email"
              placeholder="contact@macave.fr"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              style={styles.input}
              type="password"
              placeholder="8 caractères minimum"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon espace caviste'}
          </button>
        </form>

        <p style={styles.footer}>
          Déjà un compte ?{' '}
          <Link href="/login" style={styles.link}>Se connecter</Link>
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#4E1020', padding:'20px' },
  card:     { background:'#fff', borderRadius:'20px', padding:'40px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
  logo:     { fontSize:'48px', textAlign:'center', marginBottom:'12px' },
  title:    { fontFamily:'Georgia,serif', fontSize:'24px', color:'#4E1020', textAlign:'center', margin:'0 0 4px' },
  subtitle: { color:'#A8909A', fontSize:'14px', textAlign:'center', margin:'0 0 28px' },
  form:     { display:'flex', flexDirection:'column', gap:'16px' },
  field:    { display:'flex', flexDirection:'column', gap:'6px' },
  label:    { fontSize:'13px', fontWeight:600, color:'#6B4D55' },
  input:    { border:'2px solid #F0E8DC', borderRadius:'10px', padding:'11px 14px', fontSize:'14px', outline:'none', transition:'border-color .2s' },
  error:    { background:'#FFF0F0', border:'1px solid #FFB3B3', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#C0392B' },
  btn:      { background:'#7B1D2E', color:'#fff', border:'none', borderRadius:'50px', padding:'14px', fontSize:'15px', fontWeight:700, cursor:'pointer' },
  footer:   { textAlign:'center', marginTop:'20px', fontSize:'13px', color:'#A8909A' },
  link:     { color:'#7B1D2E', fontWeight:600, textDecoration:'none' },
}
