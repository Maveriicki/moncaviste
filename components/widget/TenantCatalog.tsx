'use client'

import { useState } from 'react'
import { WineDetailsModal } from './WineDetailsModal'

interface TenantCatalogProps {
  wines: any[]
}

export function TenantCatalog({
  wines,
}: TenantCatalogProps) {
  const [selectedWine, setSelectedWine] = useState<any | null>(null)

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
          gap: '28px',
        }}
      >
        {wines.map((wine) => (
          <div
            key={wine.id}
            style={{
              background: '#fff',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,.08)',
            }}
          >
            {wine.image_url ? (
              <img
                src={wine.image_url}
                alt={wine.name}
                style={{
                  width: '100%',
                  height: '460px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  height: '460px',
                  background:
                    'linear-gradient(135deg,#2A0E16,#7B1D2E,#D9B96F)',
                }}
              />
            )}

            <div style={{ padding: '24px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  color: '#2B1018',
                  marginBottom: '10px',
                }}
              >
                {wine.name}
              </h2>

              <p
                style={{
                  color: '#8A7B80',
                  marginBottom: '16px',
                  fontSize: '16px',
                }}
              >
                {wine.region}
              </p>

              <p
                style={{
                  fontSize: '34px',
                  fontWeight: 700,
                  color: '#7B1D2E',
                  marginBottom: '24px',
                }}
              >
                {wine.price} €
              </p>

              <button
                onClick={() => setSelectedWine(wine)}
                style={{
                  width: '100%',
                  border: 'none',
                  background:
                    'linear-gradient(135deg,#7B1D2E,#A32940)',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '16px',
                  fontWeight: 700,
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Découvrir
              </button>
            </div>
          </div>
        ))}
      </div>

      <WineDetailsModal
        wine={selectedWine}
        open={!!selectedWine}
        onClose={() => setSelectedWine(null)}
      />
    </>
  )
}