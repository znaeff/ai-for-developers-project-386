import { randomUUID } from 'node:crypto'

export const ALLOWED_DURATION_MINUTES = [15, 30, 45, 60] as const

export type AllowedDurationMinutes = (typeof ALLOWED_DURATION_MINUTES)[number]

export type MeetingType = {
  id: string
  title: string
  description: string
  durationMinutes: AllowedDurationMinutes
}

export type MeetingTypeInput = Omit<MeetingType, 'id'>

export type MeetingTypeValidation =
  | { ok: true; value: MeetingTypeInput }
  | { ok: false; error: string }

export function parseMeetingTypeInput(input: unknown): MeetingTypeValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'Ожидается объект с данными типа встречи' }
  }

  const { title, description, durationMinutes } = input as Record<string, unknown>

  if (typeof title !== 'string' || title.trim() === '') {
    return { ok: false, error: 'Название обязательно' }
  }

  if (description !== undefined && typeof description !== 'string') {
    return { ok: false, error: 'Описание должно быть строкой' }
  }

  if (
    typeof durationMinutes !== 'number' ||
    !ALLOWED_DURATION_MINUTES.includes(durationMinutes as AllowedDurationMinutes)
  ) {
    return {
      ok: false,
      error: 'Длительность должна быть одной из: 15, 30, 45, 60 минут',
    }
  }

  return {
    ok: true,
    value: {
      title: title.trim(),
      description: description ?? '',
      durationMinutes: durationMinutes as AllowedDurationMinutes,
    },
  }
}

export type MeetingTypeStore = {
  list(): MeetingType[]
  find(id: string): MeetingType | undefined
  create(input: MeetingTypeInput): MeetingType
  clear(): void
}

export function createMeetingTypeStore(): MeetingTypeStore {
  const meetingTypes: MeetingType[] = []

  return {
    list() {
      return [...meetingTypes]
    },
    find(id) {
      return meetingTypes.find((meetingType) => meetingType.id === id)
    },
    create(input) {
      const meetingType: MeetingType = { id: randomUUID(), ...input }
      meetingTypes.push(meetingType)
      return meetingType
    },
    clear() {
      meetingTypes.length = 0
    },
  }
}
