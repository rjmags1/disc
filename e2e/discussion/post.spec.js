const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF
} = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    assertOnPostContent,
    assertOnPostControlPanelContent,
    dbAssertPostControlPanelBooleanButton,
    getPostIdFromTitle,
    dbUndeletePost,
    uiAssertPostControlPanelBooleanButton,
    editPost,
    dbAssertEditedPost,
    stripSlashNewlines,
    stripTerminatingNewlines
} = require('../lib/post')
const { getAllNonDeletedDbPostsInPageOrder } = require('../lib/postListings')

// NOTE: these tests should be run with npm run e2e-serial

test.beforeEach(async ({ page }, { title: testTitle }) => {
    await login(page, testTitle === 'displayed post content' ? 
        TESTUSER_REGISTERED : TESTUSER_STAFF)
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

    test('displayed post content', async ({ page, isMobile }) => {
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
            await assertOnPostControlPanelContent(
                allDbPosts[i], page, TESTUSER_REGISTERED.userId)

            if (isMobile) await page.locator(
                '[data-testid=post-back-btn]').click()
        }
    })
})

test.describe('post control panel', async () => {
    test.slow()

    test('boolean control panel button fxn', async ({ page, isMobile }) => {
        // all cp buttons in one post
        const postListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                hasText: TESTUSER_STAFF.fullName }).nth(0)
        await Promise.all([
            postListingLocator.click(),
            expect(page.locator(
                "[data-testid=thread-container]").nth(0)).toBeVisible()
        ])
        
        const postTitle = await page.locator(
            '[data-testid=post-title]').innerText()
        const testPostId = await getPostIdFromTitle(postTitle)

        const locators = [
            page.locator('[data-testid=post-like-button-container]'),
            page.locator('[data-testid=post-watch-button-container]'),
            page.locator('[data-testid=post-star-button-container]'),
            page.locator('[data-testid=post-endorse-button-container]'),
            page.locator('[data-testid=post-delete-button-container]')
        ]
        const falseLabels = ['Like', 'Watch', 'Star', 'Endorse', 'Delete']
        const trueLabels = ['Unlike', 'Unwatch', 'Unstar', 'Unendorse']
        
        for (let i = 0; i < locators.length; i++) {
            const locator = locators[i]
            const label = await locator.innerText()
            const preClickUiStatus = !(new RegExp(falseLabels[i]).test(label))
            await dbAssertPostControlPanelBooleanButton(
                falseLabels[i], preClickUiStatus, 
                testPostId, TESTUSER_STAFF.userId)
            const preClickLikes = await uiAssertPostControlPanelBooleanButton(
                falseLabels[i], preClickUiStatus, 
                postListingLocator, postTitle, isMobile, page)

            await locator.click()
            if (falseLabels[i] === 'Delete') {
                let visStatus = true
                while (visStatus) {
                    visStatus = await page.locator(
                        '[data-testid=post-content-container]').isVisible()
                }
            }
            else {
                const newLabel = await locator.innerText()
                expect(newLabel).toMatch(new RegExp(preClickUiStatus ?
                    falseLabels[i] : trueLabels[i]))
            }            
            await new Promise(res => setTimeout(res, 300))
            const postClickLikes = await uiAssertPostControlPanelBooleanButton(
                falseLabels[i], !preClickUiStatus, 
                postListingLocator, postTitle, isMobile, page)
            if (falseLabels[i] === 'Like') {
                const postClickDiff = preClickUiStatus ? -1 : 1
                expect(postClickLikes - preClickLikes).toBe(postClickDiff)
            }
            await dbAssertPostControlPanelBooleanButton(
                falseLabels[i], !preClickUiStatus, 
                testPostId, TESTUSER_STAFF.userId)

            // reset
            if (falseLabels[i] === 'Delete') {
                await dbUndeletePost(testPostId)
            }
            else await locator.click()
        }
    })

    test('edit button control panel fxn', async ({ page }) => {
        const postListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                hasText: TESTUSER_STAFF.fullName }).nth(0)
        await Promise.all([
            postListingLocator.click(),
            expect(page.locator(
                "[data-testid=thread-container]").nth(0)).toBeVisible()
        ])
        
        const postTitle = await page.locator(
            '[data-testid=post-title]').innerText()
        const testPostId = await getPostIdFromTitle(postTitle)
        const editorLocator = page.locator(
            '#quill-editor-container').locator('.ql-editor')
        await Promise.all([
            page.locator('[data-testid=post-edit-button-container]').click(),
            editorLocator.waitFor()
        ])
        const oldTextContent = await editorLocator.innerText()
        const editText = (
            stripSlashNewlines(oldTextContent) + 'test edit content')
        await editPost(page, editorLocator, editText)

        const editedPostContent = await page.locator(
            '[data-testid=post-display-content]').innerText()
        expect(editedPostContent).toMatch(new RegExp(editText))
        await dbAssertEditedPost(editText, testPostId)

        // reset without quill newlines
        await editPost(page, editorLocator, 
            stripTerminatingNewlines(oldTextContent)) 
    })
})
