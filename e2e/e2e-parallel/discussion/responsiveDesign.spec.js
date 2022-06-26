const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../../lib/auth')
const { TEST_COURSE_INFO } = require('../../lib/course')
const breakpoints = require('../../lib/layout')

const REGULAR_POSTS_PER_PAGE = 25
const PINNED_OR_ANNOUNCEMENT = 6
const INITIAL_LOAD_POSTS = REGULAR_POSTS_PER_PAGE + PINNED_OR_ANNOUNCEMENT
const largeScreen = {
    width: breakpoints.LARGE_MEDIA_BREAKPOINT,
    height: 900
}
const mediumScreen = {
    width: breakpoints.MEDIUM_MEDIA_BREAKPOINT,
    height: 900
}
const smallScreen = {
    width: breakpoints.SMALL_MEDIA_BREAKPOINT,
    height: 900
}

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)
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

    const postInfoLocator = page.locator("[data-testid=post-info-container]")
    let loadedPosts = await postInfoLocator.count()
    let initialLoadComplete = loadedPosts === INITIAL_LOAD_POSTS
    while (!initialLoadComplete) {
        loadedPosts = await postInfoLocator.count()
        initialLoadComplete = loadedPosts === INITIAL_LOAD_POSTS
    }
})

test.describe('discussion page responsive design, large screen', async () => {
    test.use({ viewport: largeScreen })
    test('all three sections visible on large screen', 
    async ({ page, isMobile }) => {
        if (isMobile) return

        const categoriesVisible = (
            await page.locator('[data-testid=category-pane-container]')
            .isVisible())
        const postInfoVisible = (
            await page.locator('[data-testid=post-info-container]').nth(0)
            .isVisible())
        const postVisible = await (
            page.locator('[data-testid=post-container]')
            .isVisible())
        expect([
            categoriesVisible, postInfoVisible, postVisible
        ].every(pane => pane)).toBe(true)
    })

    test('post display disappears on medium or smaller screens', 
    async ({ page, isMobile }) => {
        if (isMobile) return

        const postLocator = page.locator('[data-testid=post-container]')
        await expect(postLocator).toBeVisible()
        await Promise.all([
            page.setViewportSize(mediumScreen),
            postLocator.waitFor({ state: 'hidden' })
        ])
    })

    test('category hamburger appears, pane disappears on small screen', 
    async ({ page, isMobile }) => {
        if (isMobile) return

        const categoryHamburgerLocator = page.locator(
            '[data-testid=category-menu-hamburger]')
        const categoryPaneLocator = page.locator(
            '[data-testid=category-pane-container]')
        await expect(categoryHamburgerLocator).not.toBeVisible()
        await Promise.all([
            page.setViewportSize(smallScreen),
            categoryHamburgerLocator.waitFor({ state: 'visible' }),
            categoryPaneLocator.waitFor({ state: 'hidden' })
        ])
    })

    test('post listings pane takes up full screen on small screens', 
    async ({ page, isMobile }) => {
        if (isMobile) return

        await Promise.all([
            page.setViewportSize(smallScreen),
            page.locator(
                '[data-testid=category-pane-container]').waitFor(
                    { state: 'hidden' }),
            page.locator(
                '[data-testid=post-container]').waitFor(
                    { state: 'hidden' }),
            page.locator('[data-testid=post-listings-pane-container]').waitFor(
                { state: 'visible' }),
            page.locator('[data-testid=filter-container]').waitFor(
                { state: 'visible' })
        ])
    })

    test('post listings pane, category pane visible on medium screens', 
    async ({ page, isMobile }) => {
        if (isMobile) return

        const categoryPaneLocator = page.locator(
            '[data-testid=category-pane-container]')
        const postListingsPaneLocator = page.locator(
            '[data-testid=post-listings-pane-container]')
        await Promise.all([
            page.setViewportSize(mediumScreen),
            page.locator('[data-testid=post-container]').waitFor(
                { state: 'hidden' }),
            postListingsPaneLocator.waitFor({ state: 'visible' }),
            categoryPaneLocator.waitFor({ state: 'visible' })
        ])
        let categoryPaneBB = await categoryPaneLocator.boundingBox()
        while (categoryPaneBB.width !== 180) {
            categoryPaneBB = await categoryPaneLocator.boundingBox()
        }
        expect(categoryPaneBB.width).toBe(180)
        const htmlBB = await page.locator('html').boundingBox()
        const postListingsBB = await postListingsPaneLocator.boundingBox()
        expect(htmlBB.width - postListingsBB.width).toBe(180)
    })
})