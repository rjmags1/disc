const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    loadAllPosts,
    checkIfAttributeSelected,
    selectAnAttribute,
    dbUnreadContent,
    assertDbRowMatchPagePostText,
    openAttributeFilter,
    closeAttributeFilter,
    getDbRowsDisplayedToUser
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

test.describe('post listings pane attribute filter', async () => {
    test.slow()
    test('all options displays all posts', async ({ page }) => {
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator(
            "[data-testid=post-info-container]")
        await loadAllPosts(page)

        await openAttributeFilter(page)
        const allSelected = (
            await checkIfAttributeSelected("All", attributeLocator))
        expect(allSelected).toBe(true)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const numDisplayedPagePosts = await postInfoLocator.count()
        expect(displayedDbRows.length).toBe(numDisplayedPagePosts)
    })


    test('unread option displays all unread posts', async ({ page }) => {
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unread", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unread", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const unreadDbRows = displayedDbRows.filter(
            row => dbUnreadContent(row))
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numUnreadDots = await postInfoLocator.locator(
            "[data-testid=unread-content-dot]").count()
        expect(unreadDbRows.length).toBe(numDisplayedPagePosts)
        expect(numUnreadDots).toBe(numDisplayedPagePosts)
            
        for (let i = 0; i < unreadDbRows.length; i++) {
            const dbRow = unreadDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('unanswered options filters all unanswered posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator("[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unanswered", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unanswered", attributeLocator)
        await closeAttributeFilter(page)

        const greenCheckLocator = page.locator(
            "[data-testid=green-checkmark-icon]")
        const greenChecks = await greenCheckLocator.count()
        expect(greenChecks).toBe(0)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId) 
        const unansweredDbRows = displayedDbRows.filter(
            row => row.is_question && !row.answered)
        const numDisplayedPagePosts = await postInfoLocator.count()
        expect(unansweredDbRows.length).toBe(numDisplayedPagePosts)

        for (let i = 0; i < unansweredDbRows.length; i++) {
            const dbRow = unansweredDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('unresolved option filters all unresolved posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Unresolved", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Unresolved", attributeLocator)
        await closeAttributeFilter(page)

        const greenCheckLocator = page.locator(
            "[data-testid=green-checkmark-icon]")
        const greenChecks = await greenCheckLocator.count()
        expect(greenChecks).toBe(0)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)  
        const unresolvedDbRows = displayedDbRows.filter(
            row => !row.is_question && !row.resolved)
        const numDisplayedPagePosts = await postInfoLocator.count()
        expect(unresolvedDbRows.length).toBe(numDisplayedPagePosts)

        for (let i = 0; i < unresolvedDbRows.length; i++) {
            const dbRow = unresolvedDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            expect(thisPostInfoInnerText).toMatch(dbRow.title)
        }
    })


    test('endorsed option filters all endorsed posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Endorsed", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Endorsed", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const starredDbRows = displayedDbRows.filter(
            row => row.endorsed)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numEndorsedIcons = await page.locator(
            "[data-testid=endorsed-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numEndorsedIcons)

        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('watching option filters all user-watched posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Starred", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Starred", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const starredDbRows = displayedDbRows.filter(
            row => !!row.watch_id)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStarredIcons = await page.locator(
            "[data-testid=watching-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStarredIcons)

        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('starred option filters all user-starred posts', 
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Starred", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Starred", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId) 
        const starredDbRows = displayedDbRows.filter(
            row => !!row.star_id)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStarredIcons = await page.locator(
            "[data-testid=star-icon]").count()
        expect(starredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStarredIcons)

        for (let i = 0; i < starredDbRows.length; i++) {
            const dbRow = starredDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('private option filters all user-authored private posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Private", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Private", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId) 
        const privateDbRows = displayedDbRows.filter(
            row => row.private)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPrivateBanners = await page.locator(
            "[data-testid=private-banner]").count()
        const userAuthoredPrivateDbRows = privateDbRows.reduce((val, row) => (
                val += row.user_id === TESTUSER_REGISTERED.userId ? 1 : 0), 
            initialValue=0)
        expect(userAuthoredPrivateDbRows).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numPrivateBanners)

        for (let i = 0; i < privateDbRows.length; i++) {
            const dbRow = privateDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('public option filters all non-user-authored-private posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Public", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Public", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const publicDbRows = displayedDbRows.filter(
            row => !row.private)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPrivateBanners = await page.locator(
            "[data-testid=private-banner]").count()
        expect(publicDbRows.length).toBe(numDisplayedPagePosts)
        expect(numPrivateBanners).toBe(0)

        for (let i = 0; i < publicDbRows.length; i++) {
            const dbRow = publicDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })


    test('staff option filters all staff-authored posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Staff", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Staff", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const staffDbRows = displayedDbRows.filter(
            row => row.author_is_staff || row.author_is_instructor)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numStaffBanners = await page.locator(
            "[data-testid=staff-banner]").count()
        expect(staffDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numStaffBanners)

        for (let i = 0; i < staffDbRows.length; i++) {
            const dbRow = staffDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })

    test('mine option filters all user-authored posts',
    async ({ page }) => {
        const attributeFilterButtonLocator = page.locator(
            "[data-testid=attributes-dropdown-button]")
        const attributeLocator = page.locator(
            "[data-testid=post-attribute-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        await loadAllPosts(page)

        await selectAnAttribute("Mine", page)
        await attributeFilterButtonLocator.click()
        await checkIfAttributeSelected("Mine", attributeLocator)
        await closeAttributeFilter(page)

        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId) 
        const testUserAuthoredDbRows = displayedDbRows.filter(
            row => row.user_id === TESTUSER_REGISTERED.userId)
        const numDisplayedPagePosts = await postInfoLocator.count()
        const numPageTestUserAuthoredPosts = await postInfoLocator.locator(
            `text=${ TESTUSER_REGISTERED.fullName }`).count()
        expect(testUserAuthoredDbRows.length).toBe(numDisplayedPagePosts)
        expect(numDisplayedPagePosts).toBe(numPageTestUserAuthoredPosts)

        // match filtered page posts to those of db on title to be sure
        for (let i = 0; i < testUserAuthoredDbRows.length; i++) {
            const dbRow = testUserAuthoredDbRows[i]
            const thisPostInfoInnerText = (
                await postInfoLocator.nth(i).innerText())
            await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
        }
    })
})