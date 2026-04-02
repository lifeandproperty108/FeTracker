"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
        <svg
          className="size-8 text-red-600 dark:text-red-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        An unexpected error occurred. You can try again or return to the
        dashboard.
      </p>

      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-md border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
