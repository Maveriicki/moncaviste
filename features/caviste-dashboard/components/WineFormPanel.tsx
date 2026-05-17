'use client'

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import {
  WINE_COLOR_OPTIONS,
  getDefaultWineForm,
} from '@/features/caviste-dashboard/constants'
import type { DashboardWineForm, WineFormMode } from '@/types/caviste-dashboard'
import type { WineColor } from '@/types/database'
import { WineImage } from './WineImage'

interface WineFormPanelProps {
  open: boolean
  mode: WineFormMode
  initialValues: DashboardWineForm
  saving: boolean
  imageUploading: boolean
  imageDeleting: boolean
  onClose: () => void
  onSubmit: (form: DashboardWineForm) => void
  onUploadImage: (file: File) => Promise<string | null>
  onDeleteImage: (imageUrl: string) => Promise<boolean>
}

export function WineFormPanel({
  open,
  mode,
  initialValues,
  saving,
  imageUploading,
  imageDeleting,
  onClose,
  onSubmit,
  onUploadImage,
  onDeleteImage,
}: WineFormPanelProps) {
  const [form, setForm] = useState<DashboardWineForm>(getDefaultWineForm())
  const [draggingImage, setDraggingImage] = useState(false)
  const [imageMessage, setImageMessage] = useState<string | null>(null)

  useEffect(() => {
  if (open) {
    setForm(initialValues)
  }
}, [open])

  if (!open) return null

  function updateField<Key extends keyof DashboardWineForm>(
    key: Key,
    value: DashboardWineForm[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleImageFile(file: File | null) {
    if (!file) return

    setImageMessage(null)
    const previousTransientUrl =
      form.image_url && form.image_url !== initialValues.image_url
        ? form.image_url
        : null
    const publicUrl = await onUploadImage(file)

    if (!publicUrl) return

    updateField('image_url', publicUrl)

    if (previousTransientUrl) {
      await onDeleteImage(previousTransientUrl)
    }
  }

  async function handleRemoveImage() {
    if (!form.image_url) return

    if (form.image_url !== initialValues.image_url) {
      await onDeleteImage(form.image_url)
    } else {
      setImageMessage('Image retirée. Enregistrez le vin pour finaliser la suppression.')
    }

    updateField('image_url', '')
  }

  async function handleClose() {
    if (form.image_url && form.image_url !== initialValues.image_url) {
      await onDeleteImage(form.image_url)
    }

    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-[#17090F]/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          void handleClose()
        }
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[#F0E8DC] bg-[#FFFDF9] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F0E8DC] px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B1D2E]">
              {mode === 'edit' ? 'Modification' : 'Nouveau vin'}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-[#1C0D12]">
              {mode === 'edit' ? 'Modifier le vin' : 'Ajouter au catalogue'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void handleClose()}
            className="rounded-full border border-[#E8DDD0] px-3 py-2 text-sm font-semibold text-[#6B4D55] transition hover:bg-[#FBF7F2]"
          >
            Fermer
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[160px_1fr]">
          <div className="lg:sticky lg:top-0 lg:self-start">
            <ImageDropzone
              imageUrl={form.image_url}
              imageAlt={form.name || 'Bouteille de vin'}
              dragging={draggingImage}
              uploading={imageUploading}
              deleting={imageDeleting}
              message={imageMessage}
              onDragStateChange={setDraggingImage}
              onFileSelected={handleImageFile}
              onRemoveImage={handleRemoveImage}
            />
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom">
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="dashboard-input"
                  placeholder="Château Les Brumes"
                />
              </Field>

              <Field label="Prix">
                <input
                  required
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => updateField('price', event.target.value)}
                  className="dashboard-input"
                  placeholder="18.90"
                />
              </Field>

              <Field label="Région">
                <input
                  value={form.region}
                  onChange={(event) => updateField('region', event.target.value)}
                  className="dashboard-input"
                  placeholder="Bourgogne"
                />
              </Field>

              <Field label="Couleur">
                <select
                  value={form.color}
                  onChange={(event) => updateField('color', event.target.value as WineColor)}
                  className="dashboard-input"
                >
                  {WINE_COLOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <Field label="Stock">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#FBF7F2] p-1">
                  <button
                    type="button"
                    onClick={() => updateField('in_stock', true)}
                    className={`min-h-10 rounded-xl text-sm font-semibold transition ${
                      form.in_stock
                        ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                        : 'text-[#8B7480] hover:bg-white'
                    }`}
                  >
                    En stock
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('in_stock', false)}
                    className={`min-h-10 rounded-xl text-sm font-semibold transition ${
                      !form.in_stock
                        ? 'bg-rose-100 text-rose-800 shadow-sm'
                        : 'text-[#8B7480] hover:bg-white'
                    }`}
                  >
                    Rupture
                  </button>
                </div>
              </Field>

              <Field label="Quantité">
                <input
                  inputMode="numeric"
                  value={form.stock_qty}
                  onChange={(event) => updateField('stock_qty', event.target.value)}
                  className="dashboard-input"
                  placeholder="12"
                />
              </Field>
            </div>

            <Field label="Accords mets/vins">
              <textarea
                value={form.pairings}
                onChange={(event) => updateField('pairings', event.target.value)}
                className="dashboard-input min-h-24 resize-y"
                placeholder="Côte de boeuf, fromages affinés, champignons"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                className="dashboard-input min-h-28 resize-y"
                placeholder="Profil aromatique, texture, conseil de service..."
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#F0E8DC] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() => void handleClose()}
            className="min-h-11 rounded-full border border-[#E8DDD0] px-5 text-sm font-semibold text-[#6B4D55] transition hover:bg-[#FBF7F2]"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving || imageUploading || imageDeleting}
            className="min-h-11 rounded-full bg-[#7B1D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#651827] disabled:cursor-wait disabled:opacity-60"
          >
            {saving
              ? 'Enregistrement...'
              : mode === 'edit'
                ? 'Enregistrer'
                : 'Ajouter le vin'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface ImageDropzoneProps {
  imageUrl: string
  imageAlt: string
  dragging: boolean
  uploading: boolean
  deleting: boolean
  message: string | null
  onDragStateChange: (dragging: boolean) => void
  onFileSelected: (file: File | null) => void
  onRemoveImage: () => void
}

function ImageDropzone({
  imageUrl,
  imageAlt,
  dragging,
  uploading,
  deleting,
  message,
  onDragStateChange,
  onFileSelected,
  onRemoveImage,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const busy = uploading || deleting

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    onDragStateChange(false)
    onFileSelected(event.dataTransfer.files.item(0))
  }

  function preventDropDefaults(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(event) => {
          preventDropDefaults(event)
          onDragStateChange(true)
        }}
        onDragOver={preventDropDefaults}
        onDragLeave={(event) => {
          preventDropDefaults(event)
          onDragStateChange(false)
        }}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border border-dashed bg-[#FBF7F2] transition ${
          dragging
            ? 'border-[#7B1D2E] ring-4 ring-[#7B1D2E]/10'
            : 'border-[#DDCFC3]'
        }`}
      >
        <div className="aspect-[3/4]">
          <WineImage src={imageUrl} alt={imageAlt} />
        </div>

        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/85 p-3 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7B1D2E]">
            Image bouteille
          </p>
          <p className="mt-1 text-xs leading-5 text-[#6B4D55]">
            Glissez une image ou importez un fichier JPG, PNG, WebP ou AVIF.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="min-h-10 rounded-full bg-[#7B1D2E] px-3 text-xs font-semibold text-white transition hover:bg-[#651827] disabled:cursor-wait disabled:opacity-60"
            >
              {uploading ? 'Upload...' : imageUrl ? 'Remplacer' : 'Uploader'}
            </button>

            <button
              type="button"
              disabled={busy || !imageUrl}
              onClick={onRemoveImage}
              className="min-h-10 rounded-full border border-[#E8DDD0] px-3 text-xs font-semibold text-[#6B4D55] transition hover:bg-[#FBF7F2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl border border-[#E8DDD0] bg-white px-3 py-2 text-xs leading-5 text-[#6B4D55]">
          {message}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(event) => {
          onFileSelected(event.target.files?.item(0) ?? null)
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#4E1020]">{label}</span>
      {children}
    </label>
  )
}
