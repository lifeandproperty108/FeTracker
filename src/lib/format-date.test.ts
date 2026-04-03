import test from 'node:test'
import assert from 'node:assert/strict'

import { formatDateOrFallback } from './format-date.ts'

test('formats valid ISO dates', () => {
  assert.equal(formatDateOrFallback('2026-04-02T12:00:00.000Z'), 'Apr 2, 2026')
})

test('returns fallback for missing or invalid dates', () => {
  assert.equal(formatDateOrFallback(null), 'Unknown')
  assert.equal(formatDateOrFallback('not-a-date'), 'Unknown')
})
