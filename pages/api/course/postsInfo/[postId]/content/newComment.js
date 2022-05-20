import { sessionOptions } from "../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { query } from '../../../../../../db/index'
import { fixNodePgUTCTimeInterpretation } from "../../../../../../lib/time"

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not authenticated" })
        return
    }
    console.log(req.body)
    if (invalidParams(req.body)) {
        resp.status(400).json({ message: "supplied params invalid" })
        return
    }
    const {
        post, ancestorComment, threadId, editContent,
        displayContent, createdAt, anonymous
    } = req.body
    const userId = req.session.user.user_id
    let insertCommentQuery, insertFailure
    try {
        const insertCommentQueryText = `
            INSERT INTO comment (
                author, post, ancestor_comment, thread_id, edit_content,
                display_content, created_at, is_resolving, is_answer,
                endorsed, deleted, anonymous)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;`
        const insertCommentQueryParams = [
            userId, post, ancestorComment, threadId, editContent, displayContent,
            new Date(createdAt), false, false, false, false, anonymous
        ]

        insertCommentQuery = (
            await query(insertCommentQueryText, insertCommentQueryParams))
    }
    catch (error) {
        console.error(error)
        insertFailure = true
    }
    if (insertFailure) {
        resp.status(500).json({ message: "internal server error" })
        return
    }

    const row = insertCommentQuery.rows[0]
    const { 
        f_name: firstName, l_name: lastName, avatar_url: avatarUrl 
    } = req.session.user
    const newCommentInfo = {
        commentId: row.comment_id, authorId: row.author, postId: row.post,
        ancestorComment: row.ancestor_comment, threadId: row.thread_id,
        editContent: row.edit_content, displayContent: row.display_content,
        createdAt: row.created_at, 
        isResolving: row.is_resolving, isAnswer: row.is_answer, 
        endorsed: row.endorsed, loadMoreButtonBelow: false,
        deleted: row.deleted, anonymous: row.anonymous, avatarUrl,
        author: `${ firstName } ${ lastName }`, liked: false, likes: 0
    }

    resp.status(200).json({ newCommentInfo })

}, sessionOptions)

const invalidParams = (reqBody) => {
    const {
        post, ancestorComment, threadId, editContent,
        displayContent, createdAt, anonymous
    } = reqBody

    if (!post || !Number.isInteger(post) || post < 1) return true
    if (ancestorComment !== null && ( 
        !Number.isInteger(ancestorComment) || 
        ancestorComment < 1)) return true
    if (threadId !== null && 
        typeof(threadId) !== 'string') return true
    if (threadId !== null) {
        const splitThreadId = threadId.split(".")
        if (!splitThreadId.length || splitThreadId.some(
            token => token.length !== 5 || !Number.isInteger(parseInt(token)))) {
            return true
        }
    }
    if (typeof(editContent) !== 'object') return true
    if (typeof(displayContent) !== 'string') return true
    if (new Date(createdAt).toString() === 'Invalid Date') return true
    if (typeof(anonymous) !== 'boolean') return true
}