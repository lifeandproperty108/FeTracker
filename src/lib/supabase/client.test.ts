import test from 'node:test'
import assert from 'node:assert/strict'

import { getBrowserClientOptions } from './client.ts'

test('disables automatic auth code detection in the browser client', () => {
  assert.equal(getBrowserClientOptions().auth.detectSessionInUrl, false)
})
