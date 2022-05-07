const { TEST_COURSE_INFO } = require('../lib/course')
const { TESTUSER_REGISTERED } = require('../lib/auth')
const { query } = require('../lib/db')
const { expect } = require('@playwright/test')

const getDbCoursePostsRevChronOrder = async (courseId) => {
    try {
        const dbCoursePostsQueryParams = [
            courseId,
            TESTUSER_REGISTERED.userId
        ]
        const dbCoursePostsQuery = await query(
            bigPostsQueryText, dbCoursePostsQueryParams)
            
        return dbCoursePostsQuery.rows
    }
    catch (error) {
        throw new Error("couldnt get posts from db during e2e")
    }
}

const getPinnedFromDbRows = rows => rows.filter(row => row.pinned)
const getAnnouncementsFromDbRows = rows => rows.filter(
    row => row.is_announcement)
const getNonPinnedNonAnnouncementFromDbRows = rows => (
    rows.filter(row => !row.pinned && !row.is_announcement))
const dbPrivateFilter = (row, userId) => !row.private || row.user_id === userId

const timeUnitPriority = {
    "seconds": 1,
    "minutes": 2,
    "hours": 3,
    "days": 4,
    "weeks": 5,
    "months": 6,
    "years": 7
}
const timestamp1LteTimestamp2 = (t1, t2) => {
    const [units1, timeUnit1] = t1
    const [units2, timeUnit2] = t2
    if (timeUnitPriority[timeUnit1] < timeUnitPriority[timeUnit2]) {
        return true
    }
    if (timeUnitPriority[timeUnit1] === timeUnitPriority[timeUnit2]) {
        return parseInt(units1, 10) <= parseInt(units2, 10)
    }
    return false
}

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

const loadAllPosts = async (page) => {
    const postInfoLocator = page.locator("[data-testid=post-info-container]")
    const loadMorePostsBtnLocator = page.locator(
        "[data-testid=load-more-posts-button]")
    const noMorePostsLocator = page.locator("text=/no more posts/i")
    let postsLoaded = await postInfoLocator.count()
    let loadingPosts = true
    while (loadingPosts) {
        await Promise.all([
            loadMorePostsBtnLocator.click(),
            loadMorePostsBtnLocator.waitFor({ state: "hidden" })
        ])
        let newPostsLoaded = await postInfoLocator.count()
        let noMorePostsIcon = await noMorePostsLocator.isVisible()
        while (newPostsLoaded === postsLoaded && !noMorePostsIcon) {
            newPostsLoaded = await postInfoLocator.count()
            noMorePostsIcon = await noMorePostsLocator.isVisible()
        }
        loadingPosts = !noMorePostsIcon
        postsLoaded = newPostsLoaded
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

const getAllNonDeletedDbPostsInPageOrder = async (courseId) => {
    const dbPosts = await getDbCoursePostsRevChronOrder(courseId)
    const pinnedDbRows = getPinnedFromDbRows(dbPosts)
    const announcementDbRows = getAnnouncementsFromDbRows(dbPosts)
    const regularDbRows = getNonPinnedNonAnnouncementFromDbRows(dbPosts)
    
    return [...pinnedDbRows, ...announcementDbRows, ...regularDbRows]
}

const checkIfAttributeSelected = async (attribute, attributeLocator) => {
    const numAttributes = await attributeLocator.count()
    
    for (let i = 0; i < numAttributes; i++) {
        const thisAttributeLocator = attributeLocator.nth(i)
        const thisAttributeInnerText = await thisAttributeLocator.innerText()
        const needsToBeChecked = (
            new RegExp(attribute)).test(thisAttributeInnerText)
        if (!needsToBeChecked) continue

        const isSelected = await thisAttributeLocator.locator(
            "[data-testid=attribute-selected]").isVisible()
        return isSelected
    }
}

const selectAnAttribute = async (attribute, page) => {
    const attributeFilterButtonLocator = page.locator(
        "[data-testid=attributes-dropdown-button]")
    await attributeFilterButtonLocator.click()
    const dropdownLocator = page.locator(
        "[data-testid=post-attributes-dropdown-container]")
    let dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(true)

    const attributeLocator = page.locator(
        "[data-testid=post-attribute-container]")
    await attributeLocator.locator(`text=${ attribute }`).click()
    await attributeFilterButtonLocator.click()
    const unreadSelected = (
        await checkIfAttributeSelected(attribute, attributeLocator))
    expect(unreadSelected).toBe(true)

    await attributeFilterButtonLocator.click()
    dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(false)
}

const dbUnreadContent = (row) => (!row.last_viewed_at || (
    Date.parse(row.latest_comment_time) > Date.parse(row.last_viewed_at)))

const bigPostsQueryText = `
SELECT
    post_id, title, category_name, created_at,
    is_question, resolved, answered, endorsed, is_announcement, pinned,
    f_name, l_name, user_id, private, author_is_staff, author_is_instructor,
    star_id, watch_id, last_viewed_at, likes, comments, latest_comment_time
FROM
    (SELECT category_id, name as category_name 
        FROM post_category WHERE course = $1) 
    AS course_categories
    JOIN post 
        ON post.category = category_id
    JOIN (
        SELECT user_id, f_name, l_name, 
            person.is_staff AS author_is_staff, 
            person.is_instructor AS author_is_instructor
            FROM person
        JOIN (SELECT person AS enrolled_person, course AS enrolled_course 
            FROM person_course WHERE course = $1) 
        AS course_enrollments
            ON user_id = enrolled_person
        WHERE enrolled_course = $1) 
    AS course_enrollees 
        ON post.author = user_id
    LEFT JOIN (SELECT star_id, post as starred_post FROM post_star
        WHERE starrer = $2) 
    AS starred_posts 
        ON starred_post = post_id
    LEFT JOIN (SELECT watch_id, post as watched_post FROM post_watch
        WHERE watcher = $2) 
    AS watched_posts 
        ON watched_post = post_id
    LEFT JOIN (SELECT last_viewed_at, post as viewed_post FROM post_view
        WHERE viewer = $2) 
    AS viewed_posts 
        ON viewed_post = post_id
    JOIN (
        SELECT 
            post_id AS interacted_post, 
            COUNT(DISTINCT liker) AS likes, 
            COUNT(DISTINCT comment_id) AS comments
        FROM ((SELECT category_id FROM post_category WHERE course = $1) 
                AS course_categories
                JOIN post
                    ON post.category = category_id
            ) AS course_posts
            LEFT JOIN post_like 
                ON post_like.post = post_id
            LEFT JOIN (
                SELECT comment_id, post AS commented_post FROM comment
                WHERE NOT deleted
            ) AS displayed_comments
                ON commented_post = post_id
            GROUP BY post_id
    ) 
    AS post_interactions
    ON interacted_post = post_id
    LEFT JOIN (
        SELECT post_id AS commented_post, 
            max(comment_created_at) AS latest_comment_time
        FROM ((SELECT category_id FROM post_category WHERE course = $1)
            AS course_categories
            JOIN post 
                ON post.category = category_id
        ) AS course_posts
        LEFT JOIN (
            SELECT comment_id, post AS commented_post, 
            created_at AS comment_created_at FROM comment
            WHERE NOT deleted
        ) AS displayed_comments 
        ON commented_post = post_id
        GROUP BY post_id
    ) AS latest_comments
    ON commented_post = post_id

ORDER BY created_at DESC;`

module.exports = {
    getDbCourseCategories,
    getPageCourseCategories,
    hexToRgbStr,
    showCategoryPaneIfNecessary,
    hideCategoryPaneIfPossible,
    loadAllPosts,
    testEachCategoryFilter,
    testGroupedCategoryFilters,
    getDbCoursePostsRevChronOrder,
    getPinnedFromDbRows,
    getAnnouncementsFromDbRows,
    getNonPinnedNonAnnouncementFromDbRows,
    dbPrivateFilter,
    timestamp1LteTimestamp2,
    getAllNonDeletedDbPostsInPageOrder,
    checkIfAttributeSelected,
    selectAnAttribute,
    dbUnreadContent
}