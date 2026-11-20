import { expect, test } from '@playwright/test'

test('owner creates a meeting type and sees it in the list', async ({ page }) => {
  await page.goto('/owner')

  await expect(page.getByRole('heading', { name: 'Управление календарём' })).toBeVisible()

  await page.getByLabel('Название').fill('Консультация')
  await page.getByLabel('Описание').fill('Обсуждение проекта')
  await page.getByLabel('Длительность, минут').fill('45')
  await page.getByRole('button', { name: 'Создать тип встречи' }).click()

  const created = page.getByRole('listitem').filter({ hasText: 'Консультация' })
  await expect(created).toBeVisible()
  await expect(created).toContainText('Обсуждение проекта')
  await expect(created).toContainText('45 минут')
})

test('owner sees a validation error from the API', async ({ page }) => {
  await page.goto('/owner')

  await page.getByLabel('Название').fill('   ')
  await page.getByRole('button', { name: 'Создать тип встречи' }).click()

  await expect(page.getByRole('alert')).toContainText('Название обязательно')
})
