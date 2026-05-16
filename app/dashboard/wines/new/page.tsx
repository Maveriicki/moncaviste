// app/dashboard/wines/new/page.tsx  (et réutilisé pour l'édition)
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCavisteProfile, createWine, updateWine, getWines } from '@/lib/supabase'
import type { WineColor, WineDryness, WineTannin } from '@/types/database'

const FOODS_OPTIONS = [
  'viande rouge','viande blanche','poisson','fruits de mer',
  'fromage','dessert','aperitif','cuisine asiatique','charcuterie','champignons',
]

const OCCASIONS_OPTIONS = ['repas','aperitif','cadeau','fete','soiree']

export default function WineFormPage({ params }: { params?: { id?: string } }) {
  const router = useRouter()
  const isEdit = !!params?.id

  const [cavisteId, setCavisteId] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [form, setForm] = useState({
    name:        '',
    color:       'rouge' as WineColor,
    style:       '',
    region:      '',
    appellation: '',
    price:       '',
    dryness:     'sec' as WineDryness,
    tannin:      '' as WineTannin | '',
    vintage:     '',
    in_stock:    true,
    stock_qty:   '',
    description: '',
    degustation: '',
    accord:      '',
    temperature: '',
    garde:       '',
    foods:       [] as string[],
    occasions:   [] as string[],
  })

  useEffect(() => {
    async function load() {
      const { data: cav } = await getCavisteProfile()
      if (!cav) return
      setCavisteId(cav.id)

      if (isEdit && params?.id) {
        const { data: wines } = await getWines(cav.id)
        const wine = wines?.find(w => w.id === params.id)
        if (wine) {
          setForm({
            name:        wine.name,
            color:       wine.color,
            style:       wine.style || '',
            region:      wine.region || '',
            appellation: wine.appellation || '',
            price:       wine.price.toString(),
            dryness:     wine.dryness || 'sec',
            tannin:      wine.tannin || '',
            vintage:     wine.vintage?.toString() || '',
            in_stock:    wine.in_stock,
            stock_qty:   wine.stock_qty?.toString() || '',
            description: wine.description || '',
            degustation: wine.degustation || '',
            accord:      wine.accord || '',
            temperature: wine.temperature || '',
            garde:       wine.garde || '',
            foods:       wine.foods || [],
            occasions:   wine.occasions || [],
          })
        }
      }
    }
    load()
  }, [isEdit, params?.id])

  function toggleArr(key: 'foods' | 'occasions', val: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val)
        ? f[key].filter(v => v !== val)
        : [...f[key], val],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cavisteId) return
    setSaving(true)
    setError(null)

    const wineData = {
      name:        form.name,
      color:       form.color,
      style:       form.style || null,
      region:      form.region || null,
      appellation: form.appellation || null,
      price:       parseFloat(form.price),
      dryness:     form.dryness,
      tannin:      (form.tannin || null) as WineTannin | null,
      vintage:     form.vintage ? parseInt(form.vintage) : null,
      in_stock:    form.in_stock,
      stock_qty:   form.stock_qty ? parseInt(form.stock_qty) : null,
      description: form.description || null,
      degustation: form.degustation || null,
      accord:      form.accord || null,
      temperature: form.temperature || null,
      garde:       form.garde || null,
      foods:       form.foods,
      occasions:   form.occasions,
      profil:      { tanins:50, acidite:50, corps:50, fruit:60, sucre:20 },
      image_url:   null,
      position:    0,
    }

    const { error } = isEdit && params?.id
      ? await updateWine(params.id, wineData)
      : await createWine(cavisteId, wineData)

    if (error) { setError(error); setSaving(false); return }
    router.push('/dashboard/wines')
  }

  const inp = (label: string, key: keyof typeof form, type='text', placeholder='') => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{isEdit ? 'Modifier le vin' : 'Ajouter un vin'}</h1>
        <button style={styles.back} onClick={() => router.back()}>← Retour</button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* ── Section 1 : Identité ── */}
        <Section title="Identité du vin">
          <div style={styles.grid2}>
            {inp('Nom du vin *', 'name', 'text', 'Château Haut-Médoc 2019')}
            {inp('Cépage / Style', 'style', 'text', 'Cabernet Sauvignon/Merlot')}
            {inp('Région', 'region', 'text', 'Bordeaux')}
            {inp('Appellation', 'appellation', 'text', 'Haut-Médoc AOC')}
            {inp('Millésime', 'vintage', 'number', '2022')}
            {inp('Prix (€) *', 'price', 'number', '14.50')}
          </div>
        </Section>

        {/* ── Section 2 : Caractéristiques ── */}
        <Section title="Caractéristiques">
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Couleur *</label>
              <select style={styles.select} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value as WineColor }))}>
                <option value="rouge">🔴 Rouge</option>
                <option value="blanc">🟡 Blanc</option>
                <option value="rose">🌸 Rosé</option>
                <option value="effervescent">🫧 Effervescent</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Sucrosité</label>
              <select style={styles.select} value={form.dryness} onChange={e => setForm(f => ({ ...f, dryness: e.target.value as WineDryness }))}>
                <option value="sec">Sec</option>
                <option value="demi-sec">Demi-sec</option>
                <option value="moelleux">Moelleux</option>
              </select>
            </div>
            {form.color === 'rouge' && (
              <div style={styles.field}>
                <label style={styles.label}>Tanins</label>
                <select style={styles.select} value={form.tannin} onChange={e => setForm(f => ({ ...f, tannin: e.target.value as WineTannin }))}>
                  <option value="">— Non précisé —</option>
                  <option value="leger">Léger et fruité</option>
                  <option value="souple">Souple et rond</option>
                  <option value="tannique">Tannique et puissant</option>
                </select>
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>Température de service</label>
              <input style={styles.input} type="text" placeholder="16-18°C" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Potentiel de garde</label>
              <input style={styles.input} type="text" placeholder="5-10 ans" value={form.garde} onChange={e => setForm(f => ({ ...f, garde: e.target.value }))} />
            </div>
          </div>
        </Section>

        {/* ── Section 3 : Stock ── */}
        <Section title="Stock">
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Statut</label>
              <div style={styles.toggle}>
                <button
                  type="button"
                  style={{ ...styles.toggleBtn, ...(form.in_stock ? styles.toggleOn : {}) }}
                  onClick={() => setForm(f => ({ ...f, in_stock: true }))}
                >
                  ✓ En stock
                </button>
                <button
                  type="button"
                  style={{ ...styles.toggleBtn, ...(!form.in_stock ? styles.toggleOff : {}) }}
                  onClick={() => setForm(f => ({ ...f, in_stock: false }))}
                >
                  ✗ Rupture
                </button>
              </div>
            </div>
            {inp('Quantité en stock', 'stock_qty', 'number', '12')}
          </div>
        </Section>

        {/* ── Section 4 : Accords et occasions ── */}
        <Section title="Accords et occasions">
          <div style={styles.field}>
            <label style={styles.label}>Plats recommandés</label>
            <div style={styles.checkGrid}>
              {FOODS_OPTIONS.map(f => (
                <label key={f} style={styles.checkLabel}>
                  <input type="checkbox" checked={form.foods.includes(f)} onChange={() => toggleArr('foods', f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Occasions</label>
            <div style={styles.checkGrid}>
              {OCCASIONS_OPTIONS.map(o => (
                <label key={o} style={styles.checkLabel}>
                  <input type="checkbox" checked={form.occasions.includes(o)} onChange={() => toggleArr('occasions', o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Section 5 : Description ── */}
        <Section title="Notes de dégustation">
          <div style={styles.field}>
            <label style={styles.label}>Description courte</label>
            <textarea style={styles.textarea} rows={2} placeholder="Bordeaux généreux aux arômes de cassis..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Notes de dégustation complètes</label>
            <textarea style={styles.textarea} rows={3} placeholder="Robe rubis profond. Arômes de cassis, cerise noire..." value={form.degustation} onChange={e => setForm(f => ({ ...f, degustation: e.target.value }))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Accords mets-vins</label>
            <textarea style={styles.textarea} rows={2} placeholder="Parfait avec un gigot d'agneau ou une côte de bœuf..." value={form.accord} onChange={e => setForm(f => ({ ...f, accord: e.target.value }))} />
          </div>
        </Section>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.formActions}>
          <button type="button" style={styles.btnCancel} onClick={() => router.back()}>Annuler</button>
          <button type="submit" style={{ ...styles.btnSave, opacity: saving ? 0.6 : 1 }} disabled={saving}>
            {saving ? 'Enregistrement...' : isEdit ? '✓ Enregistrer les modifications' : '+ Ajouter le vin'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sStyles.section}>
      <h2 style={sStyles.sTitle}>{title}</h2>
      <div style={sStyles.sBody}>{children}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page:        { display:'flex', flexDirection:'column', gap:'20px', maxWidth:'800px' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:       { fontFamily:'Georgia,serif', fontSize:'24px', color:'#1C0D12', margin:0 },
  back:        { background:'none', border:'none', color:'#7B1D2E', fontSize:'14px', cursor:'pointer', fontWeight:600 },
  form:        { display:'flex', flexDirection:'column', gap:'16px' },
  grid2:       { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'14px' },
  field:       { display:'flex', flexDirection:'column', gap:'6px' },
  label:       { fontSize:'13px', fontWeight:600, color:'#6B4D55' },
  input:       { border:'2px solid #F0E8DC', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', outline:'none' },
  select:      { border:'2px solid #F0E8DC', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', outline:'none', background:'#fff' },
  textarea:    { border:'2px solid #F0E8DC', borderRadius:'10px', padding:'10px 14px', fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'inherit' },
  toggle:      { display:'flex', gap:'8px' },
  toggleBtn:   { flex:1, padding:'10px', borderRadius:'8px', border:'2px solid #F0E8DC', background:'none', fontSize:'13px', cursor:'pointer', color:'#A8909A' },
  toggleOn:    { background:'rgba(45,106,79,.1)', borderColor:'#52B788', color:'#2D6A4F', fontWeight:700 },
  toggleOff:   { background:'rgba(123,29,46,.08)', borderColor:'#A63248', color:'#7B1D2E', fontWeight:700 },
  checkGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'8px' },
  checkLabel:  { display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#6B4D55', cursor:'pointer' },
  error:       { background:'#FFF0F0', border:'1px solid #FFB3B3', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'#C0392B' },
  formActions: { display:'flex', gap:'12px', justifyContent:'flex-end', paddingTop:'8px' },
  btnCancel:   { background:'none', border:'2px solid #F0E8DC', borderRadius:'50px', padding:'12px 24px', fontSize:'14px', cursor:'pointer', color:'#6B4D55' },
  btnSave:     { background:'#7B1D2E', color:'#fff', border:'none', borderRadius:'50px', padding:'12px 28px', fontSize:'14px', fontWeight:700, cursor:'pointer' },
}
const sStyles: Record<string, React.CSSProperties> = {
  section: { background:'#fff', borderRadius:'16px', overflow:'hidden', boxShadow:'0 4px 20px rgba(123,29,46,.08)' },
  sTitle:  { fontFamily:'Georgia,serif', fontSize:'16px', color:'#4E1020', margin:0, padding:'16px 20px', borderBottom:'1px solid #F0E8DC', background:'#FBF7F2' },
  sBody:   { padding:'20px', display:'flex', flexDirection:'column', gap:'14px' },
}
