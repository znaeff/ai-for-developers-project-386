import { useEffect, useState } from 'react'
import { PageLayout } from '@/components/PageLayout'
import { SlotList } from '@/components/SlotList'
import { Button } from '@/components/ui/button'
import {
  listMeetingTypes,
  listSlots,
  type MeetingType,
  type Slot,
} from '@/lib/api'
import { formatDuration } from '@/lib/format'

export function GuestPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [typesError, setTypesError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<MeetingType | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    listMeetingTypes()
      .then((loaded) => {
        if (!cancelled) setMeetingTypes(loaded)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setTypesError(
            caught instanceof Error ? caught.message : 'Не удалось загрузить типы встреч',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTypes(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedType) {
      setSlots([])
      setSlotsError(null)
      setIsLoadingSlots(false)
      return
    }

    let cancelled = false
    setIsLoadingSlots(true)
    setSlotsError(null)

    listSlots(selectedType.id)
      .then((loaded) => {
        if (!cancelled) setSlots(loaded)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setSlotsError(
            caught instanceof Error ? caught.message : 'Не удалось загрузить слоты',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedType])

  function selectMeetingType(meetingType: MeetingType) {
    setSelectedType(meetingType)
    setSlots([])
    setSlotsError(null)
    setIsLoadingSlots(true)
  }

  function returnToMeetingTypes() {
    setSelectedType(null)
    setSlots([])
    setSlotsError(null)
  }

  return (
    <PageLayout
      subtitle="Выберите тип встречи и свободное время"
      title="Бронировать встречу"
    >
      {selectedType ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{selectedType.title}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedType.description || 'Без описания'}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(selectedType.durationMinutes)}
              </p>
            </div>
            <Button onClick={returnToMeetingTypes} type="button" variant="outline">
              Выбрать другой тип
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Свободные слоты</h2>
              <p className="text-sm text-muted-foreground">
                Ближайшие 14 дней, время указано по Москве.
              </p>
            </div>

            {isLoadingSlots ? (
              <p className="text-muted-foreground">Загрузка слотов…</p>
            ) : null}

            {slotsError ? (
              <p className="text-sm text-destructive" role="alert">
                {slotsError}
              </p>
            ) : null}

            {!isLoadingSlots && !slotsError && slots.length === 0 ? (
              <p className="text-muted-foreground">Свободных слотов нет.</p>
            ) : null}

            {slots.length > 0 ? <SlotList slots={slots} /> : null}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Выберите тип встречи</h2>

          {isLoadingTypes ? (
            <p className="text-muted-foreground">Загрузка типов встреч…</p>
          ) : null}

          {typesError ? (
            <p className="text-sm text-destructive" role="alert">
              {typesError}
            </p>
          ) : null}

          {!isLoadingTypes && !typesError && meetingTypes.length === 0 ? (
            <p className="text-muted-foreground">Пока нет типов встреч.</p>
          ) : null}

          {meetingTypes.length > 0 ? (
            <ul className="space-y-3">
              {meetingTypes.map((meetingType) => (
                <li key={meetingType.id}>
                  <button
                    className="w-full space-y-2 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted"
                    onClick={() => selectMeetingType(meetingType)}
                    type="button"
                  >
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="font-medium">{meetingType.title}</span>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {formatDuration(meetingType.durationMinutes)}
                      </span>
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {meetingType.description || 'Без описания'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </PageLayout>
  )
}
