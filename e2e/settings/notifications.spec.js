const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { query } = require('../lib/db')

const SETTINGS = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

const SELECT_QUERIES = []
const RESET_QUERIES = []
for (let i = 0; i < SETTINGS.length; i++) {
    const table = SETTINGS[i]
    SELECT_QUERIES.push(`SELECT is_on FROM ${ table } WHERE person = $1;`)
    RESET_QUERIES.push(`
        UPDATE ${ table } SET is_on = NOT (
            SELECT is_on from ${ table } WHERE person = $1)
        WHERE person = $1`
    )
}

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)

    await page.locator('[data-testid=profile-button-container]').click()

    await Promise.all([
        page.waitForNavigation({ url: "/settings/account" }),
        page.locator('text=Settings').click()
    ])

    await Promise.all([
        page.waitForNavigation({ url: "/settings/notifications" }),
        page.locator('text=Notifications').click()
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
        await Promise.all([
            page.waitForNavigation({ url: "/settings/account" }),
            page.locator('text=Account').click()
        ])
    })
})


test.describe('manage notifications', async () => {
    test('current notification statuses match those in db', 
    async ({ page }) => {
        const [
            dbReply, dbMention, dbPostActivity, dbWatch
        ] = await getDbSettings()

        const [
            pageReply, pageMention, pagePostActivity, pageWatch
        ] = await getPageSettings(page)

        expect([dbReply, dbMention, dbPostActivity, dbWatch]).
            toEqual([pageReply, pageMention, pagePostActivity, pageWatch])
    })
   

    test('toggling flips button, doesnt change status unless save click',
    async ({ page }) => {
        // allow data hooks to load and setState
        await new Promise(res => setTimeout(res, 500))
        
        // get original actual setting statuses and toggler labels
        const originalSettings = await getPageSettings(page)
        const originalToggleButtonLabels = await getToggleButtonLabels(page)

        // click all of the toggle buttons
        for (let i = 0; i < SETTINGS.length; i++) {
            await page.locator(`button >> nth=${ i }`).click()
        }
        
        // we havent saved yet so actual setting statuses shouldnt have changed
        const notSaved = await getPageSettings(page)
        expect(notSaved).toEqual(originalSettings)
        
        // we clicked all toggle buttons so their labels should have flipped
        const newToggleButtonLabels = await getToggleButtonLabels(page)
        for (let i = 0; i < originalToggleButtonLabels.length; i++) {
            const oldLabel = originalToggleButtonLabels[i]
            const newLabel = newToggleButtonLabels[i]
            expect(oldLabel).not.toEqual(newLabel)
        }

        // save the toggled settings
        await page.locator('text=Save').click()
        await page.waitForSelector('text=Saved!')

        const savedSettings = await getPageSettings(page)
        const postSaveToggleButtonLabels = await getToggleButtonLabels(page)
        for (let i = 0; i < originalSettings.length; i++) {
            // check that save was successful
            const oldSetting = originalSettings[i]
            const newSetting = savedSettings[i]
            expect(newSetting).not.toEqual(oldSetting)
            
            // toggler labels shouldnt have changed due to save
            const preSavePostToggleLabel = newToggleButtonLabels[i]
            const postSaveLabel = postSaveToggleButtonLabels[i]
            expect(postSaveLabel).toEqual(preSavePostToggleLabel)
        }
    })
})



const getDbSettings = async function() {
    const { userId } = TESTUSER_REGISTERED
    const queryPromises = []
    for (const queryText of SELECT_QUERIES) {
        const queryPromise = query(queryText, [userId])
        queryPromises.push(queryPromise)
    }
    const queryResults = await Promise.all(queryPromises)
    const {
        comment_reply_email_setting: dbReply,
        mention_email_setting: dbMention,
        post_activity_email_setting: dbPostActivity,
        watch_email_setting: dbWatch
    } = Object.fromEntries(
        queryResults.map((result, i) => 
            [SETTINGS[i], result.rows[0].is_on]))

    return [dbReply, dbMention, dbPostActivity, dbWatch]
}


const getPageSettings = async function(page) {
    // get markup associated with each notification setting
    let pageReply, pageMention, pagePostActivity, pageWatch
    const htmlPromises = []
    for (let i = 0; i < SETTINGS.length; i++) {
        const pageSettingHtml = page.locator(
            `[data-testid=notifications-setting-container] 
                >> nth=${ i }` ).innerHTML()
        htmlPromises.push(pageSettingHtml)
    }

    // use markup to determine setting status according to rendered component
    const pageSettingHtmls = await Promise.all(htmlPromises)
    const settingStatus = html => /enabled/i.test(html)
    for (const html of pageSettingHtmls) {
        if (/someone replies to my comment/i.test(html)) {
            pageReply = settingStatus(html)
        } else if (/someone mentions me/i.test(html)) {
            pageMention = settingStatus(html)
        } else if (/activity in a thread I'm watching/i.test(html)) {
            pageWatch = settingStatus(html)
        } else {
            pagePostActivity = settingStatus(html)
        }
    }

    return [pageReply, pageMention, pagePostActivity, pageWatch]
}

const getToggleButtonLabels = async function(page) {
    // get markup associated with each notification setting
    const htmlPromises = []
    for (let i = 0; i < SETTINGS.length; i++) {
        const pageSettingHtml = page.locator(
            `[data-testid=notifications-setting-container] 
                >> nth=${ i }` ).innerHTML()
        htmlPromises.push(pageSettingHtml)
    }
    const pageSettingHtmls = await Promise.all(htmlPromises)

    // use markup to get the toggle button label
    const buttonLabel = html => /Disable/.test(html) ? 'Disable' : 'Enable'
    let replyButtonLabel, mentionButtonLabel, 
        activityButtonLabel, watchButtonLabel
    for (const html of pageSettingHtmls) {
        if (/someone replies to my comment/i.test(html)) {
            replyButtonLabel = buttonLabel(html)
        } else if (/someone mentions me/i.test(html)) {
            mentionButtonLabel = buttonLabel(html)
        } else if (/activity in a thread I'm watching/i.test(html)) {
            watchButtonLabel = buttonLabel(html)
        } else {
            activityButtonLabel = buttonLabel(html)
        }
    }

    return [replyButtonLabel, mentionButtonLabel, 
            activityButtonLabel, watchButtonLabel]
}