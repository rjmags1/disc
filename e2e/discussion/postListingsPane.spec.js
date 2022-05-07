const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    getPageCourseCategories,
    getDbCoursePostsRevChronOrder, 
    getPinnedFromDbRows,
    getAnnouncementsFromDbRows, 
    getNonPinnedNonAnnouncementFromDbRows,
    loadAllPosts,
    timestamp1LteTimestamp2,
    dbPrivateFilter,
    getAllNonDeletedDbPostsInPageOrder,
    checkIfAttributeSelected,
    selectAnAttribute,
    dbUnreadContent
} = require('./lib')
const time = require('../lib/time')

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
        page.waitForSelector(`text=/${ term } ${ testCourseName }/i`)
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
    test('post listings ui timestamps descending chronological order',
    async ({ page }) => {
        test.slow()
        await loadAllPosts(page)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const displayedPosts = await postInfoLocator.count()
        for (let i = 0; i < displayedPosts - 1; i++) {
            const currPinned = await postInfoLocator.nth(i).locator(
                "[data-testid=pinned-icon]").isVisible()
            const currIsAnnouncement = await postInfoLocator.nth(i).locator(
                "[data-testid=announcement-icon]").isVisible()
            const nextIsAnnouncement = await postInfoLocator.nth(i + 1).locator(
                "[data-testid=announcement-icon]").isVisible()
                
            if (currPinned && nextIsAnnouncement) continue
            if (currIsAnnouncement && !nextIsAnnouncement) continue
            

            const timestamp1 = await postInfoLocator.nth(i).locator(
                "text=/\\d+ [a-z]+ ago/").innerText()
            let [units1, timeUnit1] = timestamp1.split(" ")
            const timestamp2 = await postInfoLocator.nth(i + 1).locator(
                "text=/^\\d+ [a-z]+ ago$/").innerText()
            let [units2, timeUnit2] = timestamp2.split(" ")
            if (timeUnit1[timeUnit1.length - 1] !== 's') timeUnit1 += 's'
            if (timeUnit2[timeUnit2.length - 1] !== 's') timeUnit2 += 's'
            expect(timestamp1LteTimestamp2(
                [units1, timeUnit1], [units2, timeUnit2])).toBe(true)
        }
    })


    test(`correct posts loaded in order on each successive load -- 
            match to db on title, category, author, timestamp`, 
    async ({ page }) => {
        test.slow()

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
                hiddenOffset++
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
            expect(pagePostInnerText).toMatch(new RegExp(`${ dbRow.title }`))
            expect(pagePostInnerText).toMatch(
                new RegExp(`${ dbRow.category_name }`))
            expect(pagePostInnerText).toMatch(
                new RegExp(`${ dbRow.f_name } ${ dbRow.l_name }`))
            const timestampFromFixedDbTime = time.toTimestampString(
                time.fixNodePgUTCTimeInterpretation(dbRow.created_at))
            expect(pagePostInnerText).toMatch(
                new RegExp(`${ timestampFromFixedDbTime }`))
        }
        
        expect(i - hiddenOffset).toBe(dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId)).length)
    })


    test('post listings ui reflects if post is question or normal post',
    async ({ page }) => {
        test.slow()

        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)

        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++
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
        test.slow()

        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)

        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++
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
        test.slow()

        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)

        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++
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
        watched, pinned, announcement posts`,
    async ({ page }) => {
        test.slow()

        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)

        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++
                continue
            }
            
            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const starVisible = await thisPostInfoLocator.locator(
                "[data-testid=star-icon]").isVisible()
            const checkmarkVisible = await thisPostInfoLocator.locator(
                "[data-testid=green-checkmark-icon]").isVisible()
            const endorsedVisible = await thisPostInfoLocator.locator(
                "[data-testid=endorsed-icon]").isVisible()
            const watchingVisible = await thisPostInfoLocator.locator(
                "[data-testid=watching-icon]").isVisible()
            const pinnedVisible = await thisPostInfoLocator.locator(
                "[data-testid=pinned-icon]").isVisible()
            const announcementVisible = await thisPostInfoLocator.locator(
                "[data-testid=announcement-icon]").isVisible()

            expect(starVisible).toBe(Boolean(dbRow.star_id))
            expect(checkmarkVisible).toBe(dbRow.resolved || dbRow.answered)
            expect(endorsedVisible).toBe(dbRow.endorsed)
            expect(watchingVisible).toBe(Boolean(dbRow.watch_id))
            expect(pinnedVisible).toBe(dbRow.pinned)
            expect(announcementVisible).toBe(dbRow.is_announcement)
        }
    })



    test(`post listings ui displays only private posts with user as author,
        with private banner`, 
    async ({ page }) => {
        test.slow()

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
                    hiddenOffset++
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
        test.slow()

        await loadAllPosts(page)
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        let hiddenOffset = 0
        for (let i = 0; i < dbRowsInPageOrder.length; i++) {
            const dbRow = dbRowsInPageOrder[i]
            if (dbRow.private && dbRow.user_id !== TESTUSER_REGISTERED.userId) {
                hiddenOffset++
                continue
            }

            const thisPostInfoLocator = postInfoLocator.nth(i - hiddenOffset)
            const commentsIconLocator = thisPostInfoLocator.locator(
                "[data-testid=comments-icon]")
            const likesIconLocator = thisPostInfoLocator.locator(
                "[data-testid=likes-icon]")

            const dbComments = parseInt(dbRow.comments, 10)
            if (dbComments === 0) {
                const commentsIconVisible = await commentsIconLocator.isVisible()
                expect(commentsIconVisible).toBe(false)
            }
            else {
                const numPageComments = await commentsIconLocator.innerText()
                expect(parseInt(numPageComments, 10)).toBe(dbComments)
            }
            const dbLikes = parseInt(dbRow.likes, 10)
            if (dbLikes === 0) {
                const likesIconVisible = await likesIconLocator.isVisible()
                expect(likesIconVisible).toBe(false)
            }
            else {
                const numPageLikes = await likesIconLocator.innerText()
                expect(parseInt(numPageLikes, 10)).toBe(dbLikes)
            }
        }
    })
})

test.describe('post listings pane text filter', async () => {
    test('filter by author', async ({ page }) => {
        const invalidAuthor = "asdfqwertynonsense"
        const testStrings = [
            "Harry Potter", "Albus Dumbledore", invalidAuthor]
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))

        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.f_name } ${ row.l_name }`)))

            if (testString === invalidAuthor) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const thisPostInfoLocator = postInfoLocator.nth(i)
                const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
                expect(thisPostInfoInnerText).toMatch(testStringRegex)
                expect(thisPostInfoInnerText).toMatch(dbRow.title)
                expect(thisPostInfoInnerText).toMatch(dbRow.category_name)
                expect(thisPostInfoInnerText).toMatch(time.toTimestampString(
                    time.fixNodePgUTCTimeInterpretation(dbRow.created_at)))
            }
            await textFilterInputLocator.fill("")
            const unfilteredNum = await postInfoLocator.count()
            expect(unfilteredNum).toBe(displayedDbRows.length)
        }
    })


    test('filter by category', async ({ page }) => {
        const pageCategories = await getPageCourseCategories(page)
        const invalidCategory = "asdfqwertynonsense"
        const testStrings = [...pageCategories, invalidCategory]
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        
        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.category_name }`)))

            if (testString === invalidCategory) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const author = `${ dbRow.f_name } ${ dbRow.l_name }`
                const thisPostInfoLocator = postInfoLocator.nth(i)
                const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
                expect(thisPostInfoInnerText).toMatch(testStringRegex)
                expect(thisPostInfoInnerText).toMatch(dbRow.title)
                expect(thisPostInfoInnerText).toMatch(author)
                expect(thisPostInfoInnerText).toMatch(time.toTimestampString(
                    time.fixNodePgUTCTimeInterpretation(dbRow.created_at)))
            }
            await textFilterInputLocator.fill("")
            const unfilteredNum = await postInfoLocator.count()
            expect(unfilteredNum).toBe(displayedDbRows.length)
        }
    })


    test('filter by post title', async ({ page }) => {
        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const randomDbRows = [
            displayedDbRows[Math.floor(Math.random()) * displayedDbRows.length],
            displayedDbRows[Math.floor(Math.random()) * displayedDbRows.length],
            displayedDbRows[Math.floor(Math.random()) * displayedDbRows.length],
        ]
        const pageTitles = randomDbRows.map(row => row.title)
        const invalidTitle = "asdfqwertynonsense"
        const testStrings = [...pageTitles, invalidTitle]
    
        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.title }`)))

            if (testString === invalidTitle) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const author = `${ dbRow.f_name } ${ dbRow.l_name }`
                const thisPostInfoLocator = postInfoLocator.nth(i)
                const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
                expect(thisPostInfoInnerText).toMatch(testStringRegex)
                expect(thisPostInfoInnerText).toMatch(dbRow.category_name)
                expect(thisPostInfoInnerText).toMatch(author)
                expect(thisPostInfoInnerText).toMatch(time.toTimestampString(
                    time.fixNodePgUTCTimeInterpretation(dbRow.created_at)))
            }
            await textFilterInputLocator.fill("")
            const unfilteredNum = await postInfoLocator.count()
            expect(unfilteredNum).toBe(displayedDbRows.length)
        }
    })


    test('no pinned posts match search text -> pinned header hidden', 
    async ({ page }) => {
        const nothingWillMatch = "asdfqwertynonsense"
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        await textFilterInputLocator.fill(nothingWillMatch)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const filteredPosts = await postInfoLocator.count()
        const pinnedHeaderVisible = await page.locator("text=PINNED").isVisible()
        expect(filteredPosts).toBe(0)
        expect(pinnedHeaderVisible).toBe(false)
    })


    test('no announcements match search text -> announcements header hidden',
    async ({ page }) => {
        const nothingWillMatch = "asdfqwertynonsense"
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        await textFilterInputLocator.fill(nothingWillMatch)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const filteredPosts = await postInfoLocator.count()
        const announcementsHeaderVisible = await page.locator(
            "text=ANNOUNCEMENTS").isVisible()
        expect(filteredPosts).toBe(0)
        expect(announcementsHeaderVisible).toBe(false)
    })
})


