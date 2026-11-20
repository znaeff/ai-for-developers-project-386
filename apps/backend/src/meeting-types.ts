import { randomUUID } from 'node:crypto'

export type MeetingType = {
  id: string
  title: string
  description: string
  durationMinutes: number
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
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return { ok: false, error: 'Длительность должна быть положительным целым числом минут' }
  }

  return {
    ok: true,
    value: {
      title: title.trim(),
      description: description ?? '',
      durationMinutes,
    },
  }
}

export type MeetingTypeStore = {
  list(): MeetingType[]
  find(id: string): MeetingType | undefined
  create(input: MeetingTypeInput): MeetingType
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
  }
}
