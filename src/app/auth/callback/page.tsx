'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // The middleware already exchanged the code for a session
      // Just check if we have a user now
      setStatus('Checking session...')
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Auth callback - user:', user, 'error:', error)

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
  }, [router])

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
