import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDCFC3] bg-white/70 px-6 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7B1D2E]/10 text-2xl text-[#7B1D2E]">
        <span aria-hidden="true">🍷</span>
      </div>

      <h3 className="text-lg font-semibold text-[#1C0D12]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#6B4D55]">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
