// components/widget/WidgetClient.tsx
// Le widget MonCaviste — côté client, données réelles depuis Supabase
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, submitRating, saveConversation } from '@/lib/supabase'
import type { Caviste, Wine, WineColor, WineTannin, QuestionnaireAnswers } from '@/types/database'

interface Props {
  caviste: Caviste
  initialWines: Wine[]
}

// ── Moteur de scoring offline ──
const CKW: Record<string, string[]> = {
  rouge: ['rouge','red','pinot noir','merlot','cabernet','syrah','grenache','gamay','malbec','sangiovese'],
  blanc: ['blanc','white','chardonnay','riesling','sauvignon','muscadet','gewurztraminer'],
  rose:  ['rose','provence'],
  effervescent: ['champagne','bulles','effervescent','cava','mousseux','sparkling'],
}
const DKW: Record<string, string[]> = {
  moelleux: ['moelleux','doux','sucre','dessert','liquoreux'],
  'demi-sec': ['demi-sec'],
  sec: ['brut','mineral','sec','dry'],
}
const FKW: Record<string, string[]> = {
  'viande rouge': ['viande rouge','boeuf','steak','gigot','agneau','gibier','barbecue','burger'],
  'poulet':       ['poulet','veau','volaille','chicken'],
  'poisson':      ['poisson','saumon','sole','fish'],
  'fruits de mer':['fruits de mer','huitres','crevettes','sushi','seafood'],
  'fromage':      ['fromage','munster','roquefort','cheese'],
  'dessert':      ['dessert','gateau','tarte','chocolat','foie gras'],
  'aperitif':     ['aperitif','apero','tapas'],
}

function norm(s: string) {
  return s.toLowerCase()
    .replace(/[éèêë]/g,'e').replace(/[àâ]/g,'a')
    .replace(/[ùû]/g,'u').replace(/[îï]/g,'i')
    .replace(/[ôö]/g,'o').replace(/ç/g,'c')
}

function detect(txt: string, kw: Record<string, string[]>): string | null {
  let best: string | null = null, n = 0
  for (const k in kw) {
    const c = kw[k].filter(w => txt.includes(w)).length
    if (c > n) { n = c; best = k }
  }
  return best
}

function getBudget(txt: string): number | null {
  const m = txt.match(/moins de (\d+)|(\d+)\s*euros?|(\d+)\s*€|under\s*(\d+)/)
  if (m) {
    const v = parseInt(m[1]||m[2]||m[3]||m[4])
    return v <= 10 ? 10 : v <= 15 ? 15 : v <= 20 ? 20 : v <= 30 ? 30 : 999
  }
  if (txt.includes('pas cher') || txt.includes('cheap')) return 10
  return null
}

function scoreWine(w: Wine, color: string|null, dry: string|null, food: string|null, bgt: number|null, tannin: string|null): number {
  let s = 0
  if (color && w.color === color) s += 40
  if (dry && w.dryness === dry) s += 20
 if (food && w.foods) {
  w.foods.forEach((f: string) => {
    if (f.includes(food) || food.includes(f)) s += 30
  })
}
  if (bgt && w.price <= bgt) s += 15
  if (tannin && w.tannin === tannin) s += 25
  return s
}

function searchWines(query: string, wines: Wine[], tannin?: string|null) {
  const txt = norm(query)
  if (txt.includes('surprise') || txt.includes('hasard')) {
    const shuffled = [...wines].sort(() => Math.random() - 0.5)
    return { wines: shuffled.slice(0, 3), surprise: true }
  }
  const color = detect(txt, CKW)
  const dry   = detect(txt, DKW)
  const food  = detect(txt, FKW)
  const bgt   = getBudget(txt)
  const scored = wines.map(w => ({ wine: w, score: scoreWine(w, color, dry, food, bgt, tannin||null) }))
  scored.sort((a, b) => b.score - a.score)
  let res = scored.filter(r => (!bgt || bgt === 999 || r.wine.price <= bgt) && r.score > 0)
  if (res.length < 3) res = scored.filter(r => !bgt || bgt === 999 || r.wine.price <= bgt)
  return { wines: res.slice(0, 5).map(r => r.wine), color, dry, food, bgt, surprise: false }
}

