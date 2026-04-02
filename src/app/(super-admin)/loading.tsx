import { Skeleton } from "@/components/ui/skeleton"

export default function SuperAdminLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 space-y-4">
            {/* Table header */}
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
