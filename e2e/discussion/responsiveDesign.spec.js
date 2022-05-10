const { test, expect } = require('@playwright/test')
const { login, TESTUSER_REGISTERED } = require('../lib/auth')
const { TEST_COURSE_INFO } = require('../lib/course')
const breakpoints = require('../lib/layout')

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
})

test.describe('discussion page responsive design', async () => {
    test('all three sections visible on large screen', async () => {
        expect(true).toBe(true)
    })

    //test('post display disappears after large breakpoint', async ({ page }) => {
    //})

    //test('category hamburger appears on medium screen', async ({ page }) => {
    //})

    //test('category menu disappears on small screens', async ({ page }) => {
    //}) 

    //test('post listings pane takes up full screen on small screens', 
    //async ({ page }) => {
    //})

    //test('post listings pane takes up remainder of screen on medium screens', 
    //async ({ page }) => {
    //})
})