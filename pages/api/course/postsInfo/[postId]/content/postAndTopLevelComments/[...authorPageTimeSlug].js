import { sessionOptions } from "../../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { fixNodePgUTCTimeInterpretation } from "../../../../../../../lib/time"
import { 
    getClientFromPool, 
    clientQuery, 
    releaseClient 
} from "../../../../../../../db"

const TOP_LEVEL_COMMENTS_PER_PAGE = 20
const INITIAL_NESTED_COMMENTS = 2

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not authenticated" })
        return
    }
    const userId = req.session.user.user_id
    const slug = req.query?.authorPageTimeSlug
    if (!slug || slug.length !== 3) {
        resp.status(400).json({ message: "bad url params" })
        return
    }
    const [author, page, loadAfter] = slug
    const postId = parseInt(req.query?.postId)
    const authorId = parseInt(author)
    const pageNumber = parseInt(page)
    const parsedTimeCutoff = parseInt(loadAfter)
    if ([postId, authorId, pageNumber, parsedTimeCutoff].some(
        param => !param || param < 1)) {
        resp.status(400).json({ message: "bad url params" })
        return
    }


    let postContentQuery, ancestorCommentQuery, descendantCommentQuery, dbClient
    let transactionFailed = false
    try {
        // checkout client, may need to perform multiple queries
        dbClient = await getClientFromPool()

        if (pageNumber === 1) { // also need to fetch post content

            // retrieval of edit information cond. on if user is post author
            const postContentQueryText = (userId === authorId ?
                postContentQueryTextWithEC : postContentQueryTextNoEC)
            postContentQuery = (await clientQuery(
                dbClient, postContentQueryText, [postId, authorId]))
        }
        else postContentQuery = null
        
        
        // always retrieve the requested page of ancestor comments
        // and their first two descendants
        ancestorCommentQuery = (await clientQuery(
            dbClient, ancestorCommentQueryText(pageNumber),
                [postId, new Date(parsedTimeCutoff), userId]))
        const ancestorCommentIds = ancestorCommentQuery.rows.map(
            row => row.comment_id).slice(0, TOP_LEVEL_COMMENTS_PER_PAGE)
        
        if (ancestorCommentIds.length > 0) {
            const descendantCommentQueryText = (
                descendantQueryTextFromAncestors(ancestorCommentIds.length))
            descendantCommentQuery = (
                await clientQuery(dbClient, descendantCommentQueryText, [
                    postId, userId, ...ancestorCommentIds
                ])
            )
        }
        else descendantCommentQuery = { rows: [] }
    }
    catch (error) {
        transactionFailed = true
        resp.status(500).json({ message: "internal server error" })
    }
    finally {
        await releaseClient(dbClient)
    }
    if (transactionFailed) return



    // process query results. we ask for an extra row of ancestor comments
    // to determine if there is another page to load 
    const nextPage = (
        ancestorCommentQuery.rows.length > TOP_LEVEL_COMMENTS_PER_PAGE ?
            pageNumber + 1 : null)
    const postInfo = postContentQuery === null ? undefined : {}
    if (postContentQuery !== null) {
        postInfo.avatarUrl = postContentQuery.rows[0].avatar_url
        postInfo.displayContent = postContentQuery.rows[0].display_content
        postInfo.editContent = postContentQuery.rows[0].edit_content
        postInfo.views = parseInt(postContentQuery.rows[0].views)
    }
    
    const ancestorRows = ancestorCommentQuery.rows
    const ancestorInfo = processAncestorCommentRows(
        ancestorRows.length === TOP_LEVEL_COMMENTS_PER_PAGE + 1 ? 
        ancestorRows.slice(0, ancestorRows.length - 1) : ancestorRows, userId)
    const descendantInfo = processDescendantCommentRows(
        descendantCommentQuery.rows, userId)



    // send the paginated response along with bool <- more pages or not
    resp.status(200).json({ nextPage, postInfo, ancestorInfo, descendantInfo, })

}, sessionOptions)



