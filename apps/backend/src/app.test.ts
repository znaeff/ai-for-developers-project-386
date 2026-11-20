import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, it } from 'vitest'
import { createServer } from './app.js'
import type { MeetingType } from './meeting-types.js'

let servers: Server[] = []

async function startServer(options?: { apiPrefix?: string }): Promise<AddressInfo> {
  const current = createServer(options)
  servers.push(current)
  await new Promise<void>((resolve) => current.listen(0, '127.0.0.1', resolve))
  return current.address() as AddressInfo
}

afterEach(async () => {
  const current = servers
  servers = []
  await Promise.all(
    current.map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        }),
    ),
  )
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

it('starts with an empty meeting types list', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/meeting-types`)

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(await response.json()).toEqual([])
})

it('creates a meeting type and includes it in the list', async () => {
  const address = await startServer()
  const created = await fetch(`http://127.0.0.1:${address.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Знакомство',
      description: 'Короткий созвон',
      durationMinutes: 30,
    }),
  })

  expect(created.status).toBe(201)
  const meetingType = (await created.json()) as MeetingType
  expect(meetingType).toMatchObject({
    title: 'Знакомство',
    description: 'Короткий созвон',
    durationMinutes: 30,
  })
  expect(meetingType.id).toEqual(expect.any(String))

  const listed = await fetch(`http://127.0.0.1:${address.port}/meeting-types`)
  expect(await listed.json()).toEqual([meetingType])
})

it('rejects a meeting type without a title', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '   ',
      description: 'Короткий созвон',
      durationMinutes: 30,
    }),
  })

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: expect.any(String) })
})

it.each([0, -15, 2.5])('rejects duration %s minutes', async (durationMinutes) => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Знакомство',
      description: '',
      durationMinutes,
    }),
  })

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: expect.any(String) })
})

it('keeps an empty description', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Знакомство',
      description: '',
      durationMinutes: 30,
    }),
  })

  expect(response.status).toBe(201)
  expect(await response.json()).toMatchObject({ description: '' })
})

it('keeps meeting types isolated between servers', async () => {
  const first = await startServer()
  await fetch(`http://127.0.0.1:${first.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Знакомство',
      description: '',
      durationMinutes: 30,
    }),
  })

  const second = await startServer()
  const listed = await fetch(`http://127.0.0.1:${second.port}/meeting-types`)

  expect(await listed.json()).toEqual([])
})

it('rejects malformed JSON with a JSON error', async () => {
  const address = await startServer()
  const response = await fetch(`http://127.0.0.1:${address.port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"title":',
  })

  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: expect.any(String) })
})

it('serves meeting types under the production api prefix', async () => {
  const address = await startServer({ apiPrefix: '/api' })
  const baseUrl = `http://127.0.0.1:${address.port}/api/meeting-types`

  const created = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Знакомство',
      description: 'Короткий созвон',
      durationMinutes: 30,
    }),
  })

  expect(created.status).toBe(201)
  expect(await (await fetch(baseUrl)).json()).toHaveLength(1)
})
