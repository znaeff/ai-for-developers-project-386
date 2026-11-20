import { useEffect, useState } from 'react'
import { BookingList } from '@/components/BookingList'
import { MeetingTypeForm } from '@/components/MeetingTypeForm'
import { MeetingTypeList } from '@/components/MeetingTypeList'
import { PageLayout } from '@/components/PageLayout'
import {
  listBookings,
  listMeetingTypes,
  type BookingListItem,
  type MeetingType,
} from '@/lib/api'

export function OwnerPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [bookingsVersion, setBookingsVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    listMeetingTypes()
      .then((loaded) => {
        if (!cancelled) setMeetingTypes(loaded)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setLoadError(
            caught instanceof Error ? caught.message : 'Не удалось загрузить типы встреч',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoadingBookings(true)
    setBookingsError(null)

    listBookings()
      .then((loaded) => {
        if (!cancelled) setBookings(loaded)
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setBookingsError(
            caught instanceof Error ? caught.message : 'Не удалось загрузить брони',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBookings(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingsVersion])

  return (
    <PageLayout
      subtitle="Создайте тип встречи, чтобы гости могли его забронировать"
      title="Управление календарём"
    >
      <MeetingTypeForm
        onCreated={(meetingType) =>
          setMeetingTypes((current) => [...current, meetingType])
        }
      />
      <MeetingTypeList
        isLoading={isLoading}
        loadError={loadError}
        meetingTypes={meetingTypes}
      />
      <BookingList
        bookings={bookings}
        isLoading={isLoadingBookings}
        loadError={bookingsError}
        onRefresh={() => setBookingsVersion((version) => version + 1)}
      />
    </PageLayout>
  )
}
