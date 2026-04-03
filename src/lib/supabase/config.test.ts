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
    NEXT_PUBLIC_SUPABASE_URL: 'https://runtime.example.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'runtime-anon-key',
  })

  assert.deepEqual(config, {
    url: 'https://build.example.co',
    anonKey: 'build-anon-key',
  })
})

test('browser config reads NEXT_PUBLIC values directly', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://browser.example.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'browser-anon-key'

  assert.deepEqual(getBrowserSupabasePublicConfig(), {
    url: 'https://browser.example.co',
    anonKey: 'browser-anon-key',
  })

  process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey
})
