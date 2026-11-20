export type MeetingType = {
  id: string
  title: string
  description: string
  durationMinutes: number
}

export type MeetingTypeInput = Omit<MeetingType, 'id'>

export type Slot = {
  startsAt: string
  endsAt: string
}

export type Booking = {
  id: string
  meetingTypeId: string
  startsAt: string
  guestName: string
  guestEmail: string
  createdAt: string
}

export type BookingInput = {
  meetingTypeId: string
  startsAt: string
  guestName: string
  guestEmail: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body.error === 'string' && body.error !== '') {
      return body.error
    }
  } catch {
    // Fall back to the status-based message below.
  }
  return `Запрос завершился с ошибкой ${response.status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, init)
  } catch {
    throw new ApiError('Не удалось связаться с сервером', 0)
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return (await response.json()) as T
}

export function listMeetingTypes(): Promise<MeetingType[]> {
  return request('/meeting-types')
}

export function createMeetingType(input: MeetingTypeInput): Promise<MeetingType> {
  return request('/meeting-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function listSlots(meetingTypeId: string): Promise<Slot[]> {
  return request(`/meeting-types/${encodeURIComponent(meetingTypeId)}/slots`)
}

export function listBookings(): Promise<Booking[]> {
  return request('/bookings')
}

export function createBooking(input: BookingInput): Promise<Booking> {
  return request('/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
