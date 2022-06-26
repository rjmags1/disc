const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF
} = require('../../lib/auth')
const { TEST_COURSE_INFO } = require('../../lib/course')
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
    stripTerminatingNewlines,
    dbAssertThenRemoveTestPostFromDb,
    assertOnPostControlPanelButtonLabelChange,
    writeAssertOnNewPost,
    checkPostAttribute
} = require('../../lib/post')
const { getDbCourseCategories } = require('../../lib/categories')
const { getAllNonDeletedDbPostsInPageOrder } = require('../../lib/postListings')


test.beforeEach(async ({ page }, { title: testTitle }) => {
    await login(page, 
        testTitle === 'displayed post content' ? 
            TESTUSER_REGISTERED : TESTUSER_STAFF)
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
    test.setTimeout(60000)

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
                falseLabels[i], preClickUiStatus, testPostId, TESTUSER_STAFF.userId)
            const preClickLikes = await uiAssertPostControlPanelBooleanButton(
                falseLabels[i], preClickUiStatus, postListingLocator, 
                postTitle, isMobile, page)

            await locator.click()
            await assertOnPostControlPanelButtonLabelChange(
                falseLabels[i], trueLabels[i], preClickUiStatus, locator, page)
                        
            await new Promise(res => setTimeout(res, 300))
            const postClickLikes = await uiAssertPostControlPanelBooleanButton(
                falseLabels[i], !preClickUiStatus, postListingLocator, 
                postTitle, isMobile, page)
            if (falseLabels[i] === 'Like') {
                const postClickDiff = preClickUiStatus ? -1 : 1
                expect(postClickLikes - preClickLikes).toBe(postClickDiff)
            }
            await dbAssertPostControlPanelBooleanButton(
                falseLabels[i], !preClickUiStatus, testPostId, TESTUSER_STAFF.userId)

            // reset
            if (falseLabels[i] === 'Delete') await dbUndeletePost(testPostId)
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

test.describe('new post', async () => {    
    test('new post button, form fxn', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.locator('[data-testid=category-menu-hamburger]').click()
        }
        await Promise.all([
            page.locator('[data-testid=new-post-btn]').click(),
            page.locator('[data-testid=new-post-container]', {
                hasText: 'New Post' }).waitFor(),
            page.locator('[data-testid=category-menu-hamburger]').waitFor(
                { state: 'hidden' })
        ])
        
        const testTitle = "test post title"
        await page.locator(
            '[data-testid=new-post-title-input]').type(testTitle)
        const dbCategories = await getDbCourseCategories()
        const categorySelectLocator = page.locator(
            '[data-testid=new-post-category-select]')
        const randIdx = Math.floor(Math.random() * dbCategories.length)
        await Promise.all([
            categorySelectLocator.selectOption(`${ dbCategories[randIdx] }`),
            categorySelectLocator.locator(`text=${ dbCategories[randIdx] }`) 
        ])
        const postAttributeCheckLocator = page.locator(
            '[data-testid=post-attribute-checkbox]')
        const numChecks = await postAttributeCheckLocator.count()
        expect(numChecks).toBe(5)
        for (let i = 0; i < numChecks; i++) {
            const checkLabel = await postAttributeCheckLocator.nth(i).innerText()
            if (/private/i.test(checkLabel)) continue
            await checkPostAttribute(postAttributeCheckLocator.nth(i))
        }

        const editorLocator = page.locator(
            '#quill-editor-container').locator('.ql-editor')
        await writeAssertOnNewPost(editorLocator, page, testTitle)
        
        await dbAssertThenRemoveTestPostFromDb(testTitle)
    })
})
