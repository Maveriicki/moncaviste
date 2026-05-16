'use client'

import { ToastViewport } from '@/components/ui/ToastViewport'
import {
  CataloguePreview,
  DashboardHeader,
  DashboardSkeleton,
  WineFormPanel,
  WineInventory,
} from '@/features/caviste-dashboard'
import { useWineDashboard } from '@/hooks/useWineDashboard'

export default function DashboardPage() {
  const dashboard = useWineDashboard()

  return (
    <>
      {dashboard.loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <DashboardHeader
            caviste={dashboard.caviste}
            stats={dashboard.stats}
            widgetUrl={dashboard.widgetUrl}
            onAddWine={dashboard.openCreateForm}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <WineInventory
              wines={dashboard.wines}
              filteredWines={dashboard.filteredWines}
              query={dashboard.query}
              colorFilter={dashboard.colorFilter}
              stockFilter={dashboard.stockFilter}
              deletingId={dashboard.deletingId}
              togglingStockId={dashboard.togglingStockId}
              onQueryChange={dashboard.setQuery}
              onColorFilterChange={dashboard.setColorFilter}
              onStockFilterChange={dashboard.setStockFilter}
              onResetFilters={dashboard.resetFilters}
              onAddWine={dashboard.openCreateForm}
              onEditWine={dashboard.openEditForm}
              onDeleteWine={dashboard.deleteWine}
              onToggleStock={dashboard.toggleWineStock}
            />

            <CataloguePreview
              caviste={dashboard.caviste}
              wines={dashboard.wines}
              widgetUrl={dashboard.widgetUrl}
            />
          </div>
        </div>
      )}

      <WineFormPanel
        open={dashboard.isFormOpen}
        mode={dashboard.formMode}
        initialValues={dashboard.formInitialValues}
        saving={dashboard.saving}
        imageUploading={dashboard.imageUploading}
        imageDeleting={dashboard.imageDeleting}
        onClose={dashboard.closeForm}
        onSubmit={dashboard.saveWine}
        onUploadImage={dashboard.uploadWineImage}
        onDeleteImage={dashboard.deleteWineImage}
      />

      <ToastViewport
        toasts={dashboard.toasts}
        onDismiss={dashboard.dismissToast}
      />
    </>
  )
}
