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

test('guest books a slot and sees it disappear from the list', async ({ page }) => {
  const title = uniqueTitle('Бронирование')

  await createMeetingType(page, {
    title,
    description: 'Встреча с подтверждением',
    durationMinutes: '30',
  })

  await page.goto('/guest')
  await page.getByRole('button', { name: new RegExp(title) }).click()
  await expect(page.getByRole('heading', { name: 'Свободные слоты' })).toBeVisible()

  const firstDay = page.getByTestId('slot-day').first()
  const slot = firstDay.getByTestId('slot').first()
  const slotLabel = (await slot.innerText()).trim()

  await slot.click()

  await expect(page.getByRole('heading', { name: 'Данные гостя' })).toBeVisible()
  await page.getByLabel('Имя').fill('Анна')
  await page.getByLabel('Почта').fill('anna@example.com')
  await page.getByRole('button', { name: 'Забронировать' }).click()

  const confirmation = page.getByTestId('booking-confirmation')
  await expect(confirmation).toBeVisible()
  await expect(confirmation).toContainText(title)
  await expect(confirmation).toContainText(slotLabel)
  await expect(confirmation).toContainText('Анна')

  await expect(
    page
      .getByTestId('slot-day')
      .first()
      .getByTestId('slot')
      .filter({ hasText: slotLabel }),
  ).toHaveCount(0)
})

test('guest sees validation errors in the booking form', async ({ page }) => {
  const title = uniqueTitle('Валидация')

  await createMeetingType(page, {
    title,
    description: 'Проверка формы',
    durationMinutes: '30',
  })

  await page.goto('/guest')
  await page.getByRole('button', { name: new RegExp(title) }).click()
  await page.getByTestId('slot').first().click()

  await page.getByLabel('Почта').fill('anna@example.com')
  await page.getByRole('button', { name: 'Забронировать' }).click()
  await expect(page.getByRole('alert')).toContainText('Имя обязательно')

  await page.getByLabel('Имя').fill('Анна')
  await page.getByLabel('Почта').fill('anna@')
  await page.getByRole('button', { name: 'Забронировать' }).click()
  await expect(page.getByRole('alert')).toContainText('Почта')
})

