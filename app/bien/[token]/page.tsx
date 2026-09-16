import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListing } from '@/services/immo-public.service'
import { ListingGallery } from '@/components/immo/ListingGallery'
import {
  formatKindLine,
  formatLocation,
  formatNumber,
  formatPrice,
  formatSurface,
} from '@/lib/immo/format'
import { BIEN_STATUS_LABELS } from '@/types/immo'

interface BienPageProps {
  params: Promise<{ token: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: BienPageProps): Promise<Metadata> {
  const { token } = await params
  const listing = await getPublicListing(token)

  if (!listing) return { title: 'Annonce introuvable' }

  const location = formatLocation(listing.bien.postal_code, listing.bien.city)

  return {
    title: `${listing.bien.title}${location ? ` — ${location}` : ''} | ${listing.agence.name}`,
    description:
      listing.bien.description?.slice(0, 180) ||
      `${formatKindLine(listing.bien.kind, listing.bien.transaction)} — ${formatPrice(
        listing.bien.price,
        listing.bien.transaction
      )}`,
    openGraph: {
      images: listing.photos[0]?.url ? [listing.photos[0].url] : [],
    },
  }
}

export default async function BienPublicPage({ params }: BienPageProps) {
  const { token } = await params
  const listing = await getPublicListing(token)

  if (!listing) notFound()

  const { bien, agence, photos } = listing
  const accent = agence.primary_color || '#123B5C'
  const location = formatLocation(bien.postal_code, bien.city)

  const facts = [
    { label: 'Surface',     value: formatSurface(bien.surface) },
    { label: 'Terrain',     value: formatSurface(bien.land_surface) },
    { label: 'Pièces',      value: formatNumber(bien.rooms) },
    { label: 'Chambres',    value: formatNumber(bien.bedrooms) },
    { label: 'Salles d’eau',value: formatNumber(bien.bathrooms) },
    { label: 'Étage',       value: formatNumber(bien.floor) },
    { label: 'Année',       value: bien.year_built ? String(bien.year_built) : null },
    { label: 'DPE',         value: bien.dpe },
    { label: 'GES',         value: bien.ges },
  ].filter(fact => fact.value)

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          {agence.logo_url ? (
            <img src={agence.logo_url} alt={agence.name} style={styles.logo} />
          ) : (
            <span style={{ ...styles.logoFallback, background: accent }}>
              {agence.name.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div>
            <p style={styles.agencyName}>{agence.name}</p>
            <p style={styles.reference}>Réf. {bien.reference}</p>
          </div>
        </header>

        <ListingGallery photos={photos} title={bien.title} accent={accent} />

        <section style={styles.card}>
          <span style={{ ...styles.badge, background: accent }}>
            {formatKindLine(bien.kind, bien.transaction)}
          </span>

          {bien.status !== 'disponible' && (
            <span style={styles.statusBadge}>{BIEN_STATUS_LABELS[bien.status]}</span>
          )}

          <h1 style={styles.title}>{bien.title}</h1>

          {location && <p style={styles.location}>📍 {location}</p>}

          <p style={{ ...styles.price, color: accent }}>
            {formatPrice(bien.price, bien.transaction)}
          </p>

          {bien.charges !== null && bien.charges !== undefined && (
            <p style={styles.priceNote}>
              Charges : {formatPrice(bien.charges, 'location')}
            </p>
          )}

          {bien.fees && <p style={styles.priceNote}>Honoraires : {bien.fees}</p>}

          {facts.length > 0 && (
            <ul style={styles.facts}>
              {facts.map(fact => (
                <li key={fact.label} style={styles.fact}>
                  <span style={styles.factLabel}>{fact.label}</span>
                  <span style={styles.factValue}>{fact.value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {bien.description && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>{bien.description}</p>
          </section>
        )}

        {bien.features.length > 0 && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Les plus du bien</h2>
            <ul style={styles.features}>
              {bien.features.map(feature => (
                <li key={feature} style={styles.feature}>
                  ✓ {feature}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Contacter l’agence</h2>

          {bien.contact_name && <p style={styles.contactLine}>{bien.contact_name}</p>}

          <div style={styles.contactActions}>
            {bien.contact_phone && (
              <a
                href={`tel:${bien.contact_phone.replace(/\s/g, '')}`}
                style={{ ...styles.contactButton, background: accent }}
              >
                📞 {bien.contact_phone}
              </a>
            )}

            {bien.contact_email && (
              <a
                href={`mailto:${bien.contact_email}?subject=${encodeURIComponent(
                  `Demande d'information — ${bien.title} (réf. ${bien.reference})`
                )}`}
                style={styles.contactButtonGhost}
              >
                ✉️ Écrire à l’agence
              </a>
            )}
          </div>

          {agence.website && (
            <a href={agence.website} style={styles.websiteLink} rel="noreferrer">
              {agence.website}
            </a>
          )}
        </section>

        <footer style={styles.footer}>
          Annonce consultée depuis le QR code de l’agence — informations non
          contractuelles.
        </footer>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F4F6F9',
    padding: '20px 16px 48px',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Arial, sans-serif',
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    objectFit: 'cover',
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    color: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 700,
  },
  agencyName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#14263A',
  },
  reference: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#7A889A',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.06)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 999,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
  },
  statusBadge: {
    display: 'inline-block',
    marginLeft: 8,
    padding: '4px 12px',
    borderRadius: 999,
    background: '#F0D8A8',
    color: '#6B4A00',
    fontSize: 12,
    fontWeight: 600,
  },
  title: {
    margin: '12px 0 4px',
    fontSize: 26,
    lineHeight: 1.25,
    color: '#14263A',
  },
  location: {
    margin: '0 0 12px',
    fontSize: 15,
    color: '#5A6A7A',
  },
  price: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
  },
  priceNote: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#7A889A',
  },
  facts: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 10,
    margin: '18px 0 0',
    padding: 0,
  },
  fact: {
    background: '#F4F6F9',
    borderRadius: 12,
    padding: '10px 12px',
  },
  factLabel: {
    display: 'block',
    fontSize: 12,
    color: '#7A889A',
  },
  factValue: {
    display: 'block',
    fontSize: 16,
    fontWeight: 600,
    color: '#14263A',
  },
  sectionTitle: {
    margin: '0 0 10px',
    fontSize: 17,
    color: '#14263A',
  },
  description: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: '#3D4C5C',
    whiteSpace: 'pre-line',
  },
  features: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: '#3D4C5C',
  },
  contactLine: {
    margin: '0 0 12px',
    fontSize: 15,
    color: '#3D4C5C',
  },
  contactActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  contactButton: {
    padding: '12px 18px',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
  },
  contactButtonGhost: {
    padding: '12px 18px',
    borderRadius: 12,
    border: '1px solid #D6DEE8',
    color: '#14263A',
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
  },
  websiteLink: {
    display: 'inline-block',
    marginTop: 14,
    fontSize: 14,
    color: '#5A6A7A',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8A97A6',
    padding: '4px 12px 0',
  },
}
