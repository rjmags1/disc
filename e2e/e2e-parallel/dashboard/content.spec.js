const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../../lib/auth')
const {
    getPageTermHeaders,
    getEnrolledTermsFromDbAsSet,
    getPageCoursesAsSet,
    getDbCoursesAsSet
} = require('./lib')

const SEASON_PRIORITY = {
    Fall: 1,
    Summer: 2,
    Spring: 3,
    Winter: 4
}

test.beforeEach(async ({ page }) => {
    await login(page, TESTUSER_REGISTERED)

    await expect(page.locator('nav').
        locator('text=/dashboard/i')).toBeVisible()
})

test.describe('dashboard page content', async () => {


    test('terms listed in reverse chronological order', async ({ page }) => {
        const termHeaders = await getPageTermHeaders(page)
        
        const termHeadersRevChronSorted = termHeaders.slice().sort(
            (term1, term2) => {
                const [season1, year1] = term1.split(" ")
                const [season2, year2] = term2.split(" ")
                return year1 === year2 ?
                    SEASON_PRIORITY[season1] - SEASON_PRIORITY[season2] :
                    year2 - year1
            }
        )

        expect(termHeaders).toEqual(termHeadersRevChronSorted)
    })


    test('all enrolled terms shown on page', async ({ page }) => {
        let dbTermsSet
        try {
            dbTermsSet = await getEnrolledTermsFromDbAsSet()
        }
        catch (error) {
            throw new Error(error.message)
        }
        
        const pageTerms = await getPageTermHeaders(page)
        const pageTermsSet = new Set(pageTerms)

        expect(dbTermsSet).toEqual(pageTermsSet)
    })


    test('all enrolled courses on page, associated with correct term',
    async ({ page }) => {
        const pageCourses = await getPageCoursesAsSet(page)
        const dbCourses = await getDbCoursesAsSet()
        expect(pageCourses).toEqual(dbCourses)
    })
})