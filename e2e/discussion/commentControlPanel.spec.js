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
    removeTestCommentFromDb,
    editAndAssertOnEditedPageComment,
    stripTerminatingNewlines,
    dbAssertResetFirstUserAuthoredCommentDeleted,
    dbAssertFirstUserAuthoredPostFirstCommentResAnsDelta,
    assertOnCorrectResolveAnswerButtonLabels,
    clickResolveAnswerButtonUiAssert,
    dbAssertFirstCommentEndorse
} = require('../lib/post')
const { loadAllPosts } = require('../lib/postListings')


// NOTE: ----------------------------------------------v
// these tests should be run serially with npm run e2e-serial.
// this is because most of these tests perform actions that alter
// a single database record twice in a row. the results
// of that test instance and those of the same test with different browser
// binaries depend on the consecutiveness of each individual test instance's
// database record interactions. running non-serially, ie with multiple
// workers, makes each worker interrupt the others' consecutive calls
// to the relevant database record, resulting
// in false test failures and inappropriately altered database records

test.beforeEach(async ({ page, isMobile }, { title: testTitle }) => {
    await login(page, testTitle === 'endorse btn' ?
        TESTUSER_STAFF : TESTUSER_REGISTERED)
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

test.describe('comment edit and delete buttons', async () => {
    test.setTimeout(10000)

    test('edit button', async ({ page }) => {
        const firstUserAuthoredCommentBoxLocator = page.locator(
            '[data-testid=comment-box-container]', {
                hasText: TESTUSER_REGISTERED.fullName }).nth(0)
        const prevComment = await firstUserAuthoredCommentBoxLocator.locator(
            '[data-testid=comment-container]').innerText() 
        // quill editor inserts newlines at the end of paragraphs
        // safari has similar newline insertion behavior
        // only care about inner newlines for this assertion
        const noNewlinesPrevComment = stripTerminatingNewlines(prevComment)

        await editAndAssertOnEditedPageComment(
            page, firstUserAuthoredCommentBoxLocator, "Voluptatibus quod eum.")

        await editAndAssertOnEditedPageComment( // reset
            page, firstUserAuthoredCommentBoxLocator, noNewlinesPrevComment)
    })

    test('delete button', async ({ page }) => {
        const firstUserAuthoredCommentThread = page.locator(
            '[data-testid=thread-container]', {
                hasText: TESTUSER_REGISTERED.fullName })
        const firstUserAuthoredCommentBoxLocator = page.locator(
            '[data-testid=comment-box-container]', {
                hasText: TESTUSER_REGISTERED.fullName }).nth(0)
        const commentContent = await firstUserAuthoredCommentBoxLocator.locator(
            '[data-testid=comment-container]').innerText()
        
        await Promise.all([
            firstUserAuthoredCommentBoxLocator.locator(
                '[data-testid=comment-delete-button]').click(),
            firstUserAuthoredCommentThread.locator(
                '[data-testid=comment-container]', {
                    hasText: 'deleted' })
        ])

        await dbAssertResetFirstUserAuthoredCommentDeleted(commentContent)
    })
})

test.describe('mark resolving btn, mark answer btn, endorse btn', async () => {
    test.setTimeout(10000)

    test('mark resolving button', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.locator('[data-testid=post-back-btn]').click()
        }

        await loadAllPosts(page)
        let firstUserAuthoredNormalPostListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                hasText: TESTUSER_REGISTERED.fullName,
                has: page.locator('[data-testid=normal-post-icon]')}).nth(0)
        let i = 0
        while (!(await firstUserAuthoredNormalPostListingLocator.locator(
            '[data-testid=comments-icon]').isVisible())) {
            firstUserAuthoredNormalPostListingLocator = page.locator(
                '[data-testid=post-info-container]', {
                    hasText: TESTUSER_REGISTERED.fullName,
                    has: page.locator('[data-testid=normal-post-icon]')
                }
            ).nth(++i)
        }
        const thePostTitle = (
            await firstUserAuthoredNormalPostListingLocator.locator(
                '[data-testid=post-info-title]').innerText())
        const initialPostResolvedStatus = (
            await firstUserAuthoredNormalPostListingLocator.locator(
                '[data-testid=green-checkmark-icon]').isVisible())
        const firstResolveBtn = page.locator(
            '[data-testid=comment-mark-resolving-btn]').nth(0)
        const initialResolveBtnStatus = await firstResolveBtn.locator(
            'text=/unmark as resolving/i').isVisible()
        await Promise.all([
            firstUserAuthoredNormalPostListingLocator.click(),
            page.locator('[data-testid=post-container]', {
                hasText: thePostTitle }).waitFor()
        ])

        await assertOnCorrectResolveAnswerButtonLabels(
            page, initialPostResolvedStatus, true)
        await clickResolveAnswerButtonUiAssert(
            page, initialPostResolvedStatus, isMobile, true,
            firstUserAuthoredNormalPostListingLocator
        ) // brings ui back to listings on mobile
        await dbAssertFirstUserAuthoredPostFirstCommentResAnsDelta(
            true, !initialResolveBtnStatus)
        
        //reset
        if (isMobile) {
            await firstUserAuthoredNormalPostListingLocator.click()
        }
        await firstResolveBtn.click()
    })

    test('mark answer button', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.locator('[data-testid=post-back-btn]').click()
        }

        await loadAllPosts(page)
        let firstUserAuthoredQuestionPostListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                hasText: TESTUSER_REGISTERED.fullName,
                has: page.locator('[data-testid=question-icon]')
            }).nth(0)
        let i = 0
        while (!(await firstUserAuthoredQuestionPostListingLocator.locator(
            '[data-testid=comments-icon]').isVisible())) {
            firstUserAuthoredQuestionPostListingLocator = page.locator(
                '[data-testid=post-info-container]', {
                    hasText: TESTUSER_REGISTERED.fullName,
                    has: page.locator('[data-testid=question-icon]')
                }
            ).nth(++i)
        }
        const thePostTitle = (
            await firstUserAuthoredQuestionPostListingLocator.locator(
                '[data-testid=post-info-title]').innerText())
        const initialPostAnsweredStatus = (
            await firstUserAuthoredQuestionPostListingLocator.locator(
                '[data-testid=green-checkmark-icon]').isVisible())
        const firstAnswerBtn = page.locator(
            '[data-testid=comment-mark-answer-btn]').nth(0)
        const initialAnswerBtnStatus = await firstAnswerBtn.locator(
            'text=/unmark as answer/i').isVisible()
        await Promise.all([
            firstUserAuthoredQuestionPostListingLocator.click(),
            page.locator('[data-testid=post-container]', {
                hasText: thePostTitle }).waitFor()
        ])

        await assertOnCorrectResolveAnswerButtonLabels(
            page, initialPostAnsweredStatus, false)
        await clickResolveAnswerButtonUiAssert( 
            page, initialPostAnsweredStatus, isMobile, false, 
            firstUserAuthoredQuestionPostListingLocator
        ) // brings ui back to listings on mobile
        await dbAssertFirstUserAuthoredPostFirstCommentResAnsDelta(
            false, !initialAnswerBtnStatus)

        //reset
        if (isMobile) {
            await firstUserAuthoredQuestionPostListingLocator.click()
        }
        await firstAnswerBtn.click()
    })

    test('endorse btn', async ({ page }) => {
        const commentBoxLocator = page.locator(
            '[data-testid=comment-box-container]').nth(0)
        const endorseButtonLocator = commentBoxLocator.locator(
            '[data-testid=comment-endorse-btn]')
        await expect(endorseButtonLocator).toBeVisible()
        const endorsedIconLocator = commentBoxLocator.locator(
            '[data-testid=comment-endorsed-icon]')
        const initialEndorsed = await endorsedIconLocator.isVisible()

        await Promise.all([
            endorseButtonLocator.click(),
            endorsedIconLocator.waitFor({
                state: initialEndorsed ? 'hidden' : 'visible' })
        ])

        await dbAssertFirstCommentEndorse(initialEndorsed)

        //reset
        await endorseButtonLocator.click()
    })
})