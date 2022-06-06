const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF
} = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    getFirstDisplayedCommentPageAndDbInfo, 
    TEST_POST_INFO, 
    assertOnCommentLikeUnlike, 
    removeTestCommentFromDb
} = require('../lib/post')


test.beforeEach(async ({ page, isMobile }, { title: testTitle }) => {
    let userToLogin
    if (testTitle === 'staff user - endorse btn') userToLogin = TESTUSER_STAFF
    else userToLogin = TESTUSER_REGISTERED

    await login(page, userToLogin)

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

test.describe('like and reply buttons - always displayed', async () => {

    // failures fairly likely if running with multiple workers 
    // pinging same db resource simultaneously. 
    // npm run e2e-serial to ensure failures resulting from faulty impl.
    test('like button', async ({ page }) => {
        const {
            dbCommentInfo, pageCommentInfo
        } = await getFirstDisplayedCommentPageAndDbInfo(page, TEST_POST_INFO.id)
        const { pageAuthor, pageComment, pageLikes } = pageCommentInfo
        const { dbAuthor, dbComment, dbLikes } = dbCommentInfo
        expect([pageAuthor, pageLikes]).toEqual([
            dbAuthor, dbLikes])
        expect(pageComment).toMatch(new RegExp(dbComment))

        const commentBoxLocator = page.locator(
            '[data-testid=comment-box-container]').nth(0)
        
        await assertOnCommentLikeUnlike(
            commentBoxLocator, pageLikes, TEST_POST_INFO.id)
    })

    test('reply button', async ({ page }) => {

        const firstDisplayedAncestorCommentBoxLocator = page.locator(
            '[data-testid=comment-box-container]').nth(0)
        const replyButtonLocator = (
            firstDisplayedAncestorCommentBoxLocator.locator(
                '[data-testid=comment-reply-button]'))

        await replyButtonLocator.click()
        const editorLocator = page.locator(
            '#quill-editor-container').locator('.ql-editor')
        await expect(editorLocator).toBeVisible()
        
        const replyInputLocator = editorLocator.locator('text=test reply')
        await Promise.all([
            editorLocator.type("test reply"),
            replyInputLocator.waitFor()
        ])
        const editorSubmitButtonLocator = page.locator(
            '[data-testid=editor-submit-button]')
        const newCommentLocator = page.locator(
            '[data-testid=comment-box-container]').nth(1).locator(
                'text=test reply')
        await Promise.all([
            editorSubmitButtonLocator.click(),
            newCommentLocator.waitFor()
        ])

        await removeTestCommentFromDb()
    })
})