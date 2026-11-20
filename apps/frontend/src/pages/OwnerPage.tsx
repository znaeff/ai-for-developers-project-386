import { useEffect, useState } from 'react'
import { BookingList } from '@/components/BookingList'
import { MeetingTypeForm } from '@/components/MeetingTypeForm'
import { MeetingTypeList } from '@/components/MeetingTypeList'
import { PageLayout } from '@/components/PageLayout'
import { listBookings, listMeetingTypes } from '@/lib/api'
import { useApiResource } from '@/lib/useApiResource'

export function OwnerPage() {
  const [meetingTypesReloadKey, setMeetingTypesReloadKey] = useState(0)
  const [bookingsReloadKey, setBookingsReloadKey] = useState(0)

  const meetingTypesResource = useApiResource(
    listMeetingTypes,
    [meetingTypesReloadKey],
    {
      fallbackError: 'Не удалось загрузить типы встреч',
    },
  )
  const bookingsResource = useApiResource(listBookings, [bookingsReloadKey], {
    fallbackError: 'Не удалось загрузить брони',
  })

  const meetingTypes = meetingTypesResource.data ?? []
  const bookings = bookingsResource.data ?? []

  function refresh() {
    setMeetingTypesReloadKey((key) => key + 1)
    setBookingsReloadKey((key) => key + 1)
  }

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <PageLayout
      subtitle="Создайте тип встречи, чтобы гости могли его забронировать"
      title="Управление календарём"
    >
      <MeetingTypeForm
        onCreated={(meetingType) =>
          meetingTypesResource.setData((current) => [
            ...(current ?? []),
            meetingType,
          ])
        }
      />
      <MeetingTypeList
        isLoading={meetingTypesResource.isLoading}
        loadError={meetingTypesResource.error}
        meetingTypes={meetingTypes}
      />
      <BookingList
        bookings={bookings}
        isLoading={bookingsResource.isLoading}
        loadError={bookingsResource.error}
        meetingTypes={meetingTypes}
        onRefresh={refresh}
      />
    </PageLayout>
  )
}
