type ExchangeResult = {
  error: { message?: string } | null
}

type SessionResult = {
  data: {
    session: {
      user?: unknown
    } | null
  }
}

type UserResult = {
  data: {
    user: unknown | null
  }
}

type EnsureProfileResult = {
  role?: string
  error?: string
}

export type AuthCallbackResolution =
  | {
      kind: 'redirect'
      href: '/dashboard' | '/super-admin' | '/login'
      message?: string
    }
  | {
      kind: 'error'
      message: string
    }

export async function resolveAuthCallback({
  code,
  ensureProfile,
  exchangeCodeForSession,
  getSession,
  getUser,
}: {
  code: string | null
  ensureProfile: () => Promise<EnsureProfileResult>
  exchangeCodeForSession: (code: string) => Promise<ExchangeResult>
  getSession: () => Promise<SessionResult>
  getUser: () => Promise<UserResult>
}): Promise<AuthCallbackResolution> {
  if (code) {
    const { error } = await exchangeCodeForSession(code)
    if (error) {
      return {
        kind: 'redirect',
        href: '/login',
        message: error.message ?? 'Sign-in failed — redirecting to login...',
      }
    }
  }

  const {
    data: { session },
  } = await getSession()

  let user = session?.user ?? null

  if (!user) {
    const { data } = await getUser()
    user = data.user
  }

  if (!user) {
    return {
      kind: 'redirect',
      href: '/login',
      message: 'Session not found — redirecting to login...',
    }
  }

  const profile = await ensureProfile()
  if (profile.error) {
    return {
      kind: 'redirect',
      href: '/login',
      message: 'Account setup failed — redirecting to login...',
    }
  }

  return {
    kind: 'redirect',
    href: profile.role === 'super_admin' ? '/super-admin' : '/dashboard',
  }
}
