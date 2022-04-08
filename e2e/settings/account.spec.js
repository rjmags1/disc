const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { unsealData } = require('iron-session')
const { query } = require('../lib/db')

const NEW_REGISTERED_TEST_USER_EMAIL = "johnsNewEmail@gmail.com"

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)

    await page.locator('[data-testid=profile-button-container]').click()

    await Promise.all([
        page.waitForNavigation({ url: "/settings/account" }),
        page.locator('text=Settings').click()
    ])
})

test.afterAll(async () => {
    const queryText = `DELETE FROM email WHERE email = $1`
    const params = [NEW_REGISTERED_TEST_USER_EMAIL]
    await query(queryText, params)
})

test.describe('settings menu pane', async () => {
    test('navigation to notifications settings menu', async ({ page }) => {
        await Promise.all([
            page.waitForNavigation({ url: "/settings/notifications" }),
            page.locator('text=Notifications').click()
        ])
    })
})


test.describe('profile card', async () => {
    test('avatar picture uses avatar_url src', async ({ page, context }) => {
        const loggedInCookies = await context.cookies()

        const sealedSessionCookie = loggedInCookies.
            filter(c => /session/gi.test(c.name))[0].value
        
        const unsealedSessionCookie = await unsealData(sealedSessionCookie, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })

        const cookieAvatarUrl = unsealedSessionCookie.user.avatar_url

        const noForwardSlashCookieAvatarUrl = cookieAvatarUrl.slice(1)

        const avatarImgSrc = await page.locator('img >> nth=-1').
            getAttribute('src')

        expect(avatarImgSrc).
            toMatch(new RegExp(noForwardSlashCookieAvatarUrl, "g"))
    })

    test('profile card displays first and last name, primary email',
    async ({ page, context }) => {
        const loggedInCookies = await context.cookies()

        const sealedSessionCookie = loggedInCookies.
            filter(c => /session/gi.test(c.name))[0].value

        const unsealedSessionCookie = await unsealData(sealedSessionCookie, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })

        const { 
            f_name: cookieFirstName, 
            l_name: cookieLastName, 
            primary_email: cookieEmail 
        } = unsealedSessionCookie.user

        await expect(page.locator(
            `text=${ cookieFirstName } ${ cookieLastName }`)).toBeVisible()
        
        await expect(page.locator(`text=${ cookieEmail } >> nth=0`)).
            toBeVisible()
    })
})

test.describe('email section', async () => {
    test('all emails associated with account listed', async ({ page }) => {
        const registeredUserEmails = TESTUSER_REGISTERED.allEmails
        
        for (let i = 0; i < registeredUserEmails.length; i++) {
            const email = registeredUserEmails[i]

            await expect(page.locator(`text=${ email } >> nth=-1`)).toBeVisible()
        }
    })

    test('primary email correctly marked', async ({ page }) => {
        const registeredPrimaryEmail = TESTUSER_REGISTERED.email

        const primaryEmailHtml = await page.locator(
            `li:has-text("${ registeredPrimaryEmail }")`).innerHTML()
        
        expect(primaryEmailHtml).toMatch(/primary/gi)
    })

    test('add email input rejects previously registered email, shows message',
    async ({ page }) => {
        const previouslyRegisteredEmail = TESTUSER_REGISTERED.email

        await page.locator('#new-email').fill(previouslyRegisteredEmail)

        await page.locator('#new-email-submit').click()

        await page.waitForSelector('text=/unable to register email/gi')
    })

    test('add email input rejects new but invalid email, shows message',
    async ({ page }) => {
        const newButInvalid = "userATmissingatsymbol.com"

        await page.locator('#new-email').fill(newButInvalid)

        await page.locator('#new-email-submit').click()

        await page.waitForSelector('text=/unable to register email/gi')
    })

    test('add email input accepts valid new email', async ({ page }) => {
        const newAndValid = NEW_REGISTERED_TEST_USER_EMAIL

        await page.locator('#new-email').fill(newAndValid)

        await page.locator('#new-email-submit').click()

        await page.waitForSelector(`text=${ newAndValid }`)
    })
})

test.describe('reset password button', async () => {
    test('reset password button throttles on click, alerts on success', 
    async ({ page }) => {
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toMatch(/sent you a reset email/gi)
            await dialog.dismiss()
        })

        await page.locator('button:has-text("Reset Password")').click()

        const nowDisabled = await page.waitForSelector('[disabled] >> nth=-1')
        const nowDisabledHtml = await nowDisabled.innerHTML()
        expect(nowDisabledHtml).toMatch(/reset password/gi)
    })
})