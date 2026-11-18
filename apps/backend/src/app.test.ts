import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, it } from 'vitest'
import { createServer } from './app.js'

let server: Server | undefined

async function startServer(): Promise<AddressInfo> {
  const current = createServer()
  server = current
  await new Promise<void>((resolve) => current.listen(0, '127.0.0.1', resolve))
  return current.address() as AddressInfo
}

afterEach(async () => {
  if (!server) return

  const current = server
  server = undefined
  await new Promise<void>((resolve, reject) => {
    current.close((error) => (error ? reject(error) : resolve()))
  })
})

it('responds with Reserved on GET /reserve', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/reserve`)

  expect(response.status).toBe(200)
  expect(await response.text()).toBe('Reserved')
})

it('returns 404 for unknown routes', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/unknown`)

  expect(response.status).toBe(404)
})
