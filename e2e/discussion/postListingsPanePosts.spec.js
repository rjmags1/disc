const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    loadAllPosts,
    timestamp1LteTimestamp2,
    dbPrivateFilter,
    getAllNonDeletedDbPostsInPageOrder,
    postOrderPinnedOrAnnBreak,
    assertDbRowMatchPagePostText,
    assertDbRowMatchPagePost_St_AR_En_Wa_Pi_An,
    assertDbRowMatchesPagePostLikesComments
} = require('../lib/postListings')

const REGULAR_POSTS_PER_PAGE = 25
const PINNED_OR_ANNOUNCEMENT = 6
const INITIAL_LOAD_POSTS = REGULAR_POSTS_PER_PAGE + PINNED_OR_ANNOUNCEMENT


test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)
    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()

    const { term, code, section, name: testCourseName } = TEST_COURSE_INFO
    await Promise.all([
        page.locator(`text=/${ testCourseName }/i`).click(),
        page.waitForSelector(`text=/${ testCourseName } - ${ term }/i`)
    ])
    const title = await page.title()
    expect(title).toMatch(new RegExp(
        `${ term } ${ code }-${ section } - Discussion`, "i"))

    const postInfoLocator = page.locator("[data-testid=post-info-container]")
    let loadedPosts = await postInfoLocator.count()
    let initialLoadComplete = loadedPosts === INITIAL_LOAD_POSTS
    while (!initialLoadComplete) {
        loadedPosts = await postInfoLocator.count()
        initialLoadComplete = loadedPosts === INITIAL_LOAD_POSTS
    }
})

test.describe('post listings pane content', async () => {
    test.slow()

    test('post listings ui timestamps have descending chronological order',
    async ({ page }) => {
        await loadAllPosts(page)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const displayedPosts = await postInfoLocator.count()

        for (let i = 0; i < displayedPosts - 1; i++) {
            const validOrderBreak = (
                await postOrderPinnedOrAnnBreak(postInfoLocator, i))
            if (validOrderBreak) continue

            const timestamp1 = await postInfoLocator.nth(i).locator(
                "text=/\\d+ [a-z]+ ago/").innerText()
            const timestamp2 = await postInfoLocator.nth(i + 1).locator(
                "text=/^\\d+ [a-z]+ ago$/").innerText()
            let [units1, timeUnit1] = timestamp1.split(" ")
            let [units2, timeUnit2] = timestamp2.split(" ")
            expect(timestamp1LteTimestamp2(
                [units1, timeUnit1], [units2, timeUnit2])).toBe(true)
        }
    })


    test(`correct posts loaded in order on each successive load -- 
            match to db on title, category, author, timestamp`, 
    async ({ page }) => {
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const loadMorePostsBtnLocator = page.locator(
            "[data-testid=load-more-posts-button]")
        const noMorePostsLocator = page.locator("text=/no more posts/i")

        let hiddenOffset = 0, i = 0
        for (; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const needLoadMore = await thisPostInfoLocator.isHidden()
            if (needLoadMore) {
                const alreadyLoadedAll = await noMorePostsLocator.isVisible()
                if (alreadyLoadedAll) break
                await loadMorePostsBtnLocator.click()
            }

            const pagePostInnerText = await thisPostInfoLocator.innerText()
            await assertDbRowMatchPagePostText(dbRow, pagePostInnerText)
        }
        
        expect(i - hiddenOffset).toBe(dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId)).length)
    })


    test('post listings ui reflects if post is question or normal post',
    async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }
            
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const visibleQuestionIcon = await thisPostInfoLocator.locator(
                "[data-testid=question-icon]").isVisible()
            const visibleNormalPostIcon = await thisPostInfoLocator.locator(
                "[data-testid=normal-post-icon]").isVisible()
            expect(visibleQuestionIcon).toBe(dbRow.is_question)
            expect(visibleNormalPostIcon).toBe(!dbRow.is_question)
        }
    })


    test('post listings ui reflects unread content', async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }
            
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const dbUnreadContent = !dbRow.last_viewed_at || (
                Date.parse(dbRow.latest_comment_time) > 
                Date.parse(dbRow.last_viewed_at)
            )
            const unreadContentIconVisible = await thisPostInfoLocator.locator(
                "[data-testid=unread-content-dot]").isVisible()
            expect(dbUnreadContent).toBe(unreadContentIconVisible)
        }
    })


    test('post listings ui shows staff banner for relevant post authors',
    async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }
            
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const shouldHaveStaffBanner = (
                dbRow.author_is_instructor || dbRow.author_is_staff)
            const staffBannerDisplayed = await thisPostInfoLocator.locator(
                "[data-testid=staff-banner]").isVisible()
            expect(shouldHaveStaffBanner).toBe(staffBannerDisplayed)
        }
    })


    test(`post listings ui marks starred, answered/resolved, endorsed, 
        watched, pinned, announcement posts correctly on when loaded`,
    async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }
            
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            await assertDbRowMatchPagePost_St_AR_En_Wa_Pi_An(
                dbRow, thisPostInfoLocator)
        }
    })


    test(`post listings ui displays only private posts with user as author,
        with private banner`, 
    async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const privateBannerLocator = thisPostInfoLocator.locator(
                "[data-testid=private-banner]")
            const privateBannerVisible = await privateBannerLocator.isVisible()
            if (dbRow.private) {
                if (dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                    hiddenOffset++ // private posts hidden unless user-authored
                }
                else {
                    expect(privateBannerVisible).toBe(true)
                    const pagePostText = await thisPostInfoLocator.innerText()
                    expect(pagePostText).toMatch(new RegExp(
                        `${ dbRow.f_name } ${ dbRow.l_name }`))
                }
                continue
            }

            expect(privateBannerVisible).toBe(false)
        }
    })


    test('post listings ui displays correct number of comments and likes',
    async ({ page }) => {
        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++ // private posts hidden unless user-authored
                continue
            }

            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            await assertDbRowMatchesPagePostLikesComments(
                dbRow, thisPostInfoLocator)
        }
    })
})