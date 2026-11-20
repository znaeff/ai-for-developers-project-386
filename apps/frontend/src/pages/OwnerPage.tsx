import { useEffect, useState } from 'react'
import { MeetingTypeForm } from '@/components/MeetingTypeForm'
import { MeetingTypeList } from '@/components/MeetingTypeList'
import { PageLayout } from '@/components/PageLayout'
import { listMeetingTypes, type MeetingType } from '@/lib/api'

export function OwnerPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

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
    </PageLayout>
  )
}
