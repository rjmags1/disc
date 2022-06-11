import { sessionOptions } from "../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { 
    getClientFromPool, clientQuery, releaseClient 
} from '../../../../../../db/index'
import {
    genMentionNotifsInDb, parseForMentionTokens 
} from "../../../../../../lib/mention"

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not authenticated" })
        return
    }
    if (invalidParams(req.body)) {
        resp.status(400).json({ message: "supplied params invalid" })
        return
    }
    const {
        post, ancestorComment, threadId, editContent,
        displayContent, createdAt, anonymous
    } = req.body
    const userId = req.session.user.user_id
    let insertCommentQuery, insertFailure, client
    try {
        client = await getClientFromPool()
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

        insertCommentQuery = (await clientQuery(
            client, insertCommentQueryText, insertCommentQueryParams))
        insertFailure = insertCommentQuery.rows.length === 0
        
        if (!insertFailure) {
            const postId = post, commentId = insertCommentQuery.rows[0].comment_id
            await genWatchNotifsInDb(client, postId, commentId)
            await genUserPostActivityNotifInDb(client, commentId, postId)
            if (ancestorComment !== null) await genCommentReplyNotifInDb(
                client, ancestorComment, threadId, commentId)
            const mentions = parseForMentionTokens(displayContent)
            if (mentions.length > 0) await genMentionNotifsInDb(
                client, mentions, commentId, false)
        }
    }
    catch (error) {
        console.error(error)
        insertFailure = true
    }
    finally {
        await releaseClient(client)
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

const getWatchNotifPeopleQueryText = `
    SELECT watcher FROM post_watch WHERE post = $1;`
const genWatchNotifsQueryArgs = (watchers, genCommentId) => {
    const tokens = [
        "INSERT INTO notification (gen_comment, is_watch_noti, person) VALUES "]
    const params = [genCommentId, true]
    for (let i = 0; i < watchers.length; i++) {
        params.push(watchers[i])
        tokens.push(i < watchers.length - 1 ? 
            `($1, $2, $${i + 3}), ` : `($1, $2, $${i + 3});`)
    }

    return [tokens.join(''), params]
}

const genWatchNotifsInDb = async (client, postId, commentId) => {
    const watchersQuery = await clientQuery(
        client, getWatchNotifPeopleQueryText, [postId])
    const watcherIds = watchersQuery.rows.map(r => r.watcher)
    if (watcherIds.length === 0) return

    await clientQuery(client, ...genWatchNotifsQueryArgs(watcherIds, commentId))
}

const genUserPostActivityNotifInDb = (
async (client, commentId, postId) => {
    const postAuthorQuery = await clientQuery(
        client, 'SELECT author FROM post WHERE post_id = $1;', [postId])
    const postAuthorId = postAuthorQuery.rows[0].author
    const genNotifQueryText = `
        INSERT INTO notification 
        (person, is_user_post_activity_noti, gen_comment)
        VALUES ($1, $2, $3);`
    await clientQuery(client, genNotifQueryText, [postAuthorId, true, commentId])
})

const genCommentReplyNotifInDb = (
async (client, ancestorCommentId, replyThreadId, genCommentId) => {
    const repliedToCommentQueryText = `
        SELECT comment_id FROM comment 
        WHERE ancestor_comment = $1 AND thread_id = (
            SELECT MAX(thread_id) FROM comment 
            WHERE ancestor_comment = $1 AND thread_id < $2);`
    const repliedToCommentQuery = await clientQuery(
        client, repliedToCommentQueryText, [ancestorCommentId, replyThreadId])

    const repliedToCommentId = repliedToCommentQuery.rows[0].comment_id
    const notifiedPersonQueryText = `
        SELECT author FROM comment WHERE comment_id = $1;`
    const notifiedPersonQuery = await clientQuery(
        client, notifiedPersonQueryText, [repliedToCommentId])

    const notifiedPersonId = notifiedPersonQuery.rows[0].author
    const genReplyNotifQueryText = `
        INSERT INTO notification 
        (person, gen_comment, is_user_comment_reply_noti)
        VALUES ($1, $2, $3);`
    await clientQuery(
        client, genReplyNotifQueryText, [notifiedPersonId, genCommentId, true])
})