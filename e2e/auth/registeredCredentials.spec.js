const { test, expect } = require('@playwright/test')
const { login, emailLogin, TESTUSER_REGISTERED } = require('../lib/auth')

test.describe('valid registered inputs accepted', async () => {
    test('all three fields filled with valid input -> login success', async ({ page }) => {
        await login(page, TESTUSER_REGISTERED)
        const title = await page.title()
        expect(title).toMatch(/dashboard/gi)
    })

    test('email and org fields filled with valid input -> check your email alert', async ({ page }) => {
        await emailLogin(page, TESTUSER_REGISTERED)
        page.on('dialog', dialog => dialog.accept())
    })
})