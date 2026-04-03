import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getBrowserSupabasePublicConfig,
  resolveSupabasePublicConfig,
} from './config.ts'

test('prefers build-time public config over runtime NEXT_PUBLIC values', () => {
  const config = resolveSupabasePublicConfig({
    SUPABASE_URL: 'https://build.example.co',
    SUPABASE_ANON_KEY: 'build-anon-key',
    SUPABASE_PUBLISHABLE_KEY: 'build-publishable-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://runtime.example.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'runtime-anon-key',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'runtime-publishable-key',
  })

  assert.deepEqual(config, {
    url: 'https://build.example.co',
    anonKey: 'build-publishable-key',
  })
})

test('browser config prefers publishable key and falls back to anon key', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const previousPublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://browser.example.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'browser-anon-key'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY =
    'browser-publishable-key'

  assert.deepEqual(getBrowserSupabasePublicConfig(), {
    url: 'https://browser.example.co',
    anonKey: 'browser-publishable-key',
  })

  process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY =
    previousPublishableKey
})
