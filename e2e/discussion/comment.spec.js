const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    getAllDbTopLevelThreadCommentsDisplayOrder, 
    TEST_POST_INFO, 
    lazyLoadAllTopLevelPageComments,
    getAvatarUrlAndName,
    assertOnCommentAvatar,
    assertOnEndorsedCheckBadges,
    assertOnTimestampAuthor,
    assertOnCommentContent,
    baseAssertOnCommentControlPanel
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

test.describe('comment information correctly displayed to user', async () => {
    test.setTimeout(60000)
    
    test('non-user authored post; non-admin, non-staff user', 
    async ({ page, browserName }) => {
        const { userId: loggedInStudentUserId } = TESTUSER_REGISTERED

        const displayOrderDbComments = (
            await getAllDbTopLevelThreadCommentsDisplayOrder(TEST_POST_INFO.id))

        await lazyLoadAllTopLevelPageComments(page)

        const commentBoxLocator = page.locator(
            '[data-testid=comment-box-container]')
        const numPageComments = await commentBoxLocator.count()
        expect(numPageComments).toBe(displayOrderDbComments.length)

        for (let i = 0; i < numPageComments; i++) {
            const dbCommentInfo = displayOrderDbComments[i]
            const authorId = dbCommentInfo.author
            const dbAuthorInfo = await getAvatarUrlAndName(authorId)
            const commentBox = commentBoxLocator.nth(i)

            await assertOnCommentAvatar(dbCommentInfo, dbAuthorInfo, commentBox)
            await assertOnEndorsedCheckBadges(dbCommentInfo, commentBox)
            await assertOnTimestampAuthor(dbCommentInfo, dbAuthorInfo, commentBox)
            await assertOnCommentContent(dbCommentInfo, commentBox, browserName)
            await baseAssertOnCommentControlPanel(
                dbCommentInfo, commentBox, loggedInStudentUserId)
        }
    })
})