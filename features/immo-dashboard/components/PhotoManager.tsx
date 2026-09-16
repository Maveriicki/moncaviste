'use client'

import { useRef, useState } from 'react'
import type { BienPhoto } from '@/types/immo'

interface PhotoManagerProps {
  photos: BienPhoto[]
  uploading: boolean
  onUpload: (files: File[]) => void
  onDelete: (photoId: string) => void
  onMove: (photoId: string, direction: -1 | 1) => void
  onCaption: (photoId: string, caption: string) => void
}

/**
 * Import des photos de la maison : sélection multiple, glisser-déposer,
 * réordonnancement (la 1re photo est la couverture) et légendes.
 */
export function PhotoManager({
  photos,
  uploading,
  onUpload,
  onDelete,
  onMove,
  onCaption,
}: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    onUpload(Array.from(fileList))
  }

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Photos du bien</h2>
        <span style={styles.count}>
          {photos.length} photo{photos.length > 1 ? 's' : ''}
        </span>
      </div>

      <div
        style={{
          ...styles.dropzone,
          borderColor: dragOver ? '#123B5C' : '#D6DEE8',
          background: dragOver ? '#EDF3F9' : '#F8FAFC',
        }}
        onDragOver={event => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={event => {
          event.preventDefault()
          setDragOver(false)
          handleFiles(event.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <p style={styles.dropTitle}>
          {uploading ? 'Envoi des photos…' : 'Glissez vos photos ici'}
        </p>
        <p style={styles.dropHint}>
          ou cliquez pour les sélectionner — JPG, PNG, WebP, AVIF, HEIC · 10 Mo max
          par photo
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={event => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {photos.length > 0 && (
        <ul style={styles.grid}>
          {photos.map((photo, index) => (
            <li key={photo.id} style={styles.item}>
              <div style={styles.thumbWrapper}>
                <img src={photo.url} alt={photo.caption || ''} style={styles.thumb} />

                {index === 0 && <span style={styles.coverBadge}>Couverture</span>}
              </div>

              <input
                style={styles.captionInput}
                defaultValue={photo.caption ?? ''}
                placeholder="Légende (ex : séjour)"
                onBlur={event => onCaption(photo.id, event.target.value)}
              />

              <div style={styles.itemActions}>
                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={() => onMove(photo.id, -1)}
                  disabled={index === 0}
                  aria-label="Déplacer avant"
                >
                  ←
                </button>

                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={() => onMove(photo.id, 1)}
                  disabled={index === photos.length - 1}
                  aria-label="Déplacer après"
                >
                  →
                </button>

                <button
                  type="button"
                  style={{ ...styles.iconButton, ...styles.deleteButton }}
                  onClick={() => onDelete(photo.id)}
                  aria-label="Supprimer la photo"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
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
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 17,
    color: '#14263A',
  },
  count: {
    fontSize: 13,
    color: '#8A97A6',
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: '26px 16px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  dropTitle: {
    margin: '0 0 6px',
    fontSize: 15,
    fontWeight: 600,
    color: '#14263A',
  },
  dropHint: {
    margin: 0,
    fontSize: 13,
    color: '#7A889A',
  },
  grid: {
    listStyle: 'none',
    margin: '18px 0 0',
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 14,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  thumbWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#EEF2F6',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: '3px 9px',
    borderRadius: 999,
    background: 'rgba(18,59,92,0.9)',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 600,
  },
  captionInput: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid #E4EAF1',
    padding: '7px 10px',
    fontSize: 13,
    color: '#14263A',
    outline: 'none',
  },
  itemActions: {
    display: 'flex',
    gap: 6,
  },
  iconButton: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #D6DEE8',
    background: '#FFFFFF',
    color: '#14263A',
    fontSize: 12,
    cursor: 'pointer',
  },
  deleteButton: {
    marginLeft: 'auto',
    color: '#B4232A',
    borderColor: '#F0CFD1',
  },
}
