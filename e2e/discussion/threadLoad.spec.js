const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const {
    TEST_POST_INFO, 
    getAllDbTopLevelThreadCommentsDisplayOrder, 
    lazyLoadAllTopLevelPageComments,
} = require('../lib/post')

test.beforeEach(async ({ page, isMobile }) => {
    await login(page, TESTUSER_REGISTERED)

    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()

    const { term, code, section, name: testCourseName } = TEST_COURSE_INFO
    await Promise.all([
        page.locator(`text=/^${ testCourseName }$/i`).click(),
        page.waitForSelector(`text=/${ testCourseName } - ${ term }/i`)
    ])

    const title = await page.title()
    expect(title).toMatch(new RegExp(
        `${ term } ${ code }-${ section } - Discussion`, "i"))
    
    
    if (!isMobile) await expect(
        page.locator("[data-testid=no-post-selected-icon]")).toBeVisible()

    await Promise.all([
        page.locator(
            `#post-info-container-${ TEST_POST_INFO.id }`).click(),
        expect(page.locator(
            "[data-testid=no-post-selected-icon]")).not.toBeVisible(),
        expect(page.locator(
            "[data-testid=thread-container]").nth(0)).toBeVisible()
    ])
})

test.describe('top level thread comment loading', async () => {
    test.slow()

    test('all top level thread comments loaded in correct order', async ({ page, browserName }) => {
        const dbTopLevelComments = (
            await getAllDbTopLevelThreadCommentsDisplayOrder(TEST_POST_INFO.id))

        const numTopLevelPageComments = (
            await lazyLoadAllTopLevelPageComments(page))
    
        expect(dbTopLevelComments.length).toBe(numTopLevelPageComments)

        const commentLocator = page.locator('[data-testid=comment-container]')
        for (let i = 0; i < numTopLevelPageComments; i++) {
            let pageComment = await commentLocator.nth(i).innerText()
            const dbInfo = dbTopLevelComments[i]
            const dbComment = dbInfo.deleted ? 'deleted' : dbInfo.display_content
            if (browserName === 'webkit' &&  // account for safari newline insertion
                dbComment.indexOf('\n', dbComment.length - 1) === -1 &&
                pageComment.indexOf('\n', pageComment.length - 1) !== -1) {
                pageComment = pageComment.slice(0, pageComment.length - 1)
            }

            const match = new RegExp(pageComment).test(dbComment)
            expect(match).toBe(true)
        }
    })
})