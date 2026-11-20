import { expect, test, type Page } from '@playwright/test'

function uniqueTitle(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function createMeetingType(
  page: Page,
  input: { title: string; description: string; durationMinutes: string },
) {
  await page.goto('/owner')
  await page.getByLabel('Название').fill(input.title)
  await page.getByLabel('Описание').fill(input.description)
  await page.getByLabel('Длительность, минут').fill(input.durationMinutes)
  await page.getByRole('button', { name: 'Создать тип встречи' }).click()

  await expect(page.getByRole('listitem').filter({ hasText: input.title })).toBeVisible()
}

test('guest selects a meeting type and sees slots grouped by days', async ({ page }) => {
  const title = uniqueTitle('Слоты')

  await createMeetingType(page, {
    title,
    description: 'Свободные слоты для гостя',
    durationMinutes: '30',
  })

  await page.goto('/guest')
  await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible()

  await page.getByRole('button', { name: new RegExp(title) }).click()

  await expect(page.getByRole('heading', { name: 'Свободные слоты' })).toBeVisible()

  const days = page.getByTestId('slot-day')
  await expect(days.first()).toBeVisible()
  expect(await days.count()).toBeGreaterThan(0)

  const firstDay = days.first()
  await expect(firstDay.getByRole('heading')).toHaveText(
    /^(Понедельник|Вторник|Среда|Четверг|Пятница),/,
  )
  await expect(firstDay.getByTestId('slot').first()).toHaveText(
    /^\d{2}:\d{2}–\d{2}:\d{2}$/,
  )

  await page.getByRole('button', { name: 'Выбрать другой тип' }).click()
  await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible()
})

test('guest sees an empty state when no slot fits into the workday', async ({ page }) => {
  const title = uniqueTitle('Долгая встреча')

  await createMeetingType(page, {
    title,
    description: 'Встреча на весь день',
    durationMinutes: '600',
  })

  await page.goto('/guest')
  await page.getByRole('button', { name: new RegExp(title) }).click()

  await expect(page.getByRole('heading', { name: 'Свободные слоты' })).toBeVisible()
  await expect(page.getByText('Свободных слотов нет.')).toBeVisible()
})
