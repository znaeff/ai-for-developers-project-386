import { expect, test } from '@playwright/test'

test('landing page links to the guest and owner pages', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Календарь звонков' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Бронировать встречу' })).toHaveAttribute('href', '/guest')
  await expect(page.getByRole('link', { name: 'Управление календарём' })).toHaveAttribute('href', '/owner')
})

test('role links open the stub pages and return home', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Бронировать встречу' }).click()
  await expect(page).toHaveURL(/\/guest$/)
  await expect(page.getByText('Страница в разработке')).toBeVisible()

  await page.getByRole('link', { name: 'На главную' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('link', { name: 'Управление календарём' }).click()
  await expect(page).toHaveURL(/\/owner$/)
  await expect(page.getByText('Страница в разработке')).toBeVisible()
})
