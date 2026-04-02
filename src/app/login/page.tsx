'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { signIn, signUp } from './actions'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      console.log('Google OAuth response:', { data, error })
      if (error) {
        console.error('Google OAuth error:', error)
        setError(error.message)
        setGoogleLoading(false)
      }
      // If successful, Supabase redirects the browser automatically via data.url
      if (data?.url) {
        console.log('Redirecting to:', data.url)
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Google OAuth exception:', err)
      setError('Failed to connect to Google. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleSignIn(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  async function handleSignUp(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="px-8 pt-8 pb-2 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-red-600">
            FE Tracker
          </h1>
          <p className="mt-1.5 font-body text-sm text-gray-500">
            Fire extinguisher compliance management
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-4">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              'Redirecting...'
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sign-in" className="w-full" onValueChange={() => setError(null)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in">
              <form action={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Your password"
                    className="h-10"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm font-medium text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-10 bg-red-600 hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sign-up">
              <form action={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="full_name"
                    type="text"
                    placeholder="Jane Smith"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Choose a password"
                    className="h-10"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Sign up is for initial Super Admin setup only. Regular users are added via invitation.
                </p>
                {error && (
                  <p className="text-sm font-medium text-red-600">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-10 bg-red-600 hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
