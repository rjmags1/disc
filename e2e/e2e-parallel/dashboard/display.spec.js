const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../../lib/auth')
const { getPageCoursesAsSet, getDbCoursesAsSet } = require('./lib')

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)

    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()
})

test.describe('dashboard page small display', async () => {
    test.use({
        viewport: { // iphone 11 dimensions
            width: 375,
            height: 812
        }
    })

    test('all enrolled courses on page in small viewport', 
    async ({ page }) => {
        const pageCoursesAsSet = await getPageCoursesAsSet(page)
        const dbCoursesAsSet = await getDbCoursesAsSet()
        expect(pageCoursesAsSet).toEqual(dbCoursesAsSet)
    })
})
    
test.describe('dashboard page medium display', async () => {
    test.use({
        viewport: { // ipad dimensions
            width: 810,
            height: 1080
        }
    })

    test('all enrolled courses on page in medium viewport', 
    async ({ page }) => {
        const pageCoursesAsSet = await getPageCoursesAsSet(page)
        const dbCoursesAsSet = await getDbCoursesAsSet()
        expect(pageCoursesAsSet).toEqual(dbCoursesAsSet)
    })
})