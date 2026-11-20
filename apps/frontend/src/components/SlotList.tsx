import type { Slot } from '@/lib/api'
import { formatMoscowDay, formatMoscowTime, moscowDayKey } from '@/lib/format'

type SlotGroup = {
  key: string
  label: string
  slots: Slot[]
}

function groupSlots(slots: Slot[]): SlotGroup[] {
  const groups = new Map<string, SlotGroup>()

  for (const slot of slots) {
    const key = moscowDayKey(slot.startsAt)
    const group = groups.get(key)

    if (group) {
      group.slots.push(slot)
    } else {
      groups.set(key, {
        key,
        label: formatMoscowDay(slot.startsAt),
        slots: [slot],
      })
    }
  }

  return [...groups.values()]
}

type SlotListProps = {
  slots: Slot[]
}

export function SlotList({ slots }: SlotListProps) {
  const groups = groupSlots(slots)

  return (
    <div className="space-y-6" data-testid="slot-list">
      {groups.map((group) => (
        <section
          aria-labelledby={`slot-day-${group.key}`}
          data-testid="slot-day"
          key={group.key}
        >
          <h3
            className="mb-2 text-sm font-semibold"
            id={`slot-day-${group.key}`}
          >
            {group.label}
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {group.slots.map((slot) => (
              <li
                className="rounded-md border border-border px-2 py-1.5 text-center text-sm tabular-nums"
                data-testid="slot"
                key={slot.startsAt}
              >
                {formatMoscowTime(slot.startsAt)}–{formatMoscowTime(slot.endsAt)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
