'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const code = searchParams.get('code')

      if (code) {
        setStatus('Exchanging auth code...')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Code exchange error:', error)
          setStatus('Auth failed — redirecting to login...')
          setTimeout(() => router.push('/login'), 2000)
          return
        }
      }

      // Check for session
      setStatus('Checking session...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Auth callback - user:', user, 'error:', userError)

      if (!user) {
        setStatus('No session found — redirecting to login...')
        setTimeout(() => router.push('/login'), 2000)
        return
      }

      // Ensure profile exists
      setStatus('Setting up your account...')
      const res = await fetch('/api/auth/ensure-profile', { method: 'POST' })
      const data = await res.json()
      console.log('Ensure profile response:', data)

      if (data.role === 'super_admin') {
        router.push('/super-admin')
      } else {
        router.push('/dashboard')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        <h2 className="font-heading text-xl font-semibold text-gray-700">{status}</h2>
        <p className="mt-2 text-sm text-gray-500">Please wait</p>
      </div>
    </div>
  )
}
