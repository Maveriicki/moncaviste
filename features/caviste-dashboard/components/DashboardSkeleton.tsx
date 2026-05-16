export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-[28px] bg-[#2A1219]" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[24px] border border-[#F0E8DC] bg-white p-5">
          <div className="mb-5 h-10 w-64 animate-pulse rounded-full bg-[#F4ECE4]" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-[#F7F0E9]"
              />
            ))}
          </div>
        </div>

        <div className="h-[520px] animate-pulse rounded-[24px] bg-[#EEE4D8]" />
      </div>
    </div>
  )
}
