import { Skeleton } from "@/components/ui/skeleton"

export default function InspectLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome skeleton */}
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* 2 action cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card shadow-sm"
          >
            <div className="flex flex-col items-center justify-center py-10 px-6">
              <Skeleton className="mb-4 size-16 rounded-2xl" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent inspections list skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
