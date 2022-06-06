const { query } = require('./db')
const { expect } = require('@playwright/test')
const { 
    toTimestampString, fixNodePgUTCTimeInterpretation 
} = require('./time')

const ANONYMOUS_AVATAR_URL = "/profile-button-img.png"

exports.TEST_POST_INFO = {
    id: 94,
    title: "Iste et explicabo voluptatem doloribus eos sit veniam neque."
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

exports.getAvatarUrlAndName = async (userId) => {
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

exports.assertOnEndorsedCheckBadges = (
async (dbCommentInfo, commentBoxLocator) => {
    const {
        deleted, endorsed, is_resolving, is_answer 
    } = dbCommentInfo

    const endorsedIconPresent = await commentBoxLocator.locator(
        'comment-endorsed-icon').isVisible()
    expect(endorsedIconPresent).toBe(!deleted && endorsed)

    const checkIconPresent = await commentBoxLocator.locator(
        'comment-check-icon').isVisible()
    expect(checkIconPresent).toBe(!deleted && (is_resolving || is_answer))
})

exports.assertOnTimestampAuthor = (
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
    expect(editPresent).toBe(userId === authorId)
    expect(deletePresent).toBe(userId === authorId)
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