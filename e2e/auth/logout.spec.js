const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')

test.describe('logout flow', () => {
    test('test', async ({ page, context }) => {
        await login(page, TESTUSER_REGISTERED)
        const title = await page.title()
        expect(title).toMatch(/dashboard/gi)

        const loggedInCookies = await context.cookies()
        expect(loggedInCookies.filter(c => /session/gi.test(c.name)).length).toBe(1)

        await page.locator('[data-testid=profile-button-container]').click();
        await Promise.all([
            page.waitForNavigation({ url: "/login" }),
            page.locator('text=Log out').click()
        ])

        const newTitle = await page.title()
        expect(newTitle).toMatch(/login/gi)
        const loggedOutCookies = await context.cookies()
        expect(loggedOutCookies.filter(c => /session/gi.test(c.name)).length).toBe(0)
    });
})