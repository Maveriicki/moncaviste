'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PublicPhoto } from '@/types/immo'

interface ListingGalleryProps {
  photos: PublicPhoto[]
  title: string
  accent: string
}

export function ListingGallery({ photos, title, accent }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const total = photos.length

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return
      setActiveIndex((index + total) % total)
    },
    [total]
  )

  useEffect(() => {
    if (!lightboxOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') goTo(activeIndex + 1)
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, activeIndex, goTo])

  if (total === 0) {
    return (
      <div style={styles.empty}>
        Les photos de ce bien seront disponibles très prochainement.
      </div>
    )
  }

  const active = photos[activeIndex]

  return (
    <div>
      <div style={styles.mainWrapper}>
        <img
          src={active.url}
          alt={active.caption || title}
          style={styles.mainImage}
          onClick={() => setLightboxOpen(true)}
        />

        <button
          type="button"
          style={{ ...styles.navButton, left: 12 }}
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Photo précédente"
        >
          ‹
        </button>

        <button
          type="button"
          style={{ ...styles.navButton, right: 12 }}
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Photo suivante"
        >
          ›
        </button>

        <span style={styles.counter}>
          {activeIndex + 1} / {total}
        </span>
      </div>

      {active.caption && <p style={styles.caption}>{active.caption}</p>}

      <div style={styles.thumbs}>
        {photos.map((photo, index) => (
          <button
            key={`${photo.url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            style={{
              ...styles.thumbButton,
              borderColor: index === activeIndex ? accent : 'transparent',
            }}
            aria-label={`Photo ${index + 1}`}
          >
            <img src={photo.url} alt="" style={styles.thumbImage} />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div style={styles.lightbox} onClick={() => setLightboxOpen(false)}>
          <img src={active.url} alt={active.caption || title} style={styles.lightboxImage} />

          <button
            type="button"
            style={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  mainWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 18,
    overflow: 'hidden',
    background: '#E7EAEF',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    cursor: 'zoom-in',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.88)',
    color: '#123B5C',
    fontSize: 26,
    lineHeight: '38px',
    cursor: 'pointer',
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(18,59,92,0.82)',
    color: '#FFFFFF',
    fontSize: 12,
  },
  caption: {
    margin: '10px 2px 0',
    fontSize: 14,
    color: '#5A6A7A',
  },
  thumbs: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    overflowX: 'auto',
    paddingBottom: 4,
  },
  thumbButton: {
    flex: '0 0 auto',
    width: 82,
    height: 62,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'solid',
    padding: 0,
    background: 'none',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  empty: {
    padding: '48px 20px',
    textAlign: 'center',
    borderRadius: 18,
    background: '#EEF2F6',
    color: '#5A6A7A',
    fontSize: 15,
  },
  lightbox: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(12,20,28,0.94)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 60,
    cursor: 'zoom-out',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  lightboxClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.9)',
    color: '#123B5C',
    fontSize: 26,
    cursor: 'pointer',
  },
}
