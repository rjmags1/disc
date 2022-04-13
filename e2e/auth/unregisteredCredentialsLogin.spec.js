const { test, expect } = require('@playwright/test')
const { TESTUSER_REGISTERED, TESTUSER_UNREGISTERED } = require('../lib/auth')

test.describe('valid unregistered inputs rejected', async () => {
    const waitOptions = { timeout: 5 * 1000 }
    const [registered, unregistered] =
        [TESTUSER_REGISTERED, TESTUSER_UNREGISTERED]

    test('unregistered org rejected -- full login', async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').
            fill(unregistered.organization)

        await page.locator('#email-input').
            fill(registered.email)

        await page.locator('#password-input').fill(registered.password)

        await page.locator('#full-login-submit-button').click()

        const invalidMessage = await page.
            waitForSelector('text=/invalid/i', waitOptions)

        expect(invalidMessage).not.toBeNull()
    })


    test('unregistered email rejected -- full login', async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').
            fill(registered.organization)

        await page.locator('#email-input').fill(unregistered.email)

        await page.locator('#password-input').fill(registered.password)

        await page.locator('#full-login-submit-button').click()

        const invalidMessage = await page.
            waitForSelector('text=/invalid/i', waitOptions)

        expect(invalidMessage).not.toBeNull()
    })


    test('existing user but incorrect password rejected -- full login', 
        async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').
            fill(registered.organization)

        await page.locator('#email-input').fill(registered.email)

        await page.locator('#password-input').fill(unregistered.password)

        await page.locator('#full-login-submit-button').click()

        const invalidMessage = await page.
            waitForSelector('text=/invalid/i', waitOptions)

        expect(invalidMessage).not.toBeNull()
    })


    test('unregistered org rejected -- email login', async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').
            fill(unregistered.organization)

        await page.locator('#email-input').fill(registered.email)

        await page.locator('text=Email Me Login Link').click()

        const invalidMessage = await page.
            waitForSelector('text=/invalid/i', waitOptions)

        expect(invalidMessage).not.toBeNull()
    })


    test('unregistered email rejected -- email login', async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').
            fill(registered.organization)

        await page.locator('#email-input').fill(unregistered.email)

        await page.locator('text=Email Me Login Link').click()

        const invalidMessage = await page.
            waitForSelector('text=/invalid/i', waitOptions)

        expect(invalidMessage).not.toBeNull()
    })
})