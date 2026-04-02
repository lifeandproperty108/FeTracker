import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveAuthCallback } from './handle-auth-callback.ts'

test('exchanges the OAuth code before checking for a session', async () => {
  const calls: string[] = []

  const result = await resolveAuthCallback({
    code: 'oauth-code',
    ensureProfile: async () => ({ role: 'user' }),
    exchangeCodeForSession: async (code) => {
      calls.push(`exchange:${code}`)
      return { error: null }
    },
    getSession: async () => {
      calls.push('getSession')
      return {
        data: {
          session: {
            user: { id: 'user-1' },
          },
        },
      }
    },
    getUser: async () => {
      calls.push('getUser')
      return {
        data: {
          user: { id: 'user-1' },
        },
      }
    },
  })

  assert.deepEqual(calls, ['exchange:oauth-code', 'getSession'])
  assert.deepEqual(result, { kind: 'redirect', href: '/dashboard' })
})

test('redirects to login when no session or user can be recovered', async () => {
  const result = await resolveAuthCallback({
    code: 'oauth-code',
    ensureProfile: async () => ({ role: 'user' }),
    exchangeCodeForSession: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
  })

  assert.deepEqual(result, {
    kind: 'redirect',
    href: '/login',
    message: 'Session not found — redirecting to login...',
  })
})