// ── Questionnaire steps ──
const QS = [
  { id: 'occasion', label: 'Pour quelle occasion ?',
    opts: [{e:'🍽️',l:'Un repas',v:'repas'},{e:'🥂',l:'Un aperitif',v:'aperitif'},{e:'🎁',l:'Un cadeau',v:'cadeau'},{e:'🎉',l:'Une fete',v:'fete'}] },
  { id: 'food', label: 'Quel plat ?', skipIf: (a: QuestionnaireAnswers) => a.occasion==='cadeau'||a.occasion==='fete',
    opts: [{e:'🥩',l:'Viande rouge',v:'viande rouge'},{e:'🍗',l:'Viande blanche',v:'poulet'},{e:'🐟',l:'Poisson',v:'poisson'},{e:'🧀',l:'Fromage',v:'fromage'},{e:'🍰',l:'Dessert',v:'dessert'},{e:'🥂',l:'Aperitif',v:'aperitif'}] },
  { id: 'color', label: 'Quelle couleur ?',
    opts: [{e:'🔴',l:'Rouge',v:'rouge'},{e:'🟡',l:'Blanc',v:'blanc'},{e:'🌸',l:'Rose',v:'rose'},{e:'🫧',l:'Effervescent',v:'effervescent'},{e:'🤍',l:'Peu importe',v:null}] },
  { id: 'tannin', label: 'Quel style de rouge ?', onlyFor: 'rouge',
    opts: [{e:'🍓',l:'Léger & fruité',v:'leger'},{e:'🍒',l:'Souple & rond',v:'souple'},{e:'💪',l:'Tannique & puissant',v:'tannique'},{e:'🤍',l:'Peu importe',v:null}] },
  { id: 'budget', label: 'Votre budget ?',
    opts: [{e:'🪙',l:'< 10 €',v:10},{e:'💶',l:'10-15 €',v:15},{e:'💳',l:'15-20 €',v:20},{e:'💎',l:'> 20 €',v:999}] },
]

