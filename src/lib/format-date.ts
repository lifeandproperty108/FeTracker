import { format } from 'date-fns'

export function formatDateOrFallback(
  value: string | null | undefined,
  pattern = 'MMM d, yyyy',
  fallback = 'Unknown'
) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return format(date, pattern)
}
