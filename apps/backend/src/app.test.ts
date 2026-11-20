import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, it } from 'vitest'
import { createServer } from './app.js'
import type { MeetingType } from './meeting-types.js'

let servers: Server[] = []

async function startServer(options?: {
  apiPrefix?: string
  now?: () => Date
}): Promise<AddressInfo> {
  const current = createServer(options)
  servers.push(current)
  await new Promise<void>((resolve) => current.listen(0, '127.0.0.1', resolve))
  return current.address() as AddressInfo
}

async function createMeetingType(
  port: number,
  input: { title?: string; description?: string; durationMinutes: number },
): Promise<MeetingType> {
  const response = await fetch(`http://127.0.0.1:${port}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title ?? 'Знакомство',
      description: input.description ?? '',
      durationMinutes: input.durationMinutes,
    }),
  })

  return (await response.json()) as MeetingType
}

async function getSlots(
  port: number,
  meetingTypeId: string,
): Promise<{ startsAt: string; endsAt: string }[]> {
  const response = await fetch(
    `http://127.0.0.1:${port}/meeting-types/${meetingTypeId}/slots`,
  )

  return (await response.json()) as { startsAt: string; endsAt: string }[]
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

it('generates 30-minute slots inside working hours with a Moscow offset', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 30 })

  const slots = await getSlots(address.port, meetingType.id)
  const firstDay = slots.filter((slot) => slot.startsAt.startsWith('2026-01-05'))

  expect(slots[0]).toEqual({
    startsAt: '2026-01-05T09:00:00+03:00',
    endsAt: '2026-01-05T09:30:00+03:00',
  })
  expect(firstDay).toHaveLength(18)
  expect(firstDay.at(-1)).toEqual({
    startsAt: '2026-01-05T17:30:00+03:00',
    endsAt: '2026-01-05T18:00:00+03:00',
  })
  expect(slots.every((slot) => /\+03:00$/.test(slot.startsAt))).toBe(true)
  expect(slots.every((slot) => /\+03:00$/.test(slot.endsAt))).toBe(true)
})

it.each([
  ['09:10', '2026-01-05T09:30:00+03:00'],
  ['09:00', '2026-01-05T09:30:00+03:00'],
])('skips slots that already started at %s Moscow time', async (moscowTime, expected) => {
  const now = new Date(`2026-01-05T${moscowTime}:00+03:00`)
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 30 })

  const slots = await getSlots(address.port, meetingType.id)

  expect(slots[0]?.startsAt).toBe(expected)
})

it('excludes weekends', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 30 })

  const slots = await getSlots(address.port, meetingType.id)
  const starts = slots.map((slot) => slot.startsAt)

  expect(starts.some((start) => start.startsWith('2026-01-10'))).toBe(false)
  expect(starts.some((start) => start.startsWith('2026-01-11'))).toBe(false)
  expect(starts).toContain('2026-01-09T17:30:00+03:00')
  expect(starts.indexOf('2026-01-12T09:00:00+03:00')).toBe(
    starts.indexOf('2026-01-09T17:30:00+03:00') + 1,
  )
})

it('starts on the next workday when opened on a weekend', async () => {
  const now = new Date('2026-01-10T05:00:00Z') // Saturday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 30 })

  const slots = await getSlots(address.port, meetingType.id)

  expect(slots[0]?.startsAt).toBe('2026-01-12T09:00:00+03:00')
})

it('limits slots to the next 14 days', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 30 })

  const slots = await getSlots(address.port, meetingType.id)

  expect(slots.at(-1)).toEqual({
    startsAt: '2026-01-16T17:30:00+03:00',
    endsAt: '2026-01-16T18:00:00+03:00',
  })
  expect(slots.some((slot) => slot.startsAt.startsWith('2026-01-19'))).toBe(false)
})

it('keeps 45-minute meetings on the 30-minute grid and before 18:00', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 45 })

  const slots = await getSlots(address.port, meetingType.id)
  const firstDay = slots.filter((slot) => slot.startsAt.startsWith('2026-01-05'))

  expect(firstDay[0]).toEqual({
    startsAt: '2026-01-05T09:00:00+03:00',
    endsAt: '2026-01-05T09:45:00+03:00',
  })
  expect(firstDay[1]).toEqual({
    startsAt: '2026-01-05T09:30:00+03:00',
    endsAt: '2026-01-05T10:15:00+03:00',
  })
  expect(firstDay.some((slot) => slot.startsAt.startsWith('2026-01-05T09:45'))).toBe(
    false,
  )
  expect(firstDay.at(-1)).toEqual({
    startsAt: '2026-01-05T17:00:00+03:00',
    endsAt: '2026-01-05T17:45:00+03:00',
  })
})

it('returns no slots when the meeting does not fit into the workday', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 600 })

  expect(await getSlots(address.port, meetingType.id)).toEqual([])
})

it('returns a single slot when the meeting fills the whole workday', async () => {
  const now = new Date('2026-01-05T05:00:00Z') // Monday, 08:00 in Moscow
  const address = await startServer({ now: () => now })
  const meetingType = await createMeetingType(address.port, { durationMinutes: 540 })

  const slots = await getSlots(address.port, meetingType.id)

  expect(slots[0]).toEqual({
    startsAt: '2026-01-05T09:00:00+03:00',
    endsAt: '2026-01-05T18:00:00+03:00',
  })
})

it('returns a JSON 404 for slots of an unknown meeting type', async () => {
  const address = await startServer()

  const response = await fetch(
    `http://127.0.0.1:${address.port}/meeting-types/missing/slots`,
  )

  expect(response.status).toBe(404)
  expect(response.headers.get('content-type')).toContain('application/json')
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

it('serves slots under the production api prefix', async () => {
  const now = new Date('2026-01-05T05:00:00Z')
  const address = await startServer({ apiPrefix: '/api', now: () => now })
  const baseUrl = `http://127.0.0.1:${address.port}/api`

  const created = await fetch(`${baseUrl}/meeting-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Знакомство', durationMinutes: 30 }),
  })
  const meetingType = (await created.json()) as MeetingType

  const response = await fetch(`${baseUrl}/meeting-types/${meetingType.id}/slots`)
  const slots = (await response.json()) as { startsAt: string }[]

  expect(response.status).toBe(200)
  expect(slots[0]?.startsAt).toBe('2026-01-05T09:00:00+03:00')
})
