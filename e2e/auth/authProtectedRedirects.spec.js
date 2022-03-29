const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')

test.describe('auth protected pages redirect to login page when logged in', async () => {
    test('index redirects to login if user not authenticated', async ({ page }) => {
        await page.goto('/')
        await page.waitForURL('/login')
        const title = await page.title()
        expect(title).toMatch(/login/gi)
    })

    test('account settings redirects to login if user not authenticated', async ({ page }) => {
        await page.goto('/settings/account')
        await page.waitForURL('/login')
        const title = await page.title()
        expect(title).toMatch(/login/gi)
    })

    test('notifications settings redirects to login if user not authenticated', async ({ page }) => {
        await page.goto('/settings/notifications')
        await page.waitForURL('/login')
        const title = await page.title()
        expect(title).toMatch(/login/gi)
    })

    test('login redirects to index if user is authenticated', async ({ page }) => {
        await login(page, TESTUSER_REGISTERED)
        
        await page.goto('/login');
        await page.waitForURL('/');
    })
})