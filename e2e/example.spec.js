const { test, expect } = require('@playwright/test')

test('should navigate to login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText(/disc/gi)
    const title = await page.title()
    expect(title).toMatch(/login/gi)
})