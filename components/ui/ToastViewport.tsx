import type { DashboardToast } from '@/types/caviste-dashboard'

interface ToastViewportProps {
  toasts: DashboardToast[]
  onDismiss: (id: string) => void
}

const toastClassName: Record<DashboardToast['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-[#D9B96F]/40 bg-[#FFF9EA] text-[#6F5618]',
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 shadow-xl shadow-black/10 backdrop-blur ${toastClassName[toast.type]}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-xs leading-5 opacity-80">{toast.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-full px-2 text-sm opacity-60 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Fermer la notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
