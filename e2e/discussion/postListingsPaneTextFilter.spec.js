const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { 
    assertDbRowMatchPagePostText,
    getDbRowsDisplayedToUser,
    loadAllPosts
} = require('../lib/postListings')
const { getPageCourseCategories } = require('../lib/categories')

const REGULAR_POSTS_PER_PAGE = 25
const PINNED_OR_ANNOUNCEMENT = 6
const INITIAL_LOAD_POSTS = REGULAR_POSTS_PER_PAGE + PINNED_OR_ANNOUNCEMENT
const UNMATCHED_STRING = "asdfqwertynonsense"


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


test.describe('post listings pane text filter', async () => {
    test('filter by author', async ({ page }) => {
        const testStrings = [
            "Harry Potter", "Albus Dumbledore", UNMATCHED_STRING]
        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)

        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.f_name } ${ row.l_name }`)))
            if (testString === UNMATCHED_STRING) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const thisPostInfoInnerText = (
                    await postInfoLocator.nth(i).innerText())
                expect(`${ dbRow.f_name } ${ dbRow.l_name }`).
                    toMatch(testStringRegex)
                await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
            }
        }
    })


    test('filter by category', async ({ page }) => {
        const pageCategories = await getPageCourseCategories(page)
        const testStrings = [...pageCategories, UNMATCHED_STRING]
        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        
        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.category_name }`)))
            if (testString === UNMATCHED_STRING) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const thisPostInfoInnerText = (
                    await postInfoLocator.nth(i).innerText())
                expect(dbRow.category_name).toMatch(testStringRegex)
                await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
            }
        }
    })


    test('filter by post title', async ({ page }) => {
        const displayedDbRows = await getDbRowsDisplayedToUser(
            TEST_COURSE_INFO.courseId, TESTUSER_REGISTERED.userId)
        const randomDbTitles = (new Array(3)).fill(null).map(_ =>
            displayedDbRows[
                Math.floor(Math.random() * displayedDbRows.length)].title)
        const testStrings = [...randomDbTitles, UNMATCHED_STRING]
    
        await loadAllPosts(page)
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        for (const testString of testStrings) {
            await textFilterInputLocator.fill(testString)
            const numPageFiltered = await postInfoLocator.count()
            const testStringRegex = new RegExp(testString)
            const filteredDb = displayedDbRows.filter(
                row => (testStringRegex.test(`${ row.title }`)))
            if (testString === UNMATCHED_STRING) {
                expect(numPageFiltered).toBe(0)
                expect(filteredDb.length).toBe(0)
                continue
            }

            for (let i = 0; i < numPageFiltered; i++) {
                const dbRow = filteredDb[i]
                const thisPostInfoInnerText = (
                    await postInfoLocator.nth(i).innerText())
                expect(dbRow.title).toMatch(testStringRegex)
                await assertDbRowMatchPagePostText(dbRow, thisPostInfoInnerText)
            }
        }
    })


    test('no pinned posts match search text -> pinned header hidden', 
    async ({ page }) => {
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        await textFilterInputLocator.fill(UNMATCHED_STRING)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const filteredPosts = await postInfoLocator.count()
        const pinnedHeaderVisible = await page.locator("text=PINNED").isVisible()
        expect(filteredPosts).toBe(0)
        expect(pinnedHeaderVisible).toBe(false)
    })


    test('no announcements match search text -> announcements header hidden',
    async ({ page }) => {
        const textFilterInputLocator = page.locator("[placeholder=Search]")
        await textFilterInputLocator.fill(UNMATCHED_STRING)
        const postInfoLocator = page.locator("[data-testid=post-info-container]")
        const filteredPosts = await postInfoLocator.count()
        const announcementsHeaderVisible = await page.locator(
            "text=ANNOUNCEMENTS").isVisible()
        expect(filteredPosts).toBe(0)
        expect(announcementsHeaderVisible).toBe(false)
    })
})