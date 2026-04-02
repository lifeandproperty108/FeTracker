'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resolveAuthCallback } from './handle-auth-callback'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const code = searchParams.get('code')
    const authError =
      searchParams.get('error_description') ?? searchParams.get('error')

    let redirectTimeout: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const handleCallback = async () => {
      if (authError) {
        setStatus('Google sign-in failed — redirecting to login...')
        redirectTimeout = setTimeout(() => router.push('/login'), 2000)
        return
      }

      const supabase = createClient()

      setStatus(code ? 'Completing sign-in...' : 'Checking session...')

      const result = await resolveAuthCallback({
        code,
        ensureProfile: async () => {
          const res = await fetch('/api/auth/ensure-profile', { method: 'POST' })
          const data = await res.json()

          if (!res.ok) {
            return { error: data.error ?? 'Unable to create profile' }
          }

          return { role: data.role as string | undefined }
        },
        exchangeCodeForSession: async (authCode: string) => {
          const result = await supabase.auth.exchangeCodeForSession(authCode)
          console.log('Auth callback - exchange result:', result.error ?? 'success')
          return { error: result.error }
        },
        getSession: async () => {
          const result = await supabase.auth.getSession()
          console.log(
            'Auth callback - session:',
            result.data.session ? 'exists' : 'null'
          )
          return result
        },
        getUser: async () => {
          const result = await supabase.auth.getUser()
          if (!result.data.user) {
            console.log('No session or user found, redirecting to login')
          }
          return result
        },
      })

      if (cancelled) {
        return
      }

      if (result.kind === 'error') {
        setStatus(result.message)
        return
      }

      if (result.message) {
        setStatus(result.message)
      }

      redirectTimeout = setTimeout(
        () => {
          router.push(result.href)
        },
        result.href === '/login' ? 2000 : 0
      )
    }

    void handleCallback()

    return () => {
      cancelled = true
      if (redirectTimeout) {
        clearTimeout(redirectTimeout)
      }
    }
  }, [router, searchParams])

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      <h2 className="font-heading text-xl font-semibold text-gray-700">{status}</h2>
      <p className="mt-2 text-sm text-gray-500">Please wait</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <h2 className="font-heading text-xl font-semibold text-gray-700">Signing you in...</h2>
          <p className="mt-2 text-sm text-gray-500">Please wait</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}
