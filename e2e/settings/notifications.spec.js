const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { poolQuery } = require('../lib/db')

const SELECT_NOTI_QUERIES = [
    `SELECT is_on FROM comment_reply_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM mention_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM post_activity_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM watch_email_setting
        WHERE person = $1`
]

const RESET_NOTI_QUERIES = [
    `UPDATE comment_reply_email_setting SET
        is_on = NOT (SELECT is_on from comment_reply_email_setting
            WHERE person = $1)
        WHERE person = $1;`,
    `UPDATE mention_email_setting SET
        is_on = NOT (SELECT is_on from mention_email_setting
            WHERE person = $1)
        WHERE person = $1;`,
    `UPDATE post_activity_email_setting SET
        is_on = NOT (SELECT is_on from post_activity_email_setting
            WHERE person = $1)
        WHERE person = $1;`,
    `UPDATE watch_email_setting SET
        is_on = NOT (SELECT is_on from watch_email_setting
            WHERE person = $1)
        WHERE person = $1`
]

const SETTINGS = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

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
    for (const queryText of RESET_NOTI_QUERIES) {
        const queryPromise = poolQuery(queryText, [userId])
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
        
        const originalSettings = await getPageSettings(page)

        const labels = await getButtonLabels(page)

        const clickPromises = []
        for (let i = 0; i < SETTINGS.length; i++) {
            const clickPromise = await page.locator(
                `button >> nth=${ i }`).  click()
            clickPromises.push(clickPromise)
        }
        await Promise.all(clickPromises)
        
        const newLabels = await getButtonLabels(page)
        
        const notSaved = await getPageSettings(page)

        expect(notSaved).toEqual(originalSettings)
        
        for (let i = 0; i < labels.length; i++) {
            const oldLabel = labels[i], newLabel = newLabels[i]
            expect(oldLabel).not.toEqual(newLabel)
        }

        await page.locator('text=Save').click()

        await page.waitForSelector('text=Saved!')

        const savedSettings = await getPageSettings(page)

        const newAndSavedLabels = await getButtonLabels(page)
        
        for (let i = 0; i < originalSettings.length; i++) {
            const oldSetting = originalSettings[i]
            const newSetting = savedSettings[i]
            expect(newSetting).not.toEqual(oldSetting)
            
            const preSavePostToggleLabel = newLabels[i]
            const postSaveLabel = newAndSavedLabels[i]
            expect(postSaveLabel).toEqual(preSavePostToggleLabel)
        }
    })
})



const getDbSettings = async function() {
    const { userId } = TESTUSER_REGISTERED
    const queryPromises = []
    for (const queryText of SELECT_NOTI_QUERIES) {
        const queryPromise = poolQuery(queryText, [userId])
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
    let pageReply, pageMention, pagePostActivity, pageWatch
    const htmlPromises = []
    for (let i = 0; i < SETTINGS.length; i++) {
        const pageSettingHtml = page.locator(
            `[data-testid=notifications-setting-container] 
                >> nth=${ i }` ).innerHTML()
        htmlPromises.push(pageSettingHtml)
    }
    const pageSettingHtmls = await Promise.all(htmlPromises)
    const settingStatus = html => /enabled/gi.test(html)
    for (const html of pageSettingHtmls) {
        if (/someone replies to my comment/gi.test(html)) {
            pageReply = settingStatus(html)
        } else if (/someone mentions me/gi.test(html)) {
            pageMention = settingStatus(html)
        } else if (/activity in a thread I'm watching/gi.test(html)) {
            pageWatch = settingStatus(html)
        } else {
            pagePostActivity = settingStatus(html)
        }
    }

    return [pageReply, pageMention, pagePostActivity, pageWatch]
}

const getButtonLabels = async function(page) {
    const htmlPromises = []
    for (let i = 0; i < SETTINGS.length; i++) {
        const pageSettingHtml = page.locator(
            `[data-testid=notifications-setting-container] 
                >> nth=${ i }` ).innerHTML()
        htmlPromises.push(pageSettingHtml)
    }
    const pageSettingHtmls = await Promise.all(htmlPromises)

    const buttonLabel = html => /Disable/g.test(html) ? 'Disable' : 'Enable'
    let replyButtonLabel, mentionButtonLabel, 
        activityButtonLabel, watchButtonLabel
    for (const html of pageSettingHtmls) {
        if (/someone replies to my comment/gi.test(html)) {
            replyButtonLabel = buttonLabel(html)
        } else if (/someone mentions me/gi.test(html)) {
            mentionButtonLabel = buttonLabel(html)
        } else if (/activity in a thread I'm watching/gi.test(html)) {
            watchButtonLabel = buttonLabel(html)
        } else {
            activityButtonLabel = buttonLabel(html)
        }
    }

    return [replyButtonLabel, mentionButtonLabel, 
            activityButtonLabel, watchButtonLabel]
}