export default function WidgetClient({ caviste, initialWines }: Props) {
  const [wines]    = useState<Wine[]>(initialWines)
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [results, setResults] = useState<Wine[]>([])
  const [view, setView]       = useState<'conseil'|'resultats'|'chat'>('conseil')
  const [chatMsgs, setChatMsgs] = useState<{role:'user'|'bot';content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const sessionId = useRef(crypto.randomUUID())

  // Sauvegarde la conversation à chaque changement
  useEffect(() => {
    if (chatMsgs.length > 0) {
      saveConversation(caviste.id, sessionId.current, {
        messages: chatMsgs.map(m => ({ ...m, ts: new Date().toISOString() })),
        answers,
        results: results.map(w => w.id),
        lang: 'fr',
      }).catch(() => {}) // silencieux
    }
  }, [chatMsgs, caviste.id, answers, results])

  function shouldSkip(q: typeof QS[0]): boolean {
    if ('onlyFor' in q && answers.color !== q.onlyFor) return true
    if ('skipIf' in q && (q as any).skipIf(answers)) return true
    return false
  }

  function nextStep() {
    let next = step + 1
    while (next < QS.length && shouldSkip(QS[next])) next++
    if (next >= QS.length) {
      showResults()
    } else {
      setStep(next)
    }
  }

  function showResults() {
    const res = searchWines(
      Object.values(answers).filter(Boolean).join(' '),
      wines,
      answers.tannin
    )
    setResults(res.wines)
    setView('resultats')
  }

  function sendChat() {
    const msg = chatInput.trim()
    if (!msg) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role:'user', content:msg }])

    setTimeout(() => {
      const res = searchWines(msg, wines, answers.tannin)
      if (res.wines.length > 0) setResults(res.wines)
      const reply = res.surprise
        ? `Voici 3 vins choisis au hasard : ${res.wines.map((w,i) => `${i+1}. ${w.name} (${w.price.toFixed(2)} €)`).join(', ')}`
        : res.wines.length === 0
          ? "Aucun vin trouvé. Essayez d'autres critères."
          : `${res.wines.length} vins sélectionnés. ${res.wines[0].name} (${res.wines[0].price.toFixed(2)} €) — ${res.wines[0].description || ''}`
      setChatMsgs(prev => [...prev, { role:'bot', content:reply }])
    }, 600)
  }

  async function rateWine(wine: Wine, score: number) {
    setRatings(prev => ({ ...prev, [wine.id]: score }))
    await submitRating(wine.id, caviste.id, sessionId.current, score)
  }

  // Couleurs du caviste
  const primary = caviste.primary_color || '#7B1D2E'

  const currentQ = QS[step]
  const visibleSteps = QS.filter((q, i) => i <= step || !shouldSkip(q))

  return (
    <div style={{ ...wStyles.app, fontFamily:'DM Sans,sans-serif' }}>
      {/* Header */}
      <header style={{ ...wStyles.header, background: primary }}>
        <div style={wStyles.headerInner}>
          {caviste.logo_url
            ? <img src={caviste.logo_url} alt={caviste.name} style={wStyles.logo} />
            : <span style={wStyles.logoEmoji}>🍷</span>
          }
          <div>
            <div style={wStyles.cavisteName}>{caviste.name}</div>
            <div style={wStyles.cavisteTagline}>Conseil vin personnalisé</div>
          </div>
        </div>
        <div style={wStyles.headerTabs}>
          {(['conseil','resultats','chat'] as const).map(v => (
            <button key={v} style={{ ...wStyles.tab, ...(view===v?{background:'rgba(255,255,255,.18)',color:'#fff'}:{}) }} onClick={() => setView(v)}>
              {v === 'conseil' ? '🏠' : v === 'resultats' ? `🍷 ${results.length}` : '💬'}
            </button>
          ))}
        </div>
      </header>

      {/* ── VUE CONSEIL ── */}
      {view === 'conseil' && (
        <div style={wStyles.page}>
          {/* Steps */}
          <div style={wStyles.stepsRow}>
            {visibleSteps.map((q, vi) => {
              const i = QS.indexOf(q)
              return (
                <div key={q.id} style={{ display:'flex', alignItems:'center', flex:1 }}>
                  <div style={{ ...wStyles.stepDot, ...(i < step ? {background:'#C8A96E',borderColor:'#C8A96E',color:'#fff'} : i===step ? {background:primary,borderColor:primary,color:'#fff'} : {}) }}>
                    {vi + 1}
                  </div>
                  {vi < visibleSteps.length - 1 && <div style={{ ...wStyles.stepLine, ...(i < step ? {background:'#C8A96E'} : {}) }} />}
                </div>
              )
            })}
          </div>

          {/* Question */}
          <div style={wStyles.qCard}>
            <h3 style={wStyles.qTitle}>{currentQ.label}</h3>
            <div style={wStyles.optsGrid}>
              {currentQ.opts.map((o) => (
                <button
                  key={String(o.v)}
                  style={{ ...wStyles.opt, ...(answers[currentQ.id as keyof QuestionnaireAnswers] === o.v ? {borderColor:primary,background:`${primary}08`,color:primary} : {}) }}
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, [currentQ.id]: o.v }))
                  }}
                >
                  <span style={{ fontSize:'26px' }}>{o.e}</span>
                  <span style={{ fontSize:'12px', fontWeight:500 }}>{o.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={wStyles.nav}>
            {step > 0 && (
              <button style={wStyles.btnBack} onClick={() => setStep(s => s - 1)}>← Retour</button>
            )}
            <button
              style={{ ...wStyles.btnNext, background:primary, opacity: answers[currentQ.id as keyof QuestionnaireAnswers] === undefined ? 0.4 : 1 }}
              onClick={nextStep}
              disabled={answers[currentQ.id as keyof QuestionnaireAnswers] === undefined}
            >
              {step < QS.length - 1 ? 'Suivant →' : 'Voir ma sélection 🍷'}
            </button>
          </div>
        </div>
      )}

      {/* ── VUE RESULTATS ── */}
      {view === 'resultats' && (
        <div style={wStyles.page}>
          {results.length === 0 ? (
            <div style={wStyles.empty}>
              <div style={{ fontSize:'40px' }}>🍷</div>
              <p>Complétez le questionnaire pour découvrir notre sélection.</p>
              <button style={{ ...wStyles.btnNext, background:primary }} onClick={() => setView('conseil')}>
                Commencer →
              </button>
            </div>
          ) : (
            results.map((wine, i) => (
              <WineCard key={wine.id} wine={wine} rank={i+1} primary={primary} rating={ratings[wine.id]||0} onRate={score => rateWine(wine, score)} />
            ))
          )}
          <button style={wStyles.restart} onClick={() => { setStep(0); setAnswers({}); setResults([]); setView('conseil'); }}>
            ↺ Recommencer
          </button>
        </div>
      )}

      {/* ── VUE CHAT ── */}
      {view === 'chat' && (
        <div style={wStyles.chatPage}>
          <div style={wStyles.chatMsgs}>
            {chatMsgs.length === 0 && (
              <div style={wStyles.chatWelcome}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>💬</div>
                <p>Bonjour ! Je suis votre sommelier. Décrivez ce que vous cherchez : couleur, budget, plat...</p>
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} style={{ ...wStyles.msg, ...(m.role==='user'?wStyles.msgUser:{}) }}>
                <div style={{ ...wStyles.bubble, ...(m.role==='user'?{background:primary,color:'#fff'}:{}) }}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div style={wStyles.chatFoot}>
            <input
              style={wStyles.chatInput}
              placeholder="Ex : rouge léger pour du saumon..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && sendChat()}
            />
            <button style={{ ...wStyles.chatSend, background:primary }} onClick={sendChat}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

function WineCard({ wine, rank, primary, rating, onRate }: {
  wine: Wine; rank: number; primary: string; rating: number; onRate: (s: number) => void
}) {
  const barColor = wine.color==='rouge' ? `linear-gradient(90deg,${primary},#A63248)` : wine.color==='blanc' ? 'linear-gradient(90deg,#C8A96E,#E2CFA0)' : wine.color==='rose' ? 'linear-gradient(90deg,#D4848A,#F0B8BC)' : 'linear-gradient(90deg,#5B9BAA,#7EB5C0)'
  const [open, setOpen] = useState(false)

  return (
    <div style={wcStyles.card}>
      <div style={{ ...wcStyles.bar, background: barColor }} />
      <div style={wcStyles.body}>
        <div style={wcStyles.top}>
          <span style={{ fontSize:'10px', color:'#A8909A', textTransform:'uppercase', letterSpacing:'1px' }}>N°{rank}</span>
        </div>
        <div style={wcStyles.name}>{wine.name}</div>
        <div style={wcStyles.tags}>
          <span style={{ ...wcStyles.tag, background:`${primary}15`, color:primary }}>{wine.color}</span>
          {wine.style && <span style={wcStyles.tagNeutral}>🍇 {wine.style}</span>}
          {wine.region && <span style={wcStyles.tagNeutral}>{wine.region}</span>}
          <span style={{ ...wcStyles.tagNeutral, color:'#2D6A4F', background:'rgba(45,106,79,.1)' }}>{wine.price.toFixed(2)} €</span>
        </div>
        {wine.description && <p style={wcStyles.desc}>{wine.description}</p>}

        {/* Accordion */}
        <button style={wcStyles.toggle} onClick={() => setOpen(o => !o)}>
          📖 Notes de dégustation {open ? '▲' : '▼'}
        </button>
        {open && (
          <div style={wcStyles.degustation}>
            <p>{wine.degustation}</p>
            {wine.accord && <p style={{ marginTop:'8px', color:'#A63248', fontStyle:'italic' }}>🍽️ {wine.accord}</p>}
            {wine.temperature && <p style={{ marginTop:'4px', fontSize:'12px', color:'#A8909A' }}>🌡️ {wine.temperature} — 📅 {wine.garde}</p>}
          </div>
        )}

        {/* Rating */}
        <div style={wcStyles.rating}>
          <span style={{ fontSize:'12px', color:'#A8909A' }}>Votre avis : </span>
          {[1,2,3,4,5].map(s => (
            <button key={s} style={{ background:'none', border:'none', fontSize:'18px', cursor:'pointer', color: s <= rating ? '#C8A96E' : '#E8DDD0' }} onClick={() => onRate(s)}>★</button>
          ))}
        </div>

        <div style={wcStyles.price}>{wine.price.toFixed(2)} €</div>
      </div>
    </div>
  )
}

const wStyles: Record<string, React.CSSProperties> = {
  app:       { display:'flex', flexDirection:'column', minHeight:'100vh', background:'#FBF7F2', maxWidth:'480px', margin:'0 auto' },
  header:    { flexShrink:0, paddingTop:'env(safe-area-inset-top,0px)' },
  headerInner:{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 16px 0' },
  logo:      { width:'36px', height:'36px', borderRadius:'50%', objectFit:'cover' },
  logoEmoji: { fontSize:'24px' },
  cavisteName:  { fontFamily:'Georgia,serif', fontSize:'16px', color:'#E2CFA0', fontWeight:600 },
  cavisteTagline:{ fontSize:'10px', color:'rgba(200,169,110,.5)', letterSpacing:'1px' },
  headerTabs:{ display:'flex', padding:'8px 12px 12px', gap:'6px' },
  tab:       { flex:1, padding:'8px', borderRadius:'50px', border:'none', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)', fontSize:'12px', cursor:'pointer' },
  page:      { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' },
  stepsRow:  { display:'flex', alignItems:'center', padding:'0 2px' },
  stepDot:   { width:'26px', height:'26px', borderRadius:'50%', border:'2px solid #E8DDD0', background:'#E8DDD0', color:'#A8909A', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepLine:  { flex:1, height:'2px', background:'#E8DDD0' },
  qCard:     { background:'#fff', borderRadius:'18px', padding:'20px', boxShadow:'0 4px 20px rgba(123,29,46,.1)' },
  qTitle:    { fontFamily:'Georgia,serif', fontSize:'20px', color:'#1C0D12', margin:'0 0 14px', fontWeight:600 },
  optsGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' },
  opt:       { border:'2px solid #F0E8DC', background:'#FBF7F2', borderRadius:'12px', padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', cursor:'pointer', transition:'all .15s' },
  nav:       { display:'flex', gap:'10px' },
  btnBack:   { background:'none', border:'2px solid #F0E8DC', borderRadius:'50px', padding:'12px 20px', fontSize:'14px', color:'#6B4D55', cursor:'pointer' },
  btnNext:   { flex:1, border:'none', borderRadius:'50px', padding:'14px', fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer' },
  empty:     { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px', color:'#A8909A', fontSize:'14px', textAlign:'center' },
  restart:   { background:'none', border:'1.5px solid #F0E8DC', borderRadius:'50px', padding:'10px 20px', fontSize:'12px', color:'#A8909A', cursor:'pointer', alignSelf:'center' },
  chatPage:  { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  chatMsgs:  { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px' },
  chatWelcome:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#A8909A', fontSize:'14px', textAlign:'center', padding:'20px' },
  msg:       { display:'flex' },
  msgUser:   { justifyContent:'flex-end' },
  bubble:    { maxWidth:'80%', padding:'10px 14px', borderRadius:'16px', fontSize:'13px', lineHeight:1.55, background:'#fff', boxShadow:'0 2px 10px rgba(0,0,0,.08)' },
  chatFoot:  { padding:'12px 16px', background:'#fff', borderTop:'1px solid #F0E8DC', display:'flex', gap:'8px' },
  chatInput: { flex:1, border:'2px solid #F0E8DC', borderRadius:'50px', padding:'10px 16px', fontSize:'13px', outline:'none' },
  chatSend:  { width:'40px', height:'40px', border:'none', borderRadius:'50%', color:'#fff', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
}

const wcStyles: Record<string, React.CSSProperties> = {
  card:    { background:'#fff', borderRadius:'18px', overflow:'hidden', boxShadow:'0 4px 20px rgba(123,29,46,.1)' },
  bar:     { height:'5px' },
  body:    { padding:'15px' },
  top:     { marginBottom:'6px' },
  name:    { fontFamily:'Georgia,serif', fontSize:'18px', color:'#1C0D12', fontWeight:600, marginBottom:'8px' },
  tags:    { display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'9px' },
  tag:     { padding:'3px 9px', borderRadius:'50px', fontSize:'10px', fontWeight:700, textTransform:'uppercase' },
  tagNeutral:{ padding:'3px 9px', borderRadius:'50px', fontSize:'10px', fontWeight:600, background:'#F0E8DC', color:'#6B4D55' },
  desc:    { fontSize:'12px', color:'#6B4D55', lineHeight:1.55, marginBottom:'8px' },
  toggle:  { background:'rgba(200,169,110,.08)', border:'1px solid rgba(200,169,110,.2)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'#7A5E20', cursor:'pointer', width:'100%', textAlign:'left', marginBottom:'6px' },
  degustation:{ fontSize:'13px', color:'#6B4D55', lineHeight:1.6, background:'#FBF7F2', padding:'12px', borderRadius:'10px', marginBottom:'8px' },
  rating:  { display:'flex', alignItems:'center', gap:'4px', padding:'8px 0', borderTop:'1px solid #F0E8DC', marginTop:'6px' },
  price:   { fontFamily:'Georgia,serif', fontSize:'22px', color:'#7B1D2E', fontWeight:600, marginTop:'8px' },
}
