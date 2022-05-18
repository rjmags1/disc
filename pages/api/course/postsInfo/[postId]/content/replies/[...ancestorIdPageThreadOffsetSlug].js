import { sessionOptions } from "../../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { fixNodePgUTCTimeInterpretation } from "../../../../../../../lib/time"
import { query } from '../../../../../../../db/index'

const COMMENTS_PER_PAGE = 50

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
    const slug = req.query?.ancestorIdPageThreadOffsetSlug
    if (!slug || slug.length !== 3) {
        resp.status(400).json({ message: "bad url params" })
        return
    }
    const [ancestorId, page, threadOffset] = slug
    console.log(ancestorId, page, threadOffset)

    const parsedAncestorId = parseInt(ancestorId, 10)
    const parsedPage = parseInt(page, 10)
    const splitThreadOffset = threadOffset.split(".")
    if ([parsedAncestorId, parsedPage].some(param => !param || param < 1)
        || !splitThreadOffset.length || splitThreadOffset.some(
            token => !parseInt(token, 10) || !(token.length === 5))) {

        resp.status(400).json({ message: "bad url params" })
        return
    }


    let replyQuery
    try {
        replyQuery = await query(
            replyQueryText(page), [parsedAncestorId, threadOffset, userId])
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    const nextPage = (
        replyQuery.rows.length > COMMENTS_PER_PAGE ? parsedPage + 1 : null)
    if (!!nextPage) replyQuery.rows.pop()
    const replies = processRows(replyQuery.rows, userId)


    resp.status(200).json({ replies, nextPage })

}, sessionOptions)

const processRows = (rows, userId) => rows.map(row => ({
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
    liked: !!row.liked
}))

const replyQueryText = (page) => `
            SELECT 
                comment_id, user_id, f_name, l_name, avatar_url, edit_content,
                display_content, created_at, is_resolving, is_answer, endorsed,
                deleted, anonymous, likes, thread_id, ancestor_comment
            FROM (
                SELECT 
                    comment_id, author, edit_content, display_content, created_at, thread_id,
                    is_resolving, is_answer, endorsed, deleted, anonymous, ancestor_comment
                FROM comment
                WHERE ancestor_comment = $1 AND thread_id IS NOT NULL 
                    AND thread_id > $2 
                LIMIT ${ COMMENTS_PER_PAGE + 1 }
                OFFSET ${ (page - 1) * COMMENTS_PER_PAGE }
            ) AS replies
            LEFT JOIN (SELECT user_id, f_name, l_name, avatar_url AS avatar FROM person)
            AS people 
            ON user_id = author
            LEFT JOIN avatar_url ON avatar_url_id = people.avatar
            LEFT JOIN (SELECT likes, liked_comment_id FROM (
                SELECT comment_id AS liked_comment_id FROM comment
                WHERE ancestor_comment = $1 AND thread_id IS NOT NULL 
                    AND thread_id > $2)
                AS liked_replies
                LEFT JOIN (
                    SELECT COUNT(DISTINCT liker) as likes, comment 
                    FROM comment_like
                    GROUP BY comment
                ) AS comment_likes ON comment_likes.comment = liked_replies.liked_comment_id
            ) AS c_likes
            ON liked_comment_id = comment_id
            LEFT JOIN (
                SELECT comment AS liked_comment, liker AS user_like 
                FROM comment_like 
                WHERE liker = $3
            ) AS user_comment_like
            ON liked_comment = comment_id
            ORDER BY thread_id;`