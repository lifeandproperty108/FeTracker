import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">404</p>
      <h1 className="mt-2 text-7xl font-bold tracking-tight text-foreground sm:text-9xl">
        404
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Page not found
      </p>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
