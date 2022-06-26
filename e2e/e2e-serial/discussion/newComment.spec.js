const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
} = require('../../lib/auth')
const { 
    TEST_POST_INFO, 
    removeTestCommentFromDb ,
    assertOnNewestCommentInDb,
    stripTerminatingNewlines
} = require('../../lib/post')
const { TEST_COURSE_INFO } = require('../../lib/course')

test.beforeEach(async ({ page, isMobile }) => {
    await login(page, TESTUSER_REGISTERED)
    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()

    const { term, code, section, name: testCourseName } = TEST_COURSE_INFO
    const specialCourseCardLocator = page.locator(
        '[data-testid=course-card-container]').locator('text=/cs344-1/i').nth(0)
    await Promise.all([
        specialCourseCardLocator.click(),
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

test.describe('new comment btn', async () => {
    test('new comment fxn', async ({ page }) => {
        const newCommentButtonLocator = page.locator(
            '[data-testid=new-comment-btn]')
        const editorLocator = page.locator(
            '#quill-editor-container').locator('.ql-editor')
        await Promise.all([
            newCommentButtonLocator.click(),
            editorLocator.waitFor()
        ])
        
        const testComment = 'new comment test'
        await editorLocator.type(testComment)
        const newEditorContents = await editorLocator.innerText()
        expect(stripTerminatingNewlines(newEditorContents)).toBe(testComment)
        
        const firstDisplayedCommentLocator = page.locator(
            '[data-testid=comment-container]').nth(0)
        await Promise.all([
            page.locator('[data-testid=editor-submit-button]').click(),
            page.locator('[data-testid=comment-container]', {
                hasText: testComment }).waitFor()
        ])
        await expect(firstDisplayedCommentLocator).toHaveText(testComment)
        await assertOnNewestCommentInDb(testComment, TEST_POST_INFO.id)

        await removeTestCommentFromDb()
    })
})