const processDescendantCommentRows = (rows, userId) => {
    if (rows.length === 0) return null

    const processed = []
    for (const row of rows) {
        processed.push({
            commentId: row.comment_id,
            author: `${ row.f_name } ${ row.l_name }`,
            authorId: row.user_id,
            avatarUrl: row.avatar_url,
            editContent: row.user_id === userId ? row.edit_content : null,
            displayContent: row.display_content,
            createdAt: fixNodePgUTCTimeInterpretation(row.created_at),
            threadId: row.thread_id,
            isResolving: row.is_resolving,
            isAnswer: row.is_answer,
            endorsed: row.endorsed,
            deleted: row.deleted,
            anonymous: row.anonymous,
            ancestorComment: row.ancestor_comment,
            loadMoreButtonBelow: false,
            likes: row.likes || 0,
            liked: !!row.user_like
        })
    }

    // map descendant comments to their ancestor
    const ancestorToDesc = {}
    processed.forEach((desc) => {
        const { ancestorComment } = desc
        if (!(ancestorComment in ancestorToDesc)) {
            ancestorToDesc[ancestorComment] = []
        }
        ancestorToDesc[ancestorComment].push(desc)
    })
    for (const threadComments of Object.values(ancestorToDesc)) {
        threadComments.sort((c1, c2) => c1.threadId > c2.threadId ? 1 : -1)
        if (threadComments.length === 3) {
            threadComments[1].loadMoreButtonBelow = true
            threadComments.pop()
        }
    }
    return ancestorToDesc
}


const processAncestorCommentRows = (rows, userId) => rows.map(
    row => ({
        commentId: row.comment_id,
        author: `${ row.f_name } ${ row.l_name }`,
        authorId: row.user_id,
        avatarUrl: row.avatar_url,
        editContent: row.user_id === userId ? row.edit_content : null,
        displayContent: row.display_content,
        createdAt: fixNodePgUTCTimeInterpretation(row.created_at),
        threadId: row.thread_id,
        isResolving: row.is_resolving,
        isAnswer: row.is_answer,
        endorsed: row.endorsed,
        deleted: row.deleted,
        anonymous: row.anonymous,
        ancestorComment: row.ancestor_comment,
        likes: row.likes || 0,
        liked: !!row.user_like
    })
)


const descendantQueryTextFromAncestors = (ancestorComments) => {
    // dynamically generate query for descendant comments of multiple ancestor
    // comments, based on the number of ancestor comments and their ids

    const tokens = [`SELECT 
        comment_id, user_id, f_name, l_name, avatar_url, edit_content, display_content, created_at,
        is_resolving, is_answer, endorsed, deleted, anonymous, thread_id, ancestor_comment, likes, user_like FROM (`]
    
    // get the first two descendant comments in a thread, plus a third to tell
    // if there are anymore descendant comments to load for a particular thread
    for (let i = 0; i < ancestorComments; i++) {
        tokens.push(`(
            SELECT comment_id FROM comment 
            WHERE post = $1 AND ancestor_comment = $${ i + 3 }
            ORDER BY thread_id
            LIMIT ${ INITIAL_NESTED_COMMENTS + 1 })`)

        if (i < ancestorComments - 1) tokens.push(" UNION ")
    }
    tokens.push(") AS old_descendants LEFT JOIN ")
    tokens.push(`
        (SELECT
            comment_id as cid, author, edit_content, display_content, created_at,
            is_resolving, is_answer, endorsed, deleted, anonymous, thread_id, ancestor_comment
        FROM comment 
        WHERE post = $1 AND ancestor_comment IS NOT NULL AND thread_id < '00004')
        AS comment_info 
        ON old_descendants.comment_id = comment_info.cid
        LEFT JOIN (SELECT user_id, f_name, l_name, avatar_url AS avatar FROM person)
        AS people 
        ON user_id = author
        LEFT JOIN avatar_url ON avatar_url_id = people.avatar
        LEFT JOIN (SELECT likes, liked_comment_id FROM (
            SELECT comment_id AS liked_comment_id FROM comment 
            WHERE post = $1 AND ancestor_comment IS NOT NULL) 
            AS comments 
            LEFT JOIN (
                SELECT COUNT(DISTINCT liker) as likes, comment FROM comment_like 
                GROUP BY comment
            ) AS comment_likes ON comment_likes.comment = comments.liked_comment_id
        ) AS c_likes
        ON liked_comment_id = comment_id
        LEFT JOIN (
            SELECT comment AS liked_comment, liker AS user_like 
            FROM comment_like 
            WHERE liker = $2
        ) AS user_comment_like
        ON liked_comment = comment_id;`)

    return tokens.join("")
}


