'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildBienPublicUrl } from '@/lib/immo/public-url'

interface QrCodeCardProps {
  publicToken: string
  reference: string
  size?: number
  compact?: boolean
  onPrint?: () => void
}

/**
 * QR code d'un bien : c'est l'image collée en vitrine.
 * Le client la scanne et arrive directement sur les photos + l'annonce.
 */
export function QrCodeCard({
  publicToken,
  reference,
  size = 220,
  compact = false,
  onPrint,
}: QrCodeCardProps) {
  const url = buildBienPublicUrl(publicToken)
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null)
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function generate() {
      const [png, svg] = await Promise.all([
        QRCode.toDataURL(url, {
          width: 1024,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#14263A', light: '#FFFFFF' },
        }),
        QRCode.toString(url, {
          type: 'svg',
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#14263A', light: '#FFFFFF' },
        }),
      ])

      if (cancelled) return

      setPngDataUrl(png)
      setSvgMarkup(svg)
    }

    generate().catch(() => {
      if (!cancelled) {
        setPngDataUrl(null)
        setSvgMarkup(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [url])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function handleDownloadSvg() {
    if (!svgMarkup) return

    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)

    triggerDownload(href, `qr-${reference}.svg`)
    URL.revokeObjectURL(href)
  }

  return (
    <div style={compact ? styles.cardCompact : styles.card}>
      {!compact && <h2 style={styles.title}>QR code du bien</h2>}

      <div style={{ ...styles.qrWrapper, width: size, height: size }}>
        {pngDataUrl ? (
          <img src={pngDataUrl} alt={`QR code ${reference}`} style={styles.qrImage} />
        ) : (
          <span style={styles.qrLoading}>Génération…</span>
        )}
      </div>

      {!compact && (
        <>
          <p style={styles.hint}>
            Imprimez ce QR code et collez-le sur l’annonce en vitrine : le client
            le scanne et voit toutes les photos sur son téléphone.
          </p>

          <p style={styles.url}>{url}</p>

          <div style={styles.actions}>
            <button type="button" style={styles.button} onClick={handleCopy}>
              {copied ? '✓ Lien copié' : 'Copier le lien'}
            </button>

            {pngDataUrl && (
              <a
                style={styles.button}
                href={pngDataUrl}
                download={`qr-${reference}.png`}
              >
                Télécharger PNG
              </a>
            )}

            <button type="button" style={styles.button} onClick={handleDownloadSvg}>
              Télécharger SVG
            </button>

            {onPrint && (
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={onPrint}
              >
                Affiche vitrine A4
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 6px 24px rgba(20, 38, 58, 0.06)',
  },
  cardCompact: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '0 0 14px',
    fontSize: 17,
    color: '#14263A',
  },
  qrWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E4EAF1',
  },
  qrImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  qrLoading: {
    fontSize: 13,
    color: '#8A97A6',
  },
  hint: {
    margin: '14px 0 8px',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#5A6A7A',
  },
  url: {
    margin: '0 0 14px',
    fontSize: 12,
    color: '#8A97A6',
    wordBreak: 'break-all',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    padding: '9px 14px',
    borderRadius: 10,
    border: '1px solid #D6DEE8',
    background: '#FFFFFF',
    color: '#14263A',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  buttonPrimary: {
    background: '#123B5C',
    borderColor: '#123B5C',
    color: '#FFFFFF',
  },
}
