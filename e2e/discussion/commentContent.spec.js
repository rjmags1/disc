const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF,
    TESTUSER_ADMIN
} = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    getAllDbTopLevelThreadCommentsDisplayOrder, 
    TEST_POST_INFO, 
    lazyLoadAllTopLevelPageComments,
    getAvatarUrlAndName,
    assertOnCommentAvatar,
    assertOnCommentEndorsedCheckBadges,
    assertOnCommentTimestampAuthor,
    assertOnCommentContent,
    baseAssertOnCommentControlPanel
} = require('../lib/post')
const { loadAllPosts } = require('../lib/postListings')


test.beforeEach(async ({ page, isMobile }, { title: testTitle }) => {
    let userToLogin
    if (testTitle === 'staff user') userToLogin = TESTUSER_STAFF
    else if (testTitle === 'admin user') userToLogin = TESTUSER_ADMIN
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

test.describe('comment information correctly displayed to user', async () => {
    
    test('non-user authored post; non-admin, non-staff user', 
    async ({ page, browserName }) => {
        test.setTimeout(60000)
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
            await assertOnCommentEndorsedCheckBadges(dbCommentInfo, commentBox)
            await assertOnCommentTimestampAuthor(dbCommentInfo, dbAuthorInfo, commentBox)
            await assertOnCommentContent(dbCommentInfo, commentBox, browserName)
            await baseAssertOnCommentControlPanel(
                dbCommentInfo, commentBox, loggedInStudentUserId)
        }
    })

    test('user authored question post; non-admin, non-staff user',
    async ({ page, isMobile }) => {
        if (isMobile) {
            await Promise.all([
                page.locator('[data-testid=post-back-btn]').click(),
                page.waitForSelector(
                    '[data-testid=post-listings-container]')
            ])
        }
        await loadAllPosts(page)

        let questionPostListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                has: page.locator('[data-testid=question-icon]'),
                hasText: TESTUSER_REGISTERED.fullName }).nth(0)
        let i = 0;
        while (!(await questionPostListingLocator.locator(
            '[data-testid=comments-icon]').isVisible())) {
            questionPostListingLocator = page.locator(
                '[data-testid=post-info-container]', {
                    has: page.locator('[data-testid=question-icon]'),
                    hasText: TESTUSER_REGISTERED.fullName }).nth(++i)
        }
        const postInfoTitle = await questionPostListingLocator.locator(
            '[data-testid=post-info-title]').innerText()
        await Promise.all([
            questionPostListingLocator.click(),
            page.waitForSelector('[data-testid=post-content-container]', {
                hasText: postInfoTitle })
        ])
        
        const commentControlPanelLocator = page.locator(
            '[data-testid=comment-control-panel]')
        const numComments = await commentControlPanelLocator.count()
        for (let i = 0; i < numComments; i++) {
            await expect(commentControlPanelLocator.nth(i).locator(
                '[data-testid=comment-mark-answer-btn]')).toBeVisible()
        }
    })

    test('user authored normal post; non-admin, non-staff user',
    async ({ page, isMobile }) => {
        if (isMobile) {
            await Promise.all([
                page.locator('[data-testid=post-back-btn]').click(),
                page.waitForSelector(
                    '[data-testid=post-listings-container]')
            ])
        }
        await loadAllPosts(page)

        let normalPostListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                has: page.locator('[data-testid=normal-post-icon]'),
                hasText: TESTUSER_REGISTERED.fullName
            }).nth(0)
        let i = 0
        while (!(await normalPostListingLocator.locator(
            '[data-testid=comments-icon]').isVisible())) {
            normalPostListingLocator = page.locator(
            '[data-testid=post-info-container]', {
                has: page.locator('[data-testid=normal-post-icon]'),
                hasText: TESTUSER_REGISTERED.fullName
            }).nth(++i)
        }
        const postInfoTitle = await normalPostListingLocator.locator(
            '[data-testid=post-info-title]').innerText()
        await Promise.all([
            normalPostListingLocator.click(),
            page.waitForSelector('[data-testid=post-content-container]', {
                hasText: postInfoTitle })
        ])
        
        const commentControlPanelLocator = page.locator(
            '[data-testid=comment-control-panel]')
        const numComments = await commentControlPanelLocator.count()
        for (let i = 0; i < numComments; i++) {
            await expect(commentControlPanelLocator.nth(i).locator(
                '[data-testid=comment-mark-resolving-btn]')).toBeVisible()
        }
    })

    test('staff user', async ({ page }) => {
        const commentControlPanelLocator = page.locator(
            '[data-testid=comment-control-panel]')
        const numCommentsLoaded = await commentControlPanelLocator.count()
        for (let i = 0; i < numCommentsLoaded; i++) {
            await expect(commentControlPanelLocator.nth(i).locator(
                '[data-testid=comment-endorse-btn]')).toBeVisible()
        }
    })

    test('admin user', async ({ page }) => {
        const commentControlPanelLocator = page.locator(
            '[data-testid=comment-control-panel]')
        const numCommentsLoaded = await commentControlPanelLocator.count()
        for (let i = 0; i < numCommentsLoaded; i++) {
            await expect(commentControlPanelLocator.nth(i).locator(
                '[data-testid=comment-delete-button]')).toBeVisible()
        }
    })
})