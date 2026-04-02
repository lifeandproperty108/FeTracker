'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Check if we already have a session (hash fragment was auto-parsed by Supabase client)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session) {
        // Session exists — check/create profile then redirect
        const res = await fetch('/api/auth/ensure-profile', { method: 'POST' })
        const { role } = await res.json()

        if (role === 'super_admin') {
          router.push('/super-admin')
        } else {
          router.push('/dashboard')
        }
        return
      }

      // Try exchanging code from URL params
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          const res = await fetch('/api/auth/ensure-profile', { method: 'POST' })
          const { role } = await res.json()

          if (role === 'super_admin') {
            router.push('/super-admin')
          } else {
            router.push('/dashboard')
          }
          return
        }
      }

      // Nothing worked — back to login
      router.push('/login')
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="font-heading text-xl font-semibold text-gray-700">Signing you in...</h2>
        <p className="mt-2 text-sm text-gray-500">Please wait</p>
      </div>
    </div>
  )
}
