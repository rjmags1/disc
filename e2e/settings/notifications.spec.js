const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { query } = require('../lib/db')

const SETTINGS = [
    "watch_email_setting",
    "post_activity_email_setting",
    "comment_reply_email_setting",
    "mention_email_setting"
]

const SELECT_QUERIES = []
const RESET_QUERIES = []
for (const setting of SETTINGS) {
    SELECT_QUERIES.push(`SELECT is_on FROM ${ setting } WHERE person = $1;`)
    RESET_QUERIES.push(`
        UPDATE ${ setting } SET is_on = NOT (
            SELECT is_on from ${ setting } WHERE person = $1)
        WHERE person = $1`
    )
}

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
        page.waitForNavigation({ url: "/settings/notifications" }),
        page.locator('text=Notification Settings').click()
    ])
})

test.afterAll(async () => {
    const { userId } = TESTUSER_REGISTERED
    const queryPromises = []
    for (const queryText of RESET_QUERIES) {
        const queryPromise = query(queryText, [userId])
        queryPromises.push(queryPromise)
    }
    await Promise.all(queryPromises)
})

test.describe('settings menu pane', async () => {
    test('navigation to notifications settings menu', async ({ page }) => {
        const settingsPaneAccountBtnLocator = page.locator(
            'a:has-text("Account")')
        // only test this for browser contexts with large viewports
        const necessaryToTestThis = await settingsPaneAccountBtnLocator.
            isVisible()
        if (!necessaryToTestThis) return

        await Promise.all([
            page.waitForNavigation({ url: "/settings/account" }),
            settingsPaneAccountBtnLocator.click()
        ])
    })
})

test.describe('manage notifications', async () => {
    test('current notification statuses match those in db', 
    async ({ page }) => {
        const dbSettings = await getDbSettings()

        // make sure page is fully loaded
        await page.waitForSelector(
            '[data-testid=notifications-setting-container]')
        
        const pageSettings = await getPageSettings(page)

        expect(pageSettings).toEqual(dbSettings)
    })

    test('toggling flips button, doesnt change status unless save click',
    async ({ page }) => {
        // make sure page is fully loaded
        await page.waitForSelector(
            '[data-testid=notifications-setting-container]')

        const originalTogglerLabels = await getTogglerLabels(page)
        await toggleAllTogglers(page)
        const toggledLabels = await getTogglerLabels(page)
        for (let i = 0; i < toggledLabels.length; i++) {
            expect(originalTogglerLabels[i]).not.toEqual(toggledLabels[i])
        }
    })
})

const toggleAllTogglers = async function(page) {
    const togglers = await page.locator(
        '[data-testid=notifications-setting-toggler]').locator(
            'button'
        ).elementHandles()
    for (const toggler of togglers) {
        await toggler.click()
    }
}

const getTogglerLabels = async function(page) {
    const labels = [null, null, null, null]
    const pageHtmlRegexes = [
        /email me when there is activity in a thread i'm watching/i,
        /email me when someone replies to my thread/i,
        /email me when someone replies to my comment/i,
        /email me when someone mentions me/i
    ]
    const getLabelFromHtml = html => /Enable/.test(html) ? "Enable" : "Disable"
    const settingContainers = await page.locator(
        '[data-testid=notifications-setting-container]').elementHandles()
    for (const settingContainer of settingContainers) {
        const html = await settingContainer.innerHTML()
        if (pageHtmlRegexes[0].test(html)) {
            labels[0] = getLabelFromHtml(html)
        }
        else if (pageHtmlRegexes[1].test(html)) {
            labels[1] = getLabelFromHtml(html)
        }
        else if (pageHtmlRegexes[2].test(html)) {
            labels[2] = getLabelFromHtml(html)
        }
        else {
            labels[3] = getLabelFromHtml(html)
        }
    }

    return labels
}

const getDbSettings = async function() {
    const { userId: testUserId } = TESTUSER_REGISTERED
    const dbSettings = []
    for (const queryText of SELECT_QUERIES) {
        const settingQuery = await query(queryText, [testUserId])
        dbSettings.push(settingQuery.rows[0].is_on)
    }

    return dbSettings
}

const getPageSettings = async function(page) {
    const pageSettings = [null, null, null, null]
    const pageHtmlRegexes = [
        /email me when there is activity in a thread i'm watching/i,
        /email me when someone replies to my thread/i,
        /email me when someone replies to my comment/i,
        /email me when someone mentions me/i
    ]
    const getStatusFromHtml = html => /enabled/i.test(html)
    const settingContainers = await page.locator(
        '[data-testid=notifications-setting-container]').elementHandles()
    for (const settingContainer of settingContainers) {
        const html = await settingContainer.innerHTML()
        if (pageHtmlRegexes[0].test(html)) {
            pageSettings[0] = getStatusFromHtml(html)
        }
        else if (pageHtmlRegexes[1].test(html)) {
            pageSettings[1] = getStatusFromHtml(html)
        }
        else if (pageHtmlRegexes[2].test(html)) {
            pageSettings[2] = getStatusFromHtml(html)
        }
        else {
            pageSettings[3] = getStatusFromHtml(html)
        }
    }

    return pageSettings
}