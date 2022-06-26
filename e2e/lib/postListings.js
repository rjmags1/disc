const { TESTUSER_REGISTERED } = require('./auth')
const { query } = require('./db')
const { expect } = require('@playwright/test')
const time = require('./time')

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
    let [units1, timeUnit1] = t1
    let [units2, timeUnit2] = t2
    timeUnit1 = pluralTimeUnit(timeUnit1)
    timeUnit2 = pluralTimeUnit(timeUnit2)
    if (timeUnitPriority[timeUnit1] < timeUnitPriority[timeUnit2]) {
        return true
    }
    if (timeUnitPriority[timeUnit1] === timeUnitPriority[timeUnit2]) {
        return parseInt(units1, 10) <= parseInt(units2, 10)
    }
    return false
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

const getAllNonDeletedDbPostsInPageOrder = async (courseId) => {
    const dbPosts = await getDbCoursePostsRevChronOrder(courseId)
    const pinnedDbRows = getPinnedFromDbRows(dbPosts)
    const announcementDbRows = getAnnouncementsFromDbRows(dbPosts).filter(
        row => !row.pinned)
    const regularDbRows = getNonPinnedNonAnnouncementFromDbRows(dbPosts)
    
    return [...pinnedDbRows, ...announcementDbRows, ...regularDbRows].filter(
        row => !row.deleted)
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

const postOrderPinnedOrAnnBreak = async (postInfoLocator, i) => {
    const currPinned = await postInfoLocator.nth(i).locator(
        "[data-testid=pinned-icon]").isVisible()
    const currIsAnnouncement = await postInfoLocator.nth(i).locator(
        "[data-testid=announcement-icon]").isVisible()
    const nextIsAnnouncement = await postInfoLocator.nth(i + 1).locator(
        "[data-testid=announcement-icon]").isVisible()
    
    const orderBreak = (
        (currPinned && nextIsAnnouncement) || 
        (currIsAnnouncement && !nextIsAnnouncement))
    
    return orderBreak
}

const pluralTimeUnit = (timeUnit) => {
    if (timeUnit[timeUnit.length - 1] !== 's') {
        timeUnit += "s"
    }
    return timeUnit
}

const assertDbRowMatchPagePostText = async (dbRow, pagePostInnerText) => {
    const timestampFromFixedDbTime = time.toTimestampString(
        time.fixNodePgUTCTimeInterpretation(dbRow.created_at))
    expect(pagePostInnerText).toMatch(
        new RegExp(`${ timestampFromFixedDbTime }`))
    expect(pagePostInnerText).toMatch(new RegExp(`${ dbRow.title }`))
    expect(pagePostInnerText).toMatch(
        new RegExp(`${ dbRow.category_name }`))
    expect(pagePostInnerText).toMatch(
        new RegExp(dbRow.anonymous ? 
            "Anonymous" : `${ dbRow.f_name } ${ dbRow.l_name }`))
}

const assertDbRowMatchPagePost_St_AR_En_Wa_Pi_An = (
    async (dbRow, postInfoLocator) => {
    const starVisible = await postInfoLocator.locator(
        "[data-testid=star-icon]").isVisible()
    const checkmarkVisible = await postInfoLocator.locator(
        "[data-testid=green-checkmark-icon]").isVisible()
    const endorsedVisible = await postInfoLocator.locator(
        "[data-testid=endorsed-icon]").isVisible()
    const watchingVisible = await postInfoLocator.locator(
        "[data-testid=watching-icon]").isVisible()
    const pinnedVisible = await postInfoLocator.locator(
        "[data-testid=pinned-icon]").isVisible()
    const announcementVisible = await postInfoLocator.locator(
        "[data-testid=announcement-icon]").isVisible()

    expect(starVisible).toBe(Boolean(dbRow.star_id))
    expect(checkmarkVisible).toBe(dbRow.resolved || dbRow.answered)
    expect(endorsedVisible).toBe(dbRow.endorsed)
    expect(watchingVisible).toBe(Boolean(dbRow.watch_id))
    expect(pinnedVisible).toBe(dbRow.pinned)
    expect(announcementVisible).toBe(dbRow.is_announcement)
})

const assertDbRowMatchesPagePostLikesComments = (
    async (dbRow, postInfoLocator) => {
    const commentsIconLocator = postInfoLocator.locator(
        "[data-testid=comments-icon]")
    const likesIconLocator = postInfoLocator.locator(
        "[data-testid=likes-icon]")

    const dbComments = parseInt(dbRow.comments, 10)
    if (dbComments === 0) {
        const commentsIconVisible = await commentsIconLocator.isVisible()
        expect(commentsIconVisible).toBe(false)
    }
    else {
        const numPageComments = await commentsIconLocator.innerText()
        expect(parseInt(numPageComments, 10)).toBe(dbComments)
    }
    const dbLikes = parseInt(dbRow.likes, 10)
    if (dbLikes === 0) {
        const likesIconVisible = await likesIconLocator.isVisible()
        expect(likesIconVisible).toBe(false)
    }
    else {
        const numPageLikes = await likesIconLocator.innerText()
        expect(parseInt(numPageLikes, 10)).toBe(dbLikes)
    }
})

const getDbRowsDisplayedToUser = async (courseId, userId) => {
    const dbRowsInPageOrder = (
        await getAllNonDeletedDbPostsInPageOrder(courseId))
    return dbRowsInPageOrder.filter(
        row => dbPrivateFilter(row, userId))
}

const openAttributeFilter = async (page) => {
    const attributeFilterButtonLocator = page.locator(
        "[data-testid=attributes-dropdown-button]")
    const dropdownLocator = page.locator(
        "[data-testid=post-attributes-dropdown-container]")
    let dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(false)
    await attributeFilterButtonLocator.click()
    dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(true)
}

const closeAttributeFilter = async (page) => {
    const attributeFilterButtonLocator = page.locator(
        "[data-testid=attributes-dropdown-button]")
    const dropdownLocator = page.locator(
        "[data-testid=post-attributes-dropdown-container]")
    let dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(true)
    await attributeFilterButtonLocator.click()
    dropdownShowing = await dropdownLocator.isVisible()
    expect(dropdownShowing).toBe(false)
}

const bigPostsQueryText = `
SELECT
    post_id, title, category_name, created_at, deleted, anonymous,
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
        ) AS displayed_comments 
        ON commented_post = post_id
        GROUP BY post_id
    ) AS latest_comments
    ON commented_post = post_id

ORDER BY created_at DESC;`

module.exports = {
    loadAllPosts,
    getDbCoursePostsRevChronOrder,
    getPinnedFromDbRows,
    getAnnouncementsFromDbRows,
    getNonPinnedNonAnnouncementFromDbRows,
    dbPrivateFilter,
    timestamp1LteTimestamp2,
    getAllNonDeletedDbPostsInPageOrder,
    checkIfAttributeSelected,
    selectAnAttribute,
    dbUnreadContent,
    postOrderPinnedOrAnnBreak,
    pluralTimeUnit,
    assertDbRowMatchPagePostText,
    assertDbRowMatchPagePost_St_AR_En_Wa_Pi_An,
    assertDbRowMatchesPagePostLikesComments,
    getDbRowsDisplayedToUser,
    openAttributeFilter,
    closeAttributeFilter
}