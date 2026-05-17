'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { WineImage } from '@/features/caviste-dashboard/components/WineImage'

interface WineDetailsModalProps {
  wine: any
  open: boolean
  onClose: () => void
}

export function WineDetailsModal({
  wine,
  open,
  onClose,
}: WineDetailsModalProps) {
  if (!wine) return null

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 900

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: isMobile ? '12px' : '24px',
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 18,
            }}
            style={{
              width: '100%',
              maxWidth: '1100px',
              background: '#F8F5F0',
              borderRadius: '32px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 30px 80px rgba(0,0,0,.4)',
            }}
          >
            <div
              style={{
                background:
                  'linear-gradient(135deg,#220E17,#4E1020,#7B1D2E)',
                padding: isMobile ? '24px' : '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                }}
                style={{
                  width: '100%',
                  maxWidth: isMobile ? '260px' : '420px',
                  height: isMobile ? '420px' : '620px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <WineImage
                  src={wine.image_url}
                  alt={wine.name}
                />
              </motion.div>
            </div>

            <div
              style={{
                padding: isMobile ? '28px' : '56px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <span
                  style={{
                    background: '#EFE7EA',
                    color: '#7B1D2E',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {wine.color}
                </span>

                <button
                  onClick={onClose}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '28px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              <motion.h1
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                  fontSize: isMobile ? '36px' : '52px',
                  lineHeight: 1,
                  color: '#2A1018',
                  marginBottom: '16px',
                }}
              >
                {wine.name}
              </motion.h1>

              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: isMobile ? '16px' : '20px',
                  color: '#8D7C82',
                  marginBottom: '24px',
                }}
              >
                {wine.region}
              </motion.p>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{
                  fontSize: isMobile ? '32px' : '42px',
                  fontWeight: 700,
                  color: '#7B1D2E',
                  marginBottom: '40px',
                }}
              >
                {wine.price} €
              </motion.div>

              <section style={{ marginBottom: '36px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: '#7B1D2E',
                    marginBottom: '14px',
                  }}
                >
                  Description
                </h2>

                <p
                  style={{
                    color: '#4A3A40',
                    lineHeight: 1.8,
                    fontSize: isMobile ? '15px' : '17px',
                  }}
                >
                  {wine.description || 'Aucune description.'}
                </p>
              </section>

              <section style={{ marginBottom: '36px' }}>
                <h2
                  style={{
                    fontSize: '14px',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: '#7B1D2E',
                    marginBottom: '14px',
                  }}
                >
                  Accords mets & vins
                </h2>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {Array.isArray(wine.occasions)
                    ? wine.occasions.map((item: string) => (
                        <span
                          key={item}
                          style={{
                            background: '#EFE7EA',
                            padding: '10px 16px',
                            borderRadius: '999px',
                            color: '#5E434B',
                            fontSize: '14px',
                          }}
                        >
                          {item}
                        </span>
                      ))
                    : null}
                </div>
              </section>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  border: 'none',
                  background:
                    'linear-gradient(135deg,#7B1D2E,#A32940)',
                  color: '#fff',
                  padding: '18px',
                  borderRadius: '18px',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Contacter le caviste
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}