const postContentQueryTextWithEC = `
    SELECT display_content, edit_content, avatar_url, views 
    FROM (
            SELECT post_id, display_content, edit_content, author 
            FROM post 
            WHERE post_id = $1)
        AS post
        JOIN (
            SELECT user_id, avatar_url AS avatar
            FROM person
            WHERE user_id = $2)
        AS person
        ON author = user_id
        JOIN avatar_url 
        ON avatar_url_id = person.avatar
        JOIN (
            SELECT COUNT(DISTINCT viewer) AS views, post AS viewed_post
            FROM post_view 
            WHERE post = $1
            GROUP BY viewed_post)
        AS post_views
        ON post_id = viewed_post;`


const postContentQueryTextNoEC = `
    SELECT display_content, avatar_url, views
    FROM (
        SELECT post_id, display_content, author 
        FROM post 
        WHERE post_id = $1)
    AS post
    JOIN (
        SELECT user_id, avatar_url AS avatar
        FROM person
        WHERE user_id = $2)
    AS person
    ON author = user_id
    JOIN avatar_url 
    ON avatar_url_id = person.avatar
    JOIN (
        SELECT COUNT(DISTINCT viewer) AS views, post AS viewed_post
        FROM post_view 
        WHERE post = $1
        GROUP BY viewed_post)
    AS post_views
    ON post_id = viewed_post;`


const ancestorCommentQueryText = (pageNumber) => `
    SELECT 
        comment_id, user_id, f_name, l_name, avatar_url, edit_content, display_content, 
        created_at, is_resolving, is_answer, endorsed, deleted, anonymous, likes, user_like 
    FROM
        (SELECT 
            comment_id, author, edit_content, display_content, created_at,
            is_resolving, is_answer, endorsed, deleted, anonymous
        FROM comment
        WHERE post = $1 AND ancestor_comment IS NULL AND created_at < $2
        ORDER BY created_at ASC
        LIMIT ${ TOP_LEVEL_COMMENTS_PER_PAGE + 1 }
        OFFSET ${ (TOP_LEVEL_COMMENTS_PER_PAGE) * (pageNumber - 1) })
        AS comments
        LEFT JOIN (SELECT user_id, f_name, l_name, avatar_url AS avatar FROM person)
        AS people 
        ON user_id = author
        LEFT JOIN avatar_url ON avatar_url_id = people.avatar
        LEFT JOIN (SELECT likes, liked_comment_id FROM (
            SELECT comment_id AS liked_comment_id FROM comment 
            WHERE post = $1 AND ancestor_comment IS NULL AND created_at < $2) 
            AS comments 
            LEFT JOIN (
                SELECT COUNT(DISTINCT liker) as likes, comment FROM comment_like 
                GROUP BY comment
            ) AS comment_likes ON comment_likes.comment = comments.liked_comment_id
        ) AS c_likes
        ON liked_comment_id = comment_id
        LEFT JOIN (
            SELECT comment AS liked_comment, liker AS user_like 
            FROM comment_like 
            WHERE liker = $3
        ) AS user_comment_like
        ON liked_comment = comment_id
    ORDER BY created_at ASC;`