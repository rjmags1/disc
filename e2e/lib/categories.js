const { TEST_COURSE_INFO } = require('../lib/course')
const { query } = require('../lib/db')
const { expect } = require('@playwright/test')

const getDbCourseCategories = async () => {
    const categoriesQueryText = `
        SELECT name FROM post_category WHERE course = $1;`
    const categoriesQueryParams = [TEST_COURSE_INFO.courseId]
    const categoriesQuery = await query(
        categoriesQueryText, categoriesQueryParams)

    const dbCategories = categoriesQuery.rows.map(row => row.name)

    if (dbCategories.length === 0) {
        throw new Error("dbCategories.length === 0")
    }
    return dbCategories
}


const getPageCourseCategories = async (paneLocator) => {
    const numCategories = await paneLocator.locator(
        "[data-testid=category-header-container]").count()
    
    const categoriesPromises = []
    for (let i = 0; i < numCategories; i++) {
        const categoryPromise = paneLocator.locator(
            `[data-testid=category-header-container] >> nth=${ i }`).innerText()
        categoriesPromises.push(categoryPromise)
    }
    const categories = await Promise.all(categoriesPromises)

    return categories.map(
        category => /\n/i.test(category) ? category.slice(0, -1) : category)
}

const hexToRgbStr = (hexStr) => {
    const red = parseInt(hexStr.slice(1, 3), 16) 
    const green = parseInt(hexStr.slice(3, 5), 16)
    const blue = parseInt(hexStr.slice(5, 7), 16)
    return `rgb(${ red }, ${ green }, ${ blue })`
}

const showCategoryPaneIfNecessary = async (page) => {
    const categoryPaneLocator = page.locator(
        "[data-testid=category-pane-container]")
    const hamburgerLocator = page.locator(
        "[data-testid=category-menu-hamburger]")
    
    const paneVisible = await categoryPaneLocator.isVisible()
    const hamburgerVisible = await hamburgerLocator.isVisible()
    if (!paneVisible && hamburgerVisible) {
        await Promise.all([
            hamburgerLocator.click(),
            categoryPaneLocator.waitFor({ state: "visible" })
        ])
    }
}

const hideCategoryPaneIfPossible = async (page) => {
    const categoryPaneLocator = page.locator(
        "[data-testid=category-pane-container]")
    const hamburgerLocator = page.locator(
        "[data-testid=category-menu-hamburger]")
    
    const paneVisible = await categoryPaneLocator.isVisible()
    const hamburgerVisible = await hamburgerLocator.isVisible()
    if (paneVisible && hamburgerVisible) {
        await Promise.all([
            hamburgerLocator.click(),
            categoryPaneLocator.waitFor({ state: "hidden" })
        ])
    }
}

const testEachCategoryFilter = async (page, categories, counts) => {
    const categoryHeaderLocator = page.locator(
        "[data-testid=category-header-container]")
    const deselectCategoryButtonLocator = page.locator(
        "[data-testid=deselect-button-container]")
    const postInfoLocator = page.locator("[data-testid=post-info-container]")

    for (const category of categories) {
        const thisCategoryLocator = categoryHeaderLocator.locator(
            `text=${ category }`)
        await Promise.all([
            thisCategoryLocator.click(),
            deselectCategoryButtonLocator.waitFor()
        ])

        await hideCategoryPaneIfPossible(page)

        // count posts
        const allFilteredPosts = await postInfoLocator.count()
        const correctlyFilteredPosts = await postInfoLocator.locator(
            `text=${ category }`).count()
        expect(allFilteredPosts).toBe(correctlyFilteredPosts)
        expect(allFilteredPosts).toBe(counts[category])

        await showCategoryPaneIfNecessary(page)

        // deselect selected category
        await Promise.all([
            thisCategoryLocator.click(),
            deselectCategoryButtonLocator.waitFor({ state: 'hidden' })
        ])
    }
}

const testGroupedCategoryFilters = async (page, categories, counts) => {
    const categoryHeaderLocator = page.locator(
        "[data-testid=category-header-container]")
    const deselectCategoryButtonLocator = page.locator(
        "[data-testid=deselect-button-container]")
    const postInfoLocator = page.locator("[data-testid=post-info-container]")
    let prevFiltered = 0
    for (let i = 0; i < categories.length; i++) {
        const category = categories[i]
        await showCategoryPaneIfNecessary(page)

        // select another category
        const thisCategoryLocator = categoryHeaderLocator.nth(i)
        const thisDeselectLocator = deselectCategoryButtonLocator.nth(i)
        await thisCategoryLocator.click()
        let appliedFilter = false
        while (!appliedFilter) {
            const filteredWhen1 = await thisDeselectLocator.count()
            appliedFilter = filteredWhen1 === 1
        }

        await hideCategoryPaneIfPossible(page)
        
        // assert on newly filtered posts
        const newFilteredPosts = await postInfoLocator.locator(
            `text=${ category }`).count()
        const allFilteredPosts = await postInfoLocator.count()
        expect(newFilteredPosts).toBe(counts[category])
        expect(allFilteredPosts - prevFiltered).toBe(newFilteredPosts)

        prevFiltered += newFilteredPosts
    }
}

const toggleCategoryStyleAssert = async (categoryHeaderLocator) => {
    const preClick1Style = await categoryHeaderLocator.getAttribute("style")
    const preClick1DeselectPresent = await categoryHeaderLocator.locator(
        "[data-testid=deselect-button-container]").isVisible()
    expect(preClick1Style === null ||
        !(preClick1Style.includes("background-color"))).toBe(true)
    expect(preClick1DeselectPresent).toBe(false)
    
    await categoryHeaderLocator.click()

    const postClick1Style = await categoryHeaderLocator.getAttribute("style")
    const postClick1DeselectPresent = await categoryHeaderLocator.locator(
        "[data-testid=deselect-button-container]").isVisible()
    expect(postClick1Style.includes("background-color")).toBe(true)
    expect(postClick1DeselectPresent).toBe(true)

    await categoryHeaderLocator.click()

    const postClick2Style = await categoryHeaderLocator.getAttribute("style")
    const postClick2DeselectPresent =  await categoryHeaderLocator.locator(
        "[data-testid=deselect-button-container]").isVisible()
    expect(postClick2Style === null ||
        !(postClick2Style.includes("background-color"))).toBe(true)
    expect(postClick2DeselectPresent).toBe(false)
}

module.exports = {
    getDbCourseCategories,
    getPageCourseCategories,
    hexToRgbStr,
    showCategoryPaneIfNecessary,
    hideCategoryPaneIfPossible,
    testEachCategoryFilter,
    testGroupedCategoryFilters,
    toggleCategoryStyleAssert
}