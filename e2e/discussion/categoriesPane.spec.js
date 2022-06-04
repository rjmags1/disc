const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const { RAINBOW_HEX } = require('../lib/colors')
const { 
    getDbCourseCategories, 
    getPageCourseCategories, 
    hexToRgbStr,
    showCategoryPaneIfNecessary,
    hideCategoryPaneIfPossible, 
    testEachCategoryFilter,
    testGroupedCategoryFilters,
    toggleCategoryStyleAssert
} = require('../lib/categories')
const { loadAllPosts } = require('../lib/postListings')


test.beforeEach(async ({ page }) => {
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

    await showCategoryPaneIfNecessary(page)
})

test.describe('categories pane content', async () => {
    test('category header and course categories', 
    async ({ page }) => {
        const categoryPaneLocator = page.locator(
            "[data-testid=category-pane-container]") 

        // assert on categories header
        await expect(categoryPaneLocator.locator(
            "text=/categories/i")).toBeVisible()

        // assert on categories
        const dbCategories = await getDbCourseCategories()
        const pageCategories = await getPageCourseCategories(categoryPaneLocator)
        
        expect(new Set(dbCategories)).toEqual(new Set(pageCategories))
    })


    test('all category headers have bullets', async ({ page }) => {
        const categoryPaneLocator = page.locator(
            "[data-testid=category-pane-container]")
        const numCategoryContainers = await categoryPaneLocator.locator(
            "[data-testid=category-header-container]").count()
        const numBullets = await categoryPaneLocator.locator(
            "[data-testid=category-bullet]").count()
        
        expect(numCategoryContainers).toBe(numBullets)
    })


    test('category bullets have RAINBOW_HEX colors', async ({ page }) => {
        const categoryPaneLocator = page.locator(
            "[data-testid=category-pane-container]")
        const numBullets = await categoryPaneLocator.locator(
            "[data-testid=category-bullet]").count()

        for (let i = 0; i < numBullets; i++) {
            const bulletLocator = categoryPaneLocator.locator(
                `[data-testid=category-bullet] >> nth=${ i }`)
            const bulletStyle = await bulletLocator.getAttribute("style")

            const bulletColorInHex = RAINBOW_HEX[i]
            const bulletColorInRgb = hexToRgbStr(bulletColorInHex)
            const expectedBgc = `background-color: ${ bulletColorInRgb };`
            
            expect(bulletStyle.includes(expectedBgc)).toBe(true)
        }
    })
})

test.describe('categories pane filter action', async () => {
    test('clicking on category causes header appearance change', 
    async ({ page }) => {
        const categoryPaneLocator = page.locator(
            "[data-testid=category-pane-container]")
        const numCategoryContainers = await categoryPaneLocator.locator(
            "[data-testid=category-header-container]").count()

        for (let i = 0; i < numCategoryContainers; i++) {
            const categoryHeaderLocator = categoryPaneLocator.locator(
                `[data-testid=category-header-container] >> nth=${ i }`)

            await toggleCategoryStyleAssert(categoryHeaderLocator)
        }
    })

    test('clicking on category causes filter action', async ({ page }) => {
        test.slow()
        const categoryPaneLocator = page.locator(
            "[data-testid=category-pane-container]")
        const postInfoLocator = page.locator("[data-testid=post-info-container]")

        await hideCategoryPaneIfPossible(page) 

        // make sure initial posts are loaded then load the rest of them
        await page.waitForSelector("[data-testid=post-info-container] >> nth=0")
        await loadAllPosts(page)
        
        await showCategoryPaneIfNecessary(page)

        // get categories for course from page
        const pageCategories = await getPageCourseCategories(categoryPaneLocator)

        // count posts per category
        const counts = {}
        for (const category of pageCategories) {
            const postByCategoryLocator = postInfoLocator.locator(
                `text=${ category }`)
            counts[category] = await postByCategoryLocator.count()
        }

        // test category filter one by one
        await testEachCategoryFilter(page, pageCategories, counts)

        // test category filter, selecting one by one until all selected
        await testGroupedCategoryFilters(page, pageCategories, counts) 
    })
})