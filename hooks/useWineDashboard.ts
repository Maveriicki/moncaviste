'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDefaultWineForm } from '@/features/caviste-dashboard/constants'
import {
  createDashboardWine,
  getWineDashboardData,
  removeDashboardWine,
  setDashboardWineStock,
  updateDashboardWine,
  wineToDashboardForm,
} from '@/services/wine-dashboard.service'
import {
  deleteWineBottleImage,
  uploadWineBottleImage,
} from '@/services/wine-image-storage.service'
import type {
  DashboardToast,
  DashboardWineForm,
  WineFormMode,
  WineStockFilter,
} from '@/types/caviste-dashboard'
import type { Caviste, Wine, WineColor } from '@/types/database'

export function useWineDashboard() {
  const [caviste, setCaviste] = useState<Caviste | null>(null)
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [colorFilter, setColorFilter] = useState<WineColor | 'all'>('all')
  const [stockFilter, setStockFilter] = useState<WineStockFilter>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<WineFormMode>('create')
  const [editingWine, setEditingWine] = useState<Wine | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStockId, setTogglingStockId] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageDeleting, setImageDeleting] = useState(false)
  const [toasts, setToasts] = useState<DashboardToast[]>([])
  const [origin, setOrigin] = useState('')

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<DashboardToast, 'id'>) => {
      const id = crypto.randomUUID()

      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismissToast(id), 4200)
    },
    [dismissToast]
  )

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getWineDashboardData()

    if (error || !data) {
      pushToast({
        type: 'error',
        title: 'Chargement impossible',
        message: error || 'Le tableau de bord est indisponible.',
      })
      setLoading(false)
      return
    }

    setCaviste(data.caviste)
    setWines(data.wines)
    setLoading(false)
  }, [pushToast])

  useEffect(() => {
    setOrigin(window.location.origin)
    loadDashboard()
  }, [loadDashboard])

  const filteredWines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return wines.filter((wine) => {
      const matchesQuery =
        !normalizedQuery ||
        wine.name.toLowerCase().includes(normalizedQuery) ||
        (wine.region ?? '').toLowerCase().includes(normalizedQuery) ||
        (wine.description ?? '').toLowerCase().includes(normalizedQuery) ||
        (wine.accord ?? '').toLowerCase().includes(normalizedQuery)

      const matchesColor = colorFilter === 'all' || wine.color === colorFilter
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in_stock' && wine.in_stock) ||
        (stockFilter === 'out_of_stock' && !wine.in_stock)

      return matchesQuery && matchesColor && matchesStock
    })
  }, [colorFilter, query, stockFilter, wines])

  const stats = useMemo(() => {
    const total = wines.length
    const inStock = wines.filter((wine) => wine.in_stock).length
    const averagePrice =
      total === 0
        ? 0
        : wines.reduce((sum, wine) => sum + wine.price, 0) / total
    const colorCount = new Set(wines.map((wine) => wine.color)).size

    return {
      total,
      inStock,
      outOfStock: total - inStock,
      averagePrice,
      colorCount,
    }
  }, [wines])

  const formInitialValues = editingWine
    ? wineToDashboardForm(editingWine)
    : getDefaultWineForm()

  const widgetUrl = caviste && origin ? `${origin}/${caviste.slug}` : ''

  function openCreateForm() {
    setEditingWine(null)
    setFormMode('create')
    setIsFormOpen(true)
  }

  function openEditForm(wine: Wine) {
    setEditingWine(wine)
    setFormMode('edit')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (saving) return
    setIsFormOpen(false)
    setEditingWine(null)
    setFormMode('create')
  }

  async function saveWine(form: DashboardWineForm) {
    if (!caviste) {
      pushToast({
        type: 'error',
        title: 'Profil caviste introuvable',
      })
      return
    }

    setSaving(true)

    const position = wines.length + 1
    const response =
      formMode === 'edit' && editingWine
        ? await updateDashboardWine(editingWine.id, form)
        : await createDashboardWine(caviste.id, form, position)

    setSaving(false)

    if (response.error || !response.data) {
      pushToast({
        type: 'error',
        title: 'Enregistrement refusé',
        message: response.error || 'Le vin n’a pas été enregistré.',
      })
      return
    }

    if (
      formMode === 'edit' &&
      editingWine?.image_url &&
      editingWine.image_url !== response.data.image_url
    ) {
      await deleteWineImageSilently(editingWine.image_url)
    }

    setWines((current) =>
      formMode === 'edit'
        ? current.map((wine) => (wine.id === response.data?.id ? response.data : wine))
        : [response.data, ...current]
    )
    setIsFormOpen(false)
    setEditingWine(null)
    setFormMode('create')
    pushToast({
      type: 'success',
      title: formMode === 'edit' ? 'Vin modifié' : 'Vin ajouté',
      message: response.data.name,
    })
  }

  async function deleteWine(wine: Wine) {
    const accepted = window.confirm(`Supprimer "${wine.name}" du catalogue ?`)
    if (!accepted) return

    setDeletingId(wine.id)
    const response = await removeDashboardWine(wine.id)
    setDeletingId(null)

    if (response.error) {
      pushToast({
        type: 'error',
        title: 'Suppression impossible',
        message: response.error,
      })
      return
    }

    if (wine.image_url) {
      await deleteWineImageSilently(wine.image_url)
    }

    setWines((current) => current.filter((item) => item.id !== wine.id))
    pushToast({
      type: 'success',
      title: 'Vin supprimé',
      message: wine.name,
    })
  }

  async function toggleWineStock(wine: Wine) {
    setTogglingStockId(wine.id)
    const response = await setDashboardWineStock(wine, !wine.in_stock)
    setTogglingStockId(null)

    if (response.error || !response.data) {
      pushToast({
        type: 'error',
        title: 'Stock non modifié',
        message: response.error || 'La mise à jour a échoué.',
      })
      return
    }

    setWines((current) =>
      current.map((item) => (item.id === response.data?.id ? response.data : item))
    )
  }

  async function uploadWineImage(file: File) {
    if (!caviste) {
      pushToast({
        type: 'error',
        title: 'Profil caviste introuvable',
      })
      return null
    }

    setImageUploading(true)
    const response = await uploadWineBottleImage(caviste.id, file)
    setImageUploading(false)

    if (response.error || !response.data) {
      pushToast({
        type: 'error',
        title: 'Upload impossible',
        message: response.error || 'L’image n’a pas été envoyée.',
      })
      return null
    }

    pushToast({
      type: 'success',
      title: 'Image uploadée',
      message: 'La bouteille est prête pour la fiche vin.',
    })

    return response.data.publicUrl
  }

  async function deleteWineImage(imageUrl: string) {
    if (!caviste || !imageUrl) return false

    setImageDeleting(true)
    const response = await deleteWineBottleImage({
      cavisteId: caviste.id,
      imageUrl,
    })
    setImageDeleting(false)

    if (response.error) {
      pushToast({
        type: 'error',
        title: 'Suppression image impossible',
        message: response.error,
      })
      return false
    }

    pushToast({
      type: 'success',
      title: 'Image supprimée',
    })

    return true
  }

  async function deleteWineImageSilently(imageUrl: string) {
    if (!caviste || !imageUrl) return

    await deleteWineBottleImage({
      cavisteId: caviste.id,
      imageUrl,
    })
  }

  function resetFilters() {
    setQuery('')
    setColorFilter('all')
    setStockFilter('all')
  }

  return {
    caviste,
    wines,
    filteredWines,
    stats,
    loading,
    query,
    setQuery,
    colorFilter,
    setColorFilter,
    stockFilter,
    setStockFilter,
    resetFilters,
    isFormOpen,
    formMode,
    formInitialValues,
    saving,
    deletingId,
    togglingStockId,
    imageUploading,
    imageDeleting,
    toasts,
    widgetUrl,
    openCreateForm,
    openEditForm,
    closeForm,
    saveWine,
    deleteWine,
    toggleWineStock,
    uploadWineImage,
    deleteWineImage,
    dismissToast,
    reload: loadDashboard,
  }
}
