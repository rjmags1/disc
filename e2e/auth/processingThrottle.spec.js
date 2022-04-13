const { test, expect } = require('@playwright/test')
const { TESTUSER_REGISTERED, emailLogin } = require('../lib/auth')

test.describe('correct email button throttling, button processing status',
    async () => {
    const registered = TESTUSER_REGISTERED

    // note: testing on email is sufficient because the same processing
    // dynamics apply to logging in normally, besides the fact that the
    // email login button wouldnt be clicked and so wouldnt get throttled.
    // testing processing/throttling ui for normal login is problematic
    // because the localhost api call is usually fast enough that the setState
    // calls that render the processing ui get batched with the one that remove it
    // on successful login
    test(`processing label on valid inputs email login`, async ({ page }) => {
        await page.goto('/login')

        await page.locator('#organization-input').fill(registered.organization)
        await page.locator('#email-input').fill(registered.email)

        await Promise.all([
            page.waitForSelector(
                '#email-login-submit-button:has-text("Processing...")'),
            page.waitForSelector('#button-loading'),
            expect(page.locator('#full-login-submit-button')).toBeDisabled(),
            expect(page.locator('#email-login-submit-button')).toBeDisabled(),
            page.locator('text=Email Me Login Link').click()
        ])
    })


    test(`email login throttled`, async ({ page }) => {
        page.on('dialog', async dialog => {
            expect(dialog.message()).toMatch(/check your email/i)
            await dialog.dismiss()
        })

        await emailLogin(page, registered)

        await page.waitForSelector('#button-loading')

        await expect(page.locator('#full-login-submit-button')).not.toBeDisabled()
        
        await expect(page.locator('#email-login-submit-button')).toBeDisabled()
    })
})