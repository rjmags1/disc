const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')

test.describe('logout flow', () => {
    test('logout from index', async ({ page, context }) => {
        await login(page, TESTUSER_REGISTERED)

        const loggedInCookies = await context.cookies()

        expect(loggedInCookies.
            filter(c => /session/i.test(c.name)).length).toBe(1)

        const profileButtonLocator = page.locator(
            '[data-testid=profile-button-container]')
        const smallViewport = !(await profileButtonLocator.isVisible())
        if (smallViewport) {
            await page.locator('[data-testid=hamburger-container]').click()
        }
        else await profileButtonLocator.click()

        await Promise.all([
            page.waitForNavigation({ url: "/login" }),
            page.locator('text=Log out').click()
        ])

        await expect(page.locator('#full-login-submit-button')).toBeVisible()

        const loggedOutCookies = await context.cookies()

        expect(loggedOutCookies.
            filter(c => /session/i.test(c.name)).length).toBe(0)
    })


    test('logout from account settings', async({ page, context }) => {
        await login(page, TESTUSER_REGISTERED)

        const loggedInCookies = await context.cookies()

        expect(loggedInCookies.
            filter(c => /session/i.test(c.name)).length).toBe(1)
        
        await page.goto('/settings/account')

        const profileButtonLocator = page.locator(
            '[data-testid=profile-button-container]')
        const smallViewport = !(await profileButtonLocator.isVisible())
        if (smallViewport) {
            await page.locator('[data-testid=hamburger-container]').click()
        }
        else await profileButtonLocator.click()

        await Promise.all([
            page.waitForNavigation({ url: "/login" }),
            page.locator('text=Log out').click()
        ])

        await expect(page.locator('#full-login-submit-button')).toBeVisible()

        const loggedOutCookies = await context.cookies()

        expect(loggedOutCookies.
            filter(c => /session/i.test(c.name)).length).toBe(0)
    })
    

    test('logout from notifications settings', async({ page, context }) => {
        await login(page, TESTUSER_REGISTERED)

        const loggedInCookies = await context.cookies()

        expect(loggedInCookies.
            filter(c => /session/i.test(c.name)).length).toBe(1)
        
        await page.goto('/settings/notifications')
        
        const profileButtonLocator = page.locator(
            '[data-testid=profile-button-container]')
        const smallViewport = !(await profileButtonLocator.isVisible())
        if (smallViewport) {
            await page.locator('[data-testid=hamburger-container]').click()
        }
        else await profileButtonLocator.click()

        await Promise.all([
            page.waitForNavigation({ url: "/login" }),
            page.locator('text=Log out').click()
        ])

        await expect(page.locator('#full-login-submit-button')).toBeVisible()

        const loggedOutCookies = await context.cookies()

        expect(loggedOutCookies.
            filter(c => /session/i.test(c.name)).length).toBe(0)
    })
    // test logout from discussion page
})