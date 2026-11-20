import { useState, type FormEvent } from 'react'
import { inputClassName } from '@/components/formStyles'
import { Button } from '@/components/ui/button'
import { createMeetingType, type MeetingType } from '@/lib/api'

type MeetingTypeFormProps = {
  onCreated: (meetingType: MeetingType) => void
}

export function MeetingTypeForm({ onCreated }: MeetingTypeFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const meetingType = await createMeetingType({
        title,
        description,
        durationMinutes: Number(durationMinutes),
      })
      onCreated(meetingType)
      setTitle('')
      setDescription('')
      setDurationMinutes('30')
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Не удалось создать тип встречи',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Новый тип встречи</h2>
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meeting-type-title">
            Название
          </label>
          <input
            className={inputClassName}
            id="meeting-type-title"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meeting-type-description">
            Описание
          </label>
          <textarea
            className={inputClassName}
            id="meeting-type-description"
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            value={description}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meeting-type-duration">
            Длительность, минут
          </label>
          <input
            className={inputClassName}
            id="meeting-type-duration"
            inputMode="numeric"
            min="1"
            onChange={(event) => setDurationMinutes(event.target.value)}
            step="1"
            type="number"
            value={durationMinutes}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Создание…' : 'Создать тип встречи'}
        </Button>
      </form>
    </section>
  )
}
