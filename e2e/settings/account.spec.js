const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { unsealData } = require('iron-session')
const { query } = require('../lib/db')

const NEW_REGISTERED_TEST_USER_EMAIL = "harrysNewEmail@gmail.com"

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)

    const profileButtonLocator = page.locator(
        '[data-testid=profile-button-container]')
    const smallViewport = !(await profileButtonLocator.isVisible())
    if (smallViewport) {
        await page.locator('[data-testid=hamburger-container]').click()
    }
    else await profileButtonLocator.click()

    await Promise.all([
        page.waitForNavigation({ url: "/settings/account" }),
        page.locator('text=Account').click()
    ])
})

test.afterAll(async () => {
    const queryText = `DELETE FROM email WHERE email = $1`
    const params = [NEW_REGISTERED_TEST_USER_EMAIL]
    await query(queryText, params)
})

test.describe('settings menu pane', async () => {
    test('navigation to notifications settings menu', async ({ page }) => {
        const settingsPaneNotifBtnLocator = page.locator(
            'a:has-text("Notifications")')
        // only test this for browser contexts with large viewports
        const necessaryToTestThis = await settingsPaneNotifBtnLocator.isVisible()
        if (!necessaryToTestThis) return

        await Promise.all([
            page.waitForNavigation({ url: "/settings/notifications" }),
            settingsPaneNotifBtnLocator.click()
        ])
    })
})

test.describe('profile card', async () => {
    test('avatar picture uses avatar_url src', async ({ page, context }) => {
        const loggedInCookies = await context.cookies()

        const sealedSessionCookie = loggedInCookies.
            filter(c => /session/i.test(c.name))[0].value
        
        const unsealedSessionCookie = await unsealData(sealedSessionCookie, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })

        const cookieAvatarUrl = unsealedSessionCookie.user.avatar_url

        const noForwardSlashCookieAvatarUrl = cookieAvatarUrl.slice(1)

        const profileContainerImgs = await page.locator(
            '[data-testid=profile-card-avatar-container]').locator('img').
                elementHandles()
        
        const srcTestRegex = new RegExp(noForwardSlashCookieAvatarUrl)
        for (const img of profileContainerImgs) {
            const src = await img.getAttribute('src')
            if (srcTestRegex.test(src)) return
        }

        // if none of the imgs within the avatar container containing
        // a next/image have a src matching the cookie avatar url,
        // make an assertion that will always fail
        expect(false).toBe(true) 
    })

    test('profile card displays first and last name, primary email',
    async ({ page, context }) => {
        const loggedInCookies = await context.cookies()

        const sealedSessionCookie = loggedInCookies.
            filter(c => /session/i.test(c.name))[0].value

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
        const queryText = `SELECT email FROM email WHERE person = (
            SELECT person FROM email WHERE email = $1);`
        const emailsQuery = await query(queryText, [TESTUSER_REGISTERED.email])
        const registeredUserEmails = emailsQuery.rows.map(
            row => row.email
        )
        
        for (const email of registeredUserEmails) {
            await expect(page.locator(`text=${ email } >> nth=-1`)).
                toBeVisible()
        }
    })

    test('primary email correctly marked', async ({ page }) => {
        const registeredPrimaryEmail = TESTUSER_REGISTERED.email

        const primaryEmailHtml = await page.locator(
            `li:has-text("${ registeredPrimaryEmail }")`).innerHTML()
        
        expect(primaryEmailHtml).toMatch(/primary/i)
    })


    test('add email input rejects previously registered email, shows message',
    async ({ page }) => {
        const previouslyRegisteredEmail = TESTUSER_REGISTERED.email

        await page.locator('#new-email').fill(previouslyRegisteredEmail)

        await page.locator('#new-email-submit').click()

        await page.waitForSelector('text=/unable to register email/i')
    })


    test('add email input rejects new but invalid email, shows message',
    async ({ page }) => {
        const newButInvalid = "userATmissingatsymbol.com"

        await page.locator('#new-email').fill(newButInvalid)

        await page.locator('#new-email-submit').click()

        await page.waitForSelector('text=/unable to register email/i')
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
            expect(dialog.message()).toMatch(/sent you a reset email/i)
            await dialog.dismiss()
        })

        await page.locator('button:has-text("Reset Password")').click()

        const nowDisabled = await page.waitForSelector('[disabled] >> nth=-1')
        const nowDisabledHtml = await nowDisabled.innerHTML()
        expect(nowDisabledHtml).toMatch(/reset password/i)
    })
})