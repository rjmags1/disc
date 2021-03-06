const { query } = require('./db')
const { expect } = require('@playwright/test')
const { 
    toTimestampString, fixNodePgUTCTimeInterpretation 
} = require('./time')
const { TESTUSER_REGISTERED, TESTUSER_STAFF } = require('./auth')
const { getAllNonDeletedDbPostsInPageOrder, } = require('./postListings')
const { TEST_COURSE_INFO } = require('./course')

const ANONYMOUS_AVATAR_URL = "/profile-button-img.png"

exports.TEST_POST_INFO = {
    id: process.env.TEST_POST_ID,
    title: process.env.TEST_POST_TITLE
}

exports.getAllDbTopLevelThreadCommentsDisplayOrder = async (postId) => {
    const ancestorQueryText = `
        SELECT 
            comment_id, deleted, anonymous, display_content, 
            created_at, author, is_resolving, is_answer, endorsed
        FROM comment 
        WHERE post = $1 AND ancestor_comment IS NULL
        ORDER BY created_at ASC;`
    const ancestorCommentQuery = await query(ancestorQueryText, [postId])
    const ancestorInfo = {}
    ancestorCommentQuery.rows.forEach(row => {
        ancestorInfo[row.comment_id] = { 
            deleted: row.deleted, 
            display_content: row.display_content,
            created_at: row.created_at,
            anonymous: row.anonymous,
            author: row.author,
            is_resolving: row.is_resolving,
            is_answer: row.is_answer,
            endorsed: row.endorsed
        }
    })

    const topLevelDescendantQueryText = `
        SELECT 
            comment_id, deleted, display_content, created_at, 
            anonymous, author, is_resolving, is_answer, endorsed
        FROM comment 
        WHERE post = $1 AND ancestor_comment = $2
        ORDER BY thread_id ASC LIMIT 2;`
    const ancestorToDescendants = {}
    for (const ancestorCommentId of Object.keys(ancestorInfo)) {
        const topLevelDescendantQuery = await query(
            topLevelDescendantQueryText, [postId, ancestorCommentId])
        ancestorToDescendants[ancestorCommentId] = topLevelDescendantQuery.rows
    }
    
    return sortDbRowsByAncestorCreatedAt(ancestorInfo, ancestorToDescendants)
}

const sortDbRowsByAncestorCreatedAt = (ancestorInfo, ancestorToDescendants) => {
    const ancestorsInOrder = Object.keys(ancestorInfo).map(
        aid => ({ 
            comment_id: aid, ancestor: true, ...ancestorInfo[aid] 
        })).sort(
            (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    
    const result = []
    for (const anc of ancestorsInOrder) {
        result.push(anc)
        for (const desc of ancestorToDescendants[anc.comment_id]) {
            result.push(desc)
        }
    }

    return result
}

const numCommentsOnPage = async (page) => {
    const numComments = await page.locator(`
        [data-testid=comment-box-container]`).count()
    return numComments
}

exports.lazyLoadAllTopLevelPageComments = async (page) => {
    let loadedAll = false
    let prevScrollTop = 0
    while (!loadedAll) {
        await new Promise(res => setTimeout(res, 100))
        const scrollTop = await page.evaluate(() => {
            const pc = document.getElementById("post-container")
            pc.scrollBy(0, 500)
            return pc.scrollTop
        })
        loadedAll = prevScrollTop === scrollTop
        prevScrollTop = scrollTop
    }
    
    const numLoaded = await numCommentsOnPage(page)
    return numLoaded
}

exports.getDbAncestorsLte2Replies = async () => {
    const allAncestorInfo = await getAllAncestorReplyCounts()
    return allAncestorInfo.filter(ancestorInfo => ancestorInfo.replies < 3)
}

const getAllAncestorReplyCounts = async () => {
    const queryText = `
        WITH 
        thread_reply_counts AS (
            SELECT ancestor_comment, COUNT(DISTINCT comment_id) AS count
            FROM comment 
            WHERE ancestor_comment IS NOT NULL AND post = $1
            GROUP BY ancestor_comment),
        ancestor_comments AS (
            SELECT comment_id, display_content, deleted
            FROM comment 
            WHERE ancestor_comment IS NULL AND post = $1)

        SELECT * FROM 
        ancestor_comments LEFT JOIN thread_reply_counts 
        ON comment_id = ancestor_comment;
    `
    const replyCountsQuery = await query(
        queryText, [this.TEST_POST_INFO.id])

    return replyCountsQuery.rows.map(row => ({
        comment_id: row.comment_id, 
        display_content: row.display_content,
        replies: row.count === null ? 0 : parseInt(row.count),
        deleted: row.deleted
    }))
}

exports.stripTagsNewLine = (s) => {
    const noTags = s.slice(3, s.length - 4)
    return (noTags[noTags.length - 1] === '\n' ? 
        noTags.slice(0, noTags.length - 1) : noTags)
} 

exports.getDbAncestorsGt2Replies = async () => {
    const allAncestorInfo = await getAllAncestorReplyCounts()
    return allAncestorInfo.filter(ancestorInfo => ancestorInfo.replies > 2)
}

exports.getDbAllReplies = async (ancestorId) => {
    const queryText = `
        SELECT comment_id, thread_id, display_content, deleted
        FROM comment WHERE ancestor_comment = $1
        ORDER BY thread_id ASC;`
    
    const dbRepliesQuery = await query(queryText, [ancestorId])

    return dbRepliesQuery.rows
}

exports.getAvatarUrlAndNameFromDb = async (userId) => {
    const queryText = `
        SELECT avatar_url, f_name, l_name FROM 
        (SELECT avatar_url AS au, f_name, l_name 
        FROM person WHERE user_id = $1) AS person 
        LEFT JOIN avatar_url ON avatar_url_id = au;`
    const avatarUrlQuery = await query(queryText, [userId])

    return avatarUrlQuery.rows[0]
}

exports.getDbCommentLikes = async (commentId) => {
    const queryText = `
        SELECT COUNT(DISTINCT liker) as likes
        FROM comment_like WHERE comment = $1;`
    const likesQuery = await query(queryText, [commentId])

    return likesQuery.rows[0].likes
}

exports.assertOnCommentAvatar = (
async (dbCommentInfo, dbAuthorInfo, commentBoxLocator) => {
    const { avatar_url } = dbAuthorInfo
    const { anonymous, deleted } = dbCommentInfo

    const commentProfPicSrc = await commentBoxLocator.locator(
        '[data-testid=comment-prof-pic]').getAttribute('src')
    const dbAvatar = (anonymous || deleted ?
        ANONYMOUS_AVATAR_URL : avatar_url)
    expect(commentProfPicSrc).toBe(dbAvatar)
})

exports.assertOnCommentEndorsedCheckBadges = (
async (dbCommentInfo, commentBoxLocator) => {
    const {
        deleted, endorsed, is_resolving, is_answer 
    } = dbCommentInfo

    const endorsedIconPresent = await commentBoxLocator.locator(
        '[data-testid=comment-endorsed-icon]').isVisible()
    expect(endorsedIconPresent).toBe(!deleted && endorsed)
    const checkIconPresent = await commentBoxLocator.locator(
        '[data-testid=comment-check-icon]').isVisible()
    expect(checkIconPresent).toBe(!deleted && (is_resolving || is_answer))
})

exports.assertOnCommentTimestampAuthor = (
async (dbCommentInfo, dbAuthorInfo, commentBoxLocator) => {
    const { deleted, anonymous, created_at } = dbCommentInfo
    const { f_name, l_name } = dbAuthorInfo
    const dbAuthorName = `${ f_name } ${ l_name }`
    const commentAuthor = await commentBoxLocator.locator(
        '[data-testid=comment-author]').innerText()
    const dbAuthor = deleted || anonymous ? 'anonymous' : dbAuthorName
    expect(commentAuthor).toBe(dbAuthor)

    if (!deleted) {
        const dbTimestamp = toTimestampString(
            fixNodePgUTCTimeInterpretation(created_at))
        const commentTimestamp = await commentBoxLocator.locator(
            '[data-testid=timestamp]').innerText()
        expect(dbTimestamp).toBe(commentTimestamp)
    }
})

exports.assertOnCommentContent = (
async (dbCommentInfo, commentBoxLocator, browserName) => {
    const { deleted, display_content } = dbCommentInfo
    const dbContent = (
        deleted ? 'deleted' : this.stripTagsNewLine(display_content))
    let commentContent = await commentBoxLocator.locator(
        '[data-testid=comment-container]').innerText()
    if (browserName === 'webkit' &&  // account for safari newline insertion
        dbContent.indexOf('\n', dbContent.length - 1) === -1 &&
        commentContent.indexOf('\n', commentContent.length - 1) !== -1) {
        commentContent = commentContent.slice(0, commentContent.length - 1)
    }
    const match = new RegExp(commentContent).test(dbContent)
    expect(match).toBe(true)
})

exports.baseAssertOnCommentControlPanel = (
async (dbCommentInfo, commentBoxLocator, userId) => {
    const { comment_id, deleted, author: authorId } = dbCommentInfo

    const commentLikeCounterLocator = commentBoxLocator.locator(
        '[data-testid=comment-like-counter]')
    const commentLikeButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-like-button]')
    const commentReplyButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-reply-button]')
    if (deleted) {
        await expect(commentLikeCounterLocator).not.toBeVisible()
        await expect(commentLikeButtonLocator).not.toBeVisible()
        await expect(commentReplyButtonLocator).not.toBeVisible()
    }
    else {
        const dbLikes = await this.getDbCommentLikes(comment_id)
        const commentLikes = await commentLikeCounterLocator.innerText()
        expect(parseInt(dbLikes)).toBe(parseInt(commentLikes))
        await expect(commentLikeButtonLocator).toBeVisible()
        await expect(commentReplyButtonLocator).toBeVisible()
    }

    const commentEditButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-edit-button]')
    const commentDeleteButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-delete-button]')
    const editPresent = await commentEditButtonLocator.isVisible()
    const deletePresent = await commentDeleteButtonLocator.isVisible()
    expect(editPresent).toBe(!dbCommentInfo.deleted && userId === authorId)
    expect(deletePresent).toBe(!dbCommentInfo.deleted && userId === authorId)
})

exports.getFirstDisplayedPostCommentDbInfo = async (postId) => {
    const queryText = `
        SELECT f_name, l_name, display_content, likes FROM 
            (SELECT author, display_content, comment_id
            FROM comment WHERE post = $1 AND ancestor_comment IS NULL
            ORDER BY created_at ASC
            LIMIT 1)
        AS the_comment
        LEFT JOIN person ON the_comment.author = person.user_id
        LEFT JOIN 
            (SELECT comment AS liked_comment, COUNT(DISTINCT liker) AS likes 
            FROM comment_like GROUP BY liked_comment)
        AS comment_likes 
        ON liked_comment = comment_id;`
    
    const firstDisplayedPostCommentQuery = await query(queryText, [postId])
    const {
        f_name, l_name, display_content, likes 
    } = firstDisplayedPostCommentQuery.rows[0]
    return {
        dbAuthor: `${ f_name } ${ l_name }`,
        dbComment: this.stripTagsNewLine(display_content),
        dbLikes: likes === null ? 0 : parseInt(likes)
    }
}

exports.getFirstDisplayedCommentPageAndDbInfo = async (page, postId) => {
    const commentBoxLocator = page.locator(
        '[data-testid=comment-box-container]').nth(0)
    const pageAuthor = await commentBoxLocator.locator(
        '[data-testid=comment-author]').innerText()
    const pageComment = await commentBoxLocator.locator(
        '[data-testid=comment-container]').innerText()
    const numLikes = await commentBoxLocator.locator(
        '[data-testid=comment-like-counter]').innerText()
    const pageCommentInfo = {
        pageAuthor, pageComment, pageLikes: parseInt(numLikes) }

    const dbCommentInfo = await this.getFirstDisplayedPostCommentDbInfo(postId)

    return { pageCommentInfo, dbCommentInfo }
}

const clickCommentLike = async (commentLikeButtonLocator) => {
    const preClickLabel = await commentLikeButtonLocator.innerText()
    const postClickLabel = (new RegExp('unlike', 'i').test(preClickLabel) ?
        'like' : 'unlike')
    const postClickLabelLocator = commentLikeButtonLocator.locator(
        `text=/${ postClickLabel }/i`)
    await Promise.all([
        commentLikeButtonLocator.click(),
        postClickLabelLocator.waitFor()
    ])
}

exports.assertOnCommentLikeUnlike = (
async (commentBoxLocator, preClickLikes, postId) => {
    const commentLikeButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-like-button]')
    const commentLikeCounterLocator = commentBoxLocator.locator(
        '[data-testid=comment-like-counter]')
    const initialLabel = await commentLikeButtonLocator.innerText()

    await clickCommentLike(commentLikeButtonLocator)
    const postClickInc = (
        new RegExp('unlike', 'i').test(initialLabel) ? -1 : 1)
    const postClickPageLikes = postClickInc + preClickLikes
    const updatedLikeCounterLocator = commentLikeCounterLocator.locator(
        `text=${ postClickPageLikes }`)
    await updatedLikeCounterLocator.waitFor()
    const { dbLikes: postClickDbLikes } = (
        await this.getFirstDisplayedPostCommentDbInfo(postId))
    expect(parseInt(postClickPageLikes)).toBe(postClickDbLikes)

    await clickCommentLike(commentLikeButtonLocator)
    const resetLikeCounterLocator = commentLikeCounterLocator.locator(
        `text=${ preClickLikes }`)
    await resetLikeCounterLocator.waitFor()
    const { dbLikes: postSecondClickDbLikes } = (
        await this.getFirstDisplayedPostCommentDbInfo(postId))
    expect(preClickLikes).toBe(postSecondClickDbLikes)
})

exports.removeTestCommentFromDb = async () => {
    const testCommentId = await this.getNewestCommentIdFromDb()
    const removeCommentGenNotifQueryText = `
        DELETE FROM notification WHERE gen_comment = $1;`
    await query(removeCommentGenNotifQueryText, [testCommentId])
    const removeTestCommentQueryText = `
        DELETE FROM comment WHERE comment_id = $1;`
    await query(removeTestCommentQueryText, [testCommentId])
}

exports.getNewestCommentIdFromDb = async () => {
    const testCommentIdQueryText = `
        SELECT MAX(comment_id) AS newest_comment FROM comment;`
    const testCommentIdQuery = await query(testCommentIdQueryText)

    return testCommentIdQuery.rows[0].newest_comment
}

const assertFirstUserCommentEditInDb = async (newComment) => {
    const queryText = `
        SELECT display_content FROM comment
        WHERE post = $1 AND author = $2
        ORDER BY created_at ASC
        LIMIT 1;`
    const newCommentQuery = await query(queryText, [ // display content is html
        this.TEST_POST_INFO.id, TESTUSER_REGISTERED.userId])
    expect(newCommentQuery.rows[0].display_content).toMatch(
        new RegExp(newComment)) }

exports.editAndAssertOnEditedPageComment = (
async (page, commentBoxLocator, newComment) => {
    const editorLocator = page.locator(
        '#quill-editor-container').locator('.ql-editor')
    const commentEditButtonLocator = commentBoxLocator.locator(
        '[data-testid=comment-edit-button]')
    await Promise.all([
        commentEditButtonLocator.click(),
        editorLocator.waitFor()
    ])

    // no fill method on locator
    const editorElement = await editorLocator.elementHandle()
    const commentContainerLocator = commentBoxLocator.locator(
        '[data-testid=comment-container]')
    await editorElement.fill(newComment)
    await Promise.all([
        commentBoxLocator.locator(
            '[data-testid=editor-submit-button]').click(),
        commentContainerLocator.locator(
            `text=${ newComment }`).waitFor()
    ])
    await assertFirstUserCommentEditInDb(newComment)
    let editedCommentText = await commentContainerLocator.innerText()
    // get rid of safari and quill auto inserted term. newlines
    editedCommentText = this.stripTerminatingNewlines(editedCommentText)
    expect(editedCommentText).toBe(newComment)
})

exports.stripTerminatingNewlines = (s) => {
    while (s.length > 0 && s[s.length - 1] === '\n') {
        s = s.slice(0, s.length - 1)
    }
    return s
}

exports.dbAssertResetFirstUserAuthoredCommentDeleted = (
async (deletedComment) => {
    await new Promise(res => setTimeout(res, 1000))
    const firstCommentInfoQueryText = `
        SELECT comment_id, deleted, display_content FROM comment
        WHERE post = $1 AND author = $2
        ORDER BY created_at ASC
        LIMIT 1;`
    const firstCommentInfoQuery = await query(firstCommentInfoQueryText, [
        this.TEST_POST_INFO.id, TESTUSER_REGISTERED.userId])
    const {
        comment_id, deleted, display_content 
    } = firstCommentInfoQuery.rows[0]
    // reset no matter what
    await query(`
        UPDATE comment SET deleted = $2 WHERE comment_id = $1;`,
        [comment_id, false])
    // make sure we have right comment then check if it was deleted prior to reset
    expect(display_content).toMatch(new RegExp(
        this.stripTerminatingNewlines(deletedComment)))
    expect(deleted).toBe(true)

    
})

exports.dbAssertFirstUserAuthoredPostFirstCommentResAnsDelta = (
async (normalPost, expectedBtnStatus) => {
    const dbPostsPageOrder = await getAllNonDeletedDbPostsInPageOrder(
        TEST_COURSE_INFO.courseId)
    let relevantPostDbRow
    for (const row of dbPostsPageOrder) {
        if (normalPost && !row.is_question && !row.anonymous &&
            TESTUSER_REGISTERED.userId === row.user_id && row.comments > 0) {
            relevantPostDbRow = row
            break
        }
        if (!normalPost && row.is_question && !row.anonymous &&
            TESTUSER_REGISTERED.userId === row.user_id && row.comments > 0) {
            relevantPostDbRow = row
            break
        }
    }
    const firstCommentDbRow = (
        await this.getAllDbTopLevelThreadCommentsDisplayOrder(
            relevantPostDbRow.post_id))[0]
    const numResolvingAnswerDbComments = await getNumResolvingAnswers(
        relevantPostDbRow.post_id)
    
    
    if (normalPost) {
        expect(relevantPostDbRow.resolved).toBe(numResolvingAnswerDbComments > 0)
        expect(firstCommentDbRow.is_resolving).toBe(expectedBtnStatus)
    }
    else {
        expect(relevantPostDbRow.answered).toBe(numResolvingAnswerDbComments > 0)
        expect(firstCommentDbRow.is_answer).toBe(expectedBtnStatus)
    }
})

const getNumResolvingAnswers = async (postId) => {
    const numResAnsQuery = await query(
        `SELECT COUNT(*) as res_answers FROM comment 
        WHERE post = $1 AND (is_resolving OR is_answer) AND NOT deleted;`, 
        [postId])
    return numResAnsQuery.rows[0].res_answers
}


exports.assertOnCorrectResolveAnswerButtonLabels = (
async (page, initialPostStatus, checkingResolveButton) => {

    await this.lazyLoadAllTopLevelPageComments(page)
    const commentBoxLocator = page.locator(
        '[data-testid=comment-box-container]')
    const numTopLevelComments = await commentBoxLocator.count()
    const resolvingAnswerTextSelector = checkingResolveButton ? 
        'text=/unmark as resolving/i' : 'text=/unmark as answer/i'
    let numResolvingAnswerComments = 0
    for (let i = 0; i < numTopLevelComments; i++) {
        const commentIsResolvingAnswer = await commentBoxLocator.nth(i).locator(
            resolvingAnswerTextSelector).isVisible()
        if (!initialPostStatus) expect(commentIsResolvingAnswer).toBe(false)
        else numResolvingAnswerComments += commentIsResolvingAnswer ? 1 : 0
    }
    if (initialPostStatus) {
        expect(numResolvingAnswerComments).toBeGreaterThan(0)
    } 
})

exports.clickResolveAnswerButtonUiAssert = (
async (page, initialPostStatus, isMobile, checkingResolveButton, listingLocator) => {
    const commentBoxLocator = page.locator('[data-testid=comment-box-container]')
    const firstResolveAnswerBtn = page.locator(checkingResolveButton ?
        '[data-testid=comment-mark-resolving-btn]' :
        '[data-testid=comment-mark-answer-btn]').nth(0)

    const unresolvingUnanswerTextSelector = checkingResolveButton ? 
        'text=/^mark as resolving$/i' : 'text=/^mark as answer$/i'
    const resolvingAnswerTextSelector = checkingResolveButton ? 
        'text=/unmark as resolving/i' : 'text=/unmark as answer/i'
    const initialFirstResolveAnswerBtnStatus = await firstResolveAnswerBtn.locator(
        resolvingAnswerTextSelector).isVisible()

    const numResolvingAnswers = await page.locator(
        resolvingAnswerTextSelector).count()
    const postStatusShouldChange = (numResolvingAnswers === 0 ||
        numResolvingAnswers === 1 && initialFirstResolveAnswerBtnStatus)
    const postClickPostStatus = postStatusShouldChange ? 
        !initialPostStatus : initialPostStatus

    await Promise.all([
        firstResolveAnswerBtn.click(),
        firstResolveAnswerBtn.locator(initialFirstResolveAnswerBtnStatus ?
            unresolvingUnanswerTextSelector : 
            resolvingAnswerTextSelector).waitFor()
    ])

    const newCheckmarkPresent = await commentBoxLocator.nth(0).locator(
        '[data-testid=comment-check-icon]').isVisible()
    expect(newCheckmarkPresent).toBe(!initialFirstResolveAnswerBtnStatus)
    const newPostStatusResolvedStampPresent = await page.locator(
        '[data-testid=post-stats-bar]').locator(checkingResolveButton ?
            'text=/resolved/i' : 'text=/answered/i').isVisible()
    expect(newPostStatusResolvedStampPresent).toBe(postClickPostStatus)
    if (isMobile) {
        await page.locator('[data-testid=post-back-btn]').click()
    }
    const postListingMarkedResolved = (
        await listingLocator.locator(
            '[data-testid=green-checkmark-icon]').isVisible())
    expect(postListingMarkedResolved).toBe(postClickPostStatus)
})

exports.dbAssertFirstCommentEndorse = async (initialStatus) => {
    const firstCommentDbRow = (
        await this.getAllDbTopLevelThreadCommentsDisplayOrder(
            this.TEST_POST_INFO.id))[0]
    
    expect(firstCommentDbRow.endorsed).toBe(!initialStatus)
}

exports.assertOnNewestCommentInDb = async (comment, postId) => {
    const queryText = `
        SELECT display_content, created_at FROM comment
        WHERE post = $1
        ORDER BY created_at DESC LIMIT 1`
    const newestCommentQuery = await query(queryText, [postId])
    const { display_content } = newestCommentQuery.rows[0]
    expect(display_content).toMatch(new RegExp(comment))
}

const getPostViewsLikesCommentsFromDb = async (postId) => {
    const queryText = `
        WITH post_views AS (
            SELECT post AS viewed_post, COUNT(DISTINCT viewer) AS views
            FROM post_view WHERE post = $1 GROUP BY viewed_post),
            post_likes AS
            (SELECT post AS liked_post, COUNT(DISTINCT liker) AS likes
            FROM post_like WHERE post = $1 GROUP BY liked_post),
            post_comments AS
            (SELECT post AS commented_post, COUNT(DISTINCT comment_id) AS comments
            FROM comment WHERE post = $1 GROUP BY commented_post)
        SELECT views, likes, comments FROM post_views 
        LEFT JOIN post_likes ON viewed_post = liked_post
        LEFT JOIN post_comments ON viewed_post = commented_post;`

    const postInfoQuery = await query(queryText, [postId])
    const row = postInfoQuery.rows[0]
    return {
        views: parseInt(row.views || 0),
        likes: parseInt(row.likes || 0),
        comments: parseInt(row.comments || 0)
    }
}

const removeTags = s => {
    const keepChars = []
    let inTag = false
    for (const c of s) {
        if (inTag) {
            if (c === '>') inTag = false
            continue
        }
        if (c === '<') inTag = true
        keepChars.push(c)
    }

    return keepChars.join('')
}

const getUserLikedPostFromDb = async (userId, postId) => {
    const queryText= `
        SELECT post_like_id FROM post_like WHERE liker = $1 AND post = $2;`
    const userLikeQuery = await query(queryText, [userId, postId])
    return !!userLikeQuery.rows.length
}

const getDbPostContent = async (postId) => {
    const queryText = `SELECT display_content FROM post WHERE post_id = $1;`
    const displayContentQuery = await query(queryText, [postId])
    return displayContentQuery.rows[0].display_content
}

const stripBrackets = s => {
    const keepChars = []
    for (const c of s) {
        if (c == '<') continue
        keepChars.push(c)
    }

    return keepChars.join('')
}

const stripStartTermNewlines = s => {
    let start
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '\n') continue
        start = i
        break
    }
    let end
    for (let i = s.length - 1; i >= 0; i--) {
        if (s[i] === '\n') continue
        end = i
        break
    }

    return s.slice(start, end + 1)
}

exports.assertOnPostContent = async (dbRow, page) => {
    const {
        post_id, user_id: author_id, created_at, category_name, 
        anonymous: dbAnonymous, title: dbTitle, 
        resolved: dbResolved, answered: dbAnswered
    } = dbRow

    await new Promise(res => setTimeout(res, 100))
    const answeredLabelPresent = await page.locator(
        '[data-testid=post-stats-bar]').locator(
            'text=/answered/i').isVisible()
    const resolvedLabelPresent = await page.locator(
        '[data-testid=post-stats-bar]').locator(
            'text=/resolved/i').isVisible()
    expect(answeredLabelPresent).toBe(dbAnswered)
    expect(resolvedLabelPresent).toBe(dbResolved)

    const authorInfo = await this.getAvatarUrlAndNameFromDb(author_id)
    const { avatar_url, f_name, l_name } = authorInfo

    const pageTitle = await page.locator(
        '[data-testid=post-title]').innerText()
    expect(dbTitle).toMatch(new RegExp(
        this.stripTerminatingNewlines(pageTitle)))
    const pageAuthorAvatarUrl = await page.locator(
        '[data-testid=post-author-avatar-img]').getAttribute('src')
    expect(pageAuthorAvatarUrl).toBe(
        dbAnonymous ? ANONYMOUS_AVATAR_URL : avatar_url)
    const pageAuthorName = await page.locator(
        '[data-testid=post-author-header]').innerText()
    expect(dbAnonymous ? 'Anonymous' : `${ f_name } ${ l_name }`).toBe(
        pageAuthorName)
    const dbTimestamp = toTimestampString(
        fixNodePgUTCTimeInterpretation(created_at))
    const pageTimestamp = await page.locator(
        '[data-testid=post-stats-bar]').locator(
            '[data-testid=timestamp]').innerText()
    expect(dbTimestamp).toBe(pageTimestamp)
    const pageCategory = await page.locator(
        '[data-testid=post-category]').innerText()
    expect(this.stripTerminatingNewlines(pageCategory)
        ).toBe(category_name)

    const {
        views: dbViews, likes: dbLikes, comments: dbComments 
    } = await getPostViewsLikesCommentsFromDb(post_id)
    const pageViews = parseInt(await page.locator(
        '[data-testid=post-views]').innerText())
    const pageLikes = parseInt(await page.locator(
        '[data-testid=post-likes]').innerText())
    const pageComments = parseInt(await page.locator(
        '[data-testid=post-comments]').innerText())
    expect([dbViews, dbLikes, dbComments]).toEqual([
        pageViews, pageLikes, pageComments])
    const pagePost = await page.locator(
        '[data-testid=post-display-content]').innerText()
    const dbPost = stripBrackets(
        this.stripTerminatingNewlines(
            removeTags(await getDbPostContent(post_id))))
    for (const sentence of dbPost.split('.')) {
        expect(pagePost).toMatch(new RegExp(sentence))
    }
}

exports.assertOnPostControlPanelContent = async (dbRow, page, userId) => {
    const postLikeButtonLocator = page.locator(
        '[data-testid=post-like-button-container]')
    await expect(postLikeButtonLocator).toBeVisible()
    const userLiked = await getUserLikedPostFromDb(
        TESTUSER_REGISTERED.userId, dbRow.post_id)
    const likeButtonLabel = stripStartTermNewlines(
        await postLikeButtonLocator.innerText())
    expect(likeButtonLabel).toMatch(
        new RegExp(userLiked ? /^unlike$/i : /^like$/i))

    const postWatchButtonLocator = page.locator(
        '[data-testid=post-watch-button-container]')
    await expect(postWatchButtonLocator).toBeVisible()
    const watchButtonLabel = await postWatchButtonLocator.innerText()
    expect(watchButtonLabel).toMatch(
        new RegExp(!!dbRow.watch_id ? /unwatch/i : /watch/i))

    const postStarButtonLocator = page.locator(
        '[data-testid=post-star-button-container]')
    await expect(postStarButtonLocator).toBeVisible()
    
    const starButtonLabel = await postStarButtonLocator.innerText()
    expect(starButtonLabel).toMatch(
        new RegExp(!!dbRow.star_id ? /unstar/i : /star/i))
    
    const endorseButtonLocator = page.locator(
        '[data-testid=post-endorse-button-container]')
    const endorseButtonPresent = await endorseButtonLocator.isVisible()
    expect(endorseButtonPresent).toBe(userId === TESTUSER_STAFF.userId)

    const { user_id: author_id } = dbRow
    const editButtonPresent = await page.locator(
        '[data-testid=post-edit-button-container]').isVisible()

    const deleteButtonPresent = await page.locator(
        '[data-testid=post-delete-button-container]').isVisible()
    expect(editButtonPresent && deleteButtonPresent).toBe(userId === author_id)
}

exports.dbAssertPostControlPanelBooleanButton = (
async (button, newStatus, postId, userId) => {
    let table, userColumn
    if (button === 'Like') {
        table = 'post_like'
        userColumn = 'liker'
    } 
    else if (button === 'Watch') {
        table = 'post_watch'
        userColumn = 'watcher'
    }
    else if (button === 'Star') {
        table = 'post_star'
        userColumn = 'starrer'
    }
    let queryText, queryParams
    if (button === 'Endorse' || button === 'Delete') {
        queryText = `
            SELECT ${ button === 'Endorse' ? 'endorsed' : 'deleted' } 
            FROM post WHERE post_id = $1;`
        queryParams = [postId]
    }
    else {
        queryText = `
            SELECT * FROM ${ table } WHERE post = $1 AND ${ userColumn } = $2;`
        queryParams = [postId, userId]
    }

    const checkQuery = await query(queryText, queryParams)
    let dbStatus
    if (button === 'Like' || button === 'Watch' || button === 'Star') {
        dbStatus = !!checkQuery.rows.length
    }
    else dbStatus = checkQuery.rows[0][
        button === 'Endorse' ? 'endorsed' : 'deleted']

    expect(dbStatus).toBe(newStatus)
})

exports.getPostIdFromTitle = async (title) => {
    const queryText = `SELECT post_id FROM post WHERE title = $1;`
    const queryParams = [title]
    const postIdQuery = await query(queryText, queryParams)
    
    return postIdQuery.rows[0].post_id
}

exports.dbUndeletePost = async (postId) => {
    const queryText = `UPDATE post SET deleted = $1 WHERE post_id = $2;`
    const queryParams = [false, postId]
    await query(queryText, queryParams)
}

exports.uiAssertPostControlPanelBooleanButton = (
async (button, status, postListingLocator, postTitle, isMobile, page) => {

   const notDeleted = button !== 'Delete' || !status
   if (isMobile && notDeleted) await Promise.all([
        page.locator('[data-testid=post-back-btn]').click(),
        postListingLocator.waitFor()
    ])
    let numLikes, uiStatus
    if (button === 'Like') {
        const likeIconVisible = (
            await postListingLocator.locator(
                '[data-testid=likes-icon]').isVisible())
        numLikes = !likeIconVisible ? 0 : parseInt(
            await postListingLocator.locator(
                '[data-testid=likes-icon]').innerText())
    }
    else if (button === 'Watch') {
        uiStatus = await postListingLocator.locator(
            '[data-testid=watching-icon]').isVisible()
    }
    else if (button === 'Star') {
        uiStatus = await postListingLocator.locator(
            '[data-testid=star-icon]').isVisible()
    }
    else if (button === 'Endorse') {
        uiStatus = await postListingLocator.locator(
            '[data-testid=endorsed-icon]').isVisible()
    }
    else { // button === 'Delete'
        const t = await postListingLocator.locator(
            '[data-testid=post-info-title]').innerText()
        uiStatus = !(new RegExp(t, 'i')).test(postTitle)
    }

    if (isMobile && (button !== 'Delete' || !status)) {
        await postListingLocator.click()
    }
    if (uiStatus !== undefined) expect(uiStatus).toBe(status)
    else return numLikes
})

exports.editPost = async (page, editorLocator, text) => {
    const editorPresent = await editorLocator.isVisible()
    if (!editorPresent) {
        await Promise.all([
            page.locator('[data-testid=post-edit-button-container]').click(),
            editorLocator.waitFor()
        ])
    }
    await editorLocator.fill(text)
    const newEditorContents = await editorLocator.innerText()
    expect(newEditorContents).toMatch(new RegExp(text))
    await Promise.all([
        page.locator('[data-testid=editor-submit-button]').click(),
        editorLocator.waitFor({ state: 'hidden' }),
        page.locator('[data-testid=post-display-content]').waitFor()
    ])
}

exports.dbAssertEditedPost = async (text, postId) => {
    const displayContentQueryText = `
        SELECT display_content FROM post WHERE post_id = $1;`
    const displayContentQueryParams = [postId]
    const displayContentQuery = await query(
        displayContentQueryText, displayContentQueryParams)

    const displayContent = this.stripTagsNewLine(
        displayContentQuery.rows[0].display_content)
    for (const sentence of displayContent.split('.')) {
        expect(text).toMatch(new RegExp(sentence))
    }
}

exports.stripSlashNewlines = (s) => {
    const keepChars = []
    for (const c of s) {
        if (c === '/' || c === '\n') continue
        keepChars.push(c)
    }

    return keepChars.join('')
}

exports.dbAssertThenRemoveTestPostFromDb = async (pageTitle) => {
    const dbTitleQueryText = `SELECT title, post_id FROM post WHERE post_id = (
        SELECT MAX(post_id) FROM post);`
    const dbTitleQuery = await query(dbTitleQueryText)
    const { title: dbTitle, post_id } = dbTitleQuery.rows[0]
    expect(dbTitle).toMatch(new RegExp(pageTitle))

    const removeTestPostNotifsQueryText = `
    DELETE FROM notification WHERE gen_post = $1;`
    await query(removeTestPostNotifsQueryText, [post_id])
    const removeTestPostQueryText = 
    `DELETE FROM post WHERE post_id = (
        SELECT MAX(post_id) FROM post);`
    await query(removeTestPostQueryText)
}

exports.assertOnPostControlPanelButtonLabelChange = (
async (falseLabel, trueLabel, preClickButtonStatus, buttonLocator, page) => {
    if (falseLabel === 'Delete') {
        let visStatus = true
        while (visStatus) {
            visStatus = await page.locator(
                '[data-testid=post-content-container]').isVisible()
        }
    }
    else {
        const newLabel = await buttonLocator.innerText()
        expect(newLabel).toMatch(new RegExp(preClickButtonStatus ?
            falseLabel : trueLabel))
    }
})

exports.writeAssertOnNewPost = async (editorLocator, page, testTitle) => {
    const preEntryEditorText = await editorLocator.innerText()
    expect(this.stripTerminatingNewlines(preEntryEditorText).length).toBe(0)
    const testContent = "test post content"
    await editorLocator.type(testContent)
    const postEntryEditorText = await editorLocator.innerText()
    expect(postEntryEditorText).toMatch(new RegExp(
        this.stripTerminatingNewlines(testContent)))

    const newListingLocator = page.locator(
        '[data-testid=post-info-container]').locator(
            `text=${ testTitle }`)
    await Promise.all([
        page.locator('[data-testid=editor-submit-button]').click(),
        page.locator('[data-testid=new-post-container]').waitFor({
            state: 'hidden' }),
        newListingLocator.waitFor()
    ])
    await Promise.all([page.reload(), newListingLocator.waitFor()])
}

exports.checkPostAttribute = async (postAttributeCheckLocator) => {
    const preClickCheck = (
        await postAttributeCheckLocator.isChecked())
    expect(preClickCheck).toBe(false)
    await postAttributeCheckLocator.check()
    const postClickCheck = (
        await postAttributeCheckLocator.isChecked())
    expect(postClickCheck).toBe(true)
}