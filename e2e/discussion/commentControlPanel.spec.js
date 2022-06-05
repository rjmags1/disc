const { test, expect } = require('@playwright/test')
const {
    login, 
    TESTUSER_REGISTERED,
    TESTUSER_STAFF
} = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')

test.beforeEach(async ({ page, isMobile }, { title: testTitle }) => {
    let userToLogin
    if (testTitle === 'staff user - endorse btn') userToLogin = TESTUSER_STAFF
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