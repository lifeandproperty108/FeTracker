import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveSupabasePublicConfig } from './config.ts'

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
