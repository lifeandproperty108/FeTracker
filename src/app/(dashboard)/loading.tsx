import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome header skeleton */}
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
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

      {/* Locations skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-4 space-y-4">
            {/* Table header */}
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
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
