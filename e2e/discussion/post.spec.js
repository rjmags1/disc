const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF
} = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    assertOnPostContent,
    assertOnPostControlPanel
} = require('../lib/post')
const { getAllNonDeletedDbPostsInPageOrder } = require('../lib/postListings')

test.beforeEach(async ({ page, isMobile }) => {
    await login(page, TESTUSER_REGISTERED)
    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()

    const { term, code, section, name: testCourseName } = TEST_COURSE_INFO
    await Promise.all([
        page.locator(`text=/^${ testCourseName }$/i`).nth(0).click(),
        page.waitForSelector(`text=/${ testCourseName } - ${ term }/i`)
    ])
    const title = await page.title()
    expect(title).toMatch(new RegExp(
        `${ term } ${ code }-${ section } - Discussion`, "i"))
    await page.locator(
        '[data-testid=post-info-container]').nth(0).waitFor()
})

test.describe('post content', async () => {
    test.slow()

    test('displayed post reflects data in db', async ({ page, isMobile }) => {
        const postListingLocator = page.locator(
            '[data-testid=post-info-container]')
        const initialPostListings = await postListingLocator.count()
        const allDbPosts = (await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)).filter(
                row => !row.private || row.user_id === TESTUSER_REGISTERED.userId)
        for (let i = 0; i < initialPostListings; i++) {
            const listingTitle = await page.locator(
                '[data-testid=post-info-title]').nth(i).innerText()
            await Promise.all([
                postListingLocator.nth(i).click(),
                page.locator('[data-testid=post-container]', {
                    hasText: listingTitle })
            ])

            await assertOnPostContent(allDbPosts[i], page)
            await assertOnPostControlPanel(
                allDbPosts[i], page, TESTUSER_REGISTERED.userId)

            if (isMobile) await page.locator(
                '[data-testid=post-back-btn]').click()
        }
    })
})