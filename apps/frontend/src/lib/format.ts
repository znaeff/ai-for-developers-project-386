export function formatDuration(minutes: number): string {
  const mod10 = minutes % 10
  const mod100 = minutes % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${minutes} минута`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${minutes} минуты`
  }

  return `${minutes} минут`
}