test.describe('post listings pane attribute filter', async () => {
    test('all options displays all posts', async ({ page }) => {
        test.slow()

        await loadAllPosts(page)
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        await attributeFilterButtonLocator.click()
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        let dropdownShowing = await dropdownLocator.isVisible()
        expect(dropdownShowing).toBe(true)
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const allSelected = (
            await checkIfAttributeSelected("All", attributeLocator))
        expect(allSelected).toBe(true)

        await attributeFilterButtonLocator.click()
        dropdownShowing = await dropdownLocator.isVisible()
        expect(dropdownShowing).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()

        expect(displayedDbRows.length).toBe(numDisplayedPagePosts)
    })


    test('unread option displays all unread posts', async ({ page }) => {
        test.slow()

        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unread", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unread", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const unreadDbRows = displayedDbRows.filter(
            row => dbUnreadContent(row))
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numUnreadDots = await postInfoLocator.locator(
            "[data-testid=unread-content-dot]").count()
        expect(unreadDbRows.length).toBe(numDisplayedPagePosts)
        expect(numUnreadDots).toBe(numDisplayedPagePosts)
            
        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < unreadDbRows.length; i++) {
            const dbRow = unreadDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('unanswered options filters all unanswered posts', 
    async ({ page }) => {
        test.slow()

        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unanswered", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unanswered", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const greenCheckLocator = page.locator(
            "[data-testid=green-checkmark-icon]")
        const greenChecks = await greenCheckLocator.count()
        expect(greenChecks).toBe(0)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const unansweredDbRows = displayedDbRows.filter(
            row => row.is_question && !row.answered)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        expect(unansweredDbRows.length).toBe(numDisplayedPagePosts)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < unansweredDbRows.length; i++) {
            const dbRow = unansweredDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('unresolved option filters all unresolved posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unresolved", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unresolved", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const greenCheckLocator = page.locator(
            "[data-testid=green-checkmark-icon]")
        const greenChecks = await greenCheckLocator.count()
        expect(greenChecks).toBe(0)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const unresolvedDbRows = displayedDbRows.filter(
            row => !row.is_question && !row.resolved)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        expect(unresolvedDbRows.length).toBe(numDisplayedPagePosts)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < unresolvedDbRows.length; i++) {
            const dbRow = unresolvedDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('endorsed option filters all endorsed posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Endorsed", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Endorsed", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const starredDbRows = displayedDbRows.filter(
            row => row.endorsed)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numEndorsedIcons = await page.locator(
            "[data-testid=endorsed-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numEndorsedIcons)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('watching option filters all user-watched posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Starred", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Starred", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const starredDbRows = displayedDbRows.filter(
            row => !!row.watch_id)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStarredIcons = await page.locator(
            "[data-testid=watching-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStarredIcons)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('starred option filters all user-starred posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Starred", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Starred", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const starredDbRows = displayedDbRows.filter(
            row => !!row.star_id)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStarredIcons = await page.locator(
            "[data-testid=star-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStarredIcons)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('private option filters all user-authored private posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Private", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Private", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const privateDbRows = displayedDbRows.filter(
            row => row.private)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPrivateBanners = await page.locator(
            "[data-testid=private-banner]").count()
        expect(privateDbRows.reduce(
            (val, row) => (
                val += row.user_id === TESTUSER_REGISTERED.userId ? 1 : 0), 
            initialValue=0)
        ).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numPrivateBanners)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < privateDbRows.length; i++) {
            const dbRow = privateDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('public option filters all non-user-authored-private posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Public", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Public", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const publicDbRows = displayedDbRows.filter(
            row => !row.private)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPrivateBanners = await page.locator(
            "[data-testid=private-banner]").count()
        expect(publicDbRows.length).toBe(numDisplayedPagePosts)
        expect(numPrivateBanners).toBe(0)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < publicDbRows.length; i++) {
            const dbRow = publicDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('staff option filters all staff-authored posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Staff", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Staff", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const staffDbRows = displayedDbRows.filter(
            row => row.author_is_staff || row.author_is_instructor)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStaffBanners = await page.locator(
            "[data-testid=staff-banner]").count()
        expect(staffDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStaffBanners)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < staffDbRows.length; i++) {
            const dbRow = staffDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })

    test('mine option filters all user-authored posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const dropdownLocator = page.locator(
            "[data-testid=post-attributes-dropdown-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Mine", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Mine", attributeLocator)

        await attributeFilterButtonLocator.click()
        const dropdownVisible = await dropdownLocator.isVisible()
        expect(dropdownVisible).toBe(false)

        const dbRowsInPageOrder = await getAllNonDeletedDbPostsInPageOrder(
            TEST_COURSE_INFO.courseId)
        const displayedDbRows = dbRowsInPageOrder.filter(
            row => dbPrivateFilter(row, TESTUSER_REGISTERED.userId))
        const testUserAuthoredDbRows = displayedDbRows.filter(
            row => row.user_id === TESTUSER_REGISTERED.userId)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPageTestUserAuthoredPosts = await postInfoLocator.locator(
            `text=${ TESTUSER_REGISTERED.fullName }`).count()
        expect(testUserAuthoredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numPageTestUserAuthoredPosts)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < testUserAuthoredDbRows.length; i++) {
            const dbRow = testUserAuthoredDbRows[i]
            const thisPostInfoLocator = postInfoLocator.nth(i)
            const thisPostInfoInnerText = await thisPostInfoLocator.innerText()
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })
})