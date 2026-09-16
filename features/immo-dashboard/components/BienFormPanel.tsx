'use client'

import type { BienForm, BienKind, BienStatus, BienTransaction, EnergyGrade } from '@/types/immo'
import { BIEN_KIND_LABELS, BIEN_STATUS_LABELS } from '@/types/immo'

interface BienFormPanelProps {
  form: BienForm
  saving: boolean
  submitLabel: string
  error?: string | null
  onChange: (patch: Partial<BienForm>) => void
  onSubmit: () => void
  onCancel?: () => void
}

const GRADES: EnergyGrade[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

export function BienFormPanel({
  form,
  saving,
  submitLabel,
  error,
  onChange,
  onSubmit,
  onCancel,
}: BienFormPanelProps) {
  return (
    <form
      style={styles.card}
      onSubmit={event => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <h2 style={styles.title}>L’annonce</h2>

      <div style={styles.grid}>
        <Field label="Titre de l’annonce *" full>
          <input
            style={styles.input}
            value={form.title}
            placeholder="Maison de plain-pied avec jardin"
            onChange={event => onChange({ title: event.target.value })}
            required
          />
        </Field>

        <Field label="Référence" hint="Générée automatiquement si vide">
          <input
            style={styles.input}
            value={form.reference}
            placeholder="REF-2026-001"
            onChange={event => onChange({ reference: event.target.value })}
          />
        </Field>

        <Field label="Type de bien">
          <select
            style={styles.input}
            value={form.kind}
            onChange={event => onChange({ kind: event.target.value as BienKind })}
          >
            {Object.entries(BIEN_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Transaction">
          <select
            style={styles.input}
            value={form.transaction}
            onChange={event =>
              onChange({ transaction: event.target.value as BienTransaction })
            }
          >
            <option value="vente">Vente</option>
            <option value="location">Location</option>
          </select>
        </Field>

        <Field label="Statut">
          <select
            style={styles.input}
            value={form.status}
            onChange={event => onChange({ status: event.target.value as BienStatus })}
          >
            {Object.entries(BIEN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={form.transaction === 'location' ? 'Loyer / mois (€) *' : 'Prix (€) *'}>
          <input
            style={styles.input}
            inputMode="decimal"
            value={form.price}
            placeholder="249000"
            onChange={event => onChange({ price: event.target.value })}
            required
          />
        </Field>

        <Field label="Charges / mois (€)">
          <input
            style={styles.input}
            inputMode="decimal"
            value={form.charges}
            onChange={event => onChange({ charges: event.target.value })}
          />
        </Field>

        <Field label="Honoraires">
          <input
            style={styles.input}
            value={form.fees}
            placeholder="4 % TTC à la charge de l’acquéreur"
            onChange={event => onChange({ fees: event.target.value })}
          />
        </Field>

        <Field label="Surface habitable (m²)">
          <input
            style={styles.input}
            inputMode="decimal"
            value={form.surface}
            onChange={event => onChange({ surface: event.target.value })}
          />
        </Field>

        <Field label="Terrain (m²)">
          <input
            style={styles.input}
            inputMode="decimal"
            value={form.land_surface}
            onChange={event => onChange({ land_surface: event.target.value })}
          />
        </Field>

        <Field label="Pièces">
          <input
            style={styles.input}
            inputMode="numeric"
            value={form.rooms}
            onChange={event => onChange({ rooms: event.target.value })}
          />
        </Field>

        <Field label="Chambres">
          <input
            style={styles.input}
            inputMode="numeric"
            value={form.bedrooms}
            onChange={event => onChange({ bedrooms: event.target.value })}
          />
        </Field>

        <Field label="Salles d’eau">
          <input
            style={styles.input}
            inputMode="numeric"
            value={form.bathrooms}
            onChange={event => onChange({ bathrooms: event.target.value })}
          />
        </Field>

        <Field label="Étage">
          <input
            style={styles.input}
            inputMode="numeric"
            value={form.floor}
            onChange={event => onChange({ floor: event.target.value })}
          />
        </Field>

        <Field label="Année de construction">
          <input
            style={styles.input}
            inputMode="numeric"
            value={form.year_built}
            onChange={event => onChange({ year_built: event.target.value })}
          />
        </Field>

        <Field label="DPE">
          <select
            style={styles.input}
            value={form.dpe}
            onChange={event => onChange({ dpe: event.target.value as EnergyGrade | '' })}
          >
            <option value="">—</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </Field>

        <Field label="GES">
          <select
            style={styles.input}
            value={form.ges}
            onChange={event => onChange({ ges: event.target.value as EnergyGrade | '' })}
          >
            <option value="">—</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Code postal">
          <input
            style={styles.input}
            value={form.postal_code}
            onChange={event => onChange({ postal_code: event.target.value })}
          />
        </Field>

        <Field label="Ville">
          <input
            style={styles.input}
            value={form.city}
            onChange={event => onChange({ city: event.target.value })}
          />
        </Field>

        <Field
          label="Adresse exacte (usage interne)"
          hint="Jamais affichée sur la page publique"
          full
        >
          <input
            style={styles.input}
            value={form.address}
            onChange={event => onChange({ address: event.target.value })}
          />
        </Field>

        <Field label="Description" full>
          <textarea
            style={{ ...styles.input, minHeight: 130, resize: 'vertical' }}
            value={form.description}
            placeholder="Belle maison de 1998 entièrement rénovée, exposée plein sud…"
            onChange={event => onChange({ description: event.target.value })}
          />
        </Field>

        <Field label="Les plus du bien" hint="Séparés par des virgules" full>
          <input
            style={styles.input}
            value={form.features}
            placeholder="Garage, Jardin clos, Cheminée, Fibre optique"
            onChange={event => onChange({ features: event.target.value })}
          />
        </Field>

        <Field label="Contact — nom">
          <input
            style={styles.input}
            value={form.contact_name}
            onChange={event => onChange({ contact_name: event.target.value })}
          />
        </Field>

        <Field label="Contact — téléphone">
          <input
            style={styles.input}
            value={form.contact_phone}
            onChange={event => onChange({ contact_phone: event.target.value })}
          />
        </Field>

        <Field label="Contact — email">
          <input
            style={styles.input}
            type="email"
            value={form.contact_email}
            onChange={event => onChange({ contact_email: event.target.value })}
          />
        </Field>
      </div>

      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={event => onChange({ is_published: event.target.checked })}
        />
        <span>
          Annonce visible par QR code — décochez pour la retirer immédiatement de la
          vitrine
        </span>
      </label>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.actions}>
        <button type="submit" style={styles.primaryButton} disabled={saving}>
          {saving ? 'Enregistrement…' : submitLabel}
        </button>

        {onCancel && (
          <button type="button" style={styles.ghostButton} onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string
  hint?: string
  full?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ ...styles.field, gridColumn: full ? '1 / -1' : undefined }}>
      <label style={styles.label}>{label}</label>
      {children}
      {hint && <span style={styles.hint}>{hint}</span>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.06)',
  },
  title: {
    margin: '0 0 16px',
    fontSize: 17,
    color: '#14263A',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#3D4C5C',
  },
  hint: {
    fontSize: 12,
    color: '#8A97A6',
  },
  input: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid #D6DEE8',
    background: '#FBFDFF',
    padding: '10px 12px',
    fontSize: 14,
    color: '#14263A',
    outline: 'none',
    fontFamily: 'inherit',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    fontSize: 14,
    color: '#3D4C5C',
  },
  error: {
    margin: '14px 0 0',
    padding: '10px 12px',
    borderRadius: 10,
    background: '#FDECEC',
    color: '#B4232A',
    fontSize: 14,
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    padding: '11px 20px',
    borderRadius: 12,
    border: 'none',
    background: '#123B5C',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghostButton: {
    padding: '11px 20px',
    borderRadius: 12,
    border: '1px solid #D6DEE8',
    background: '#FFFFFF',
    color: '#14263A',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
