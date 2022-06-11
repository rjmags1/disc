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
        resp.status(400).json({ message: "suppled params invalid" })
        return
    }
    const { 
        title, category, isQuestion, isAnnouncement, displayContent,
        isPrivate, isPinned, isAnonymous, createdAt, editContent, courseId
    } = req.body
    const {
        user_id: userId, f_name: firstName, l_name: lastName,
        is_staff: isStaff, is_instructor: isInstructor
    } = req.session.user
    let insertPostQuery, insertFailure, client
    try {
        client = await getClientFromPool()
        const insertPostQueryText = `
            WITH course_categories AS (
                SELECT category_id, name FROM post_category WHERE course = $1)

            INSERT INTO post (
                category, 
                author, created_at, title, edit_content,
                display_content, pinned, endorsed, is_question, is_announcement, 
                answered, resolved, private, deleted, anonymous)
            VALUES (
                (SELECT category_id FROM course_categories WHERE name = $2),
                $3, $4, $5, $6, 
                $7, $8, false, $9, $10,
                false, false, $11, false, $12
            )
            RETURNING *;`
        const insertPostQueryParams = [
            courseId,
            category,
            userId, new Date(createdAt), title, editContent,
            displayContent, isPinned, isQuestion, isAnnouncement,
            isPrivate, isAnonymous
        ]

        insertPostQuery = await clientQuery(
            client, insertPostQueryText, insertPostQueryParams)
        insertFailure = insertPostQuery.rows.length === 0

        if (!insertFailure) {
            const mentions = parseForMentionTokens(displayContent)
            if (mentions.length > 0) {
                await genMentionNotifsInDb(client, mentions, 
                    insertPostQuery.rows[0].post_id, true)
            }
        }
    }
    catch (error) {
        insertFailure = true
        console.error(error)
    }
    finally {
        await releaseClient(client)
    }
    if (insertFailure) {
        resp.status(500).json({ message: "internal server error"} )
        return
    }

    const row = insertPostQuery.rows[0]
    const newPostInfo = {
        anonymous: row.anonymous,
        answered: row.answered,
        authorId: row.author,
        author: `${ firstName } ${ lastName }`,
        authorIsStaffOrInstructor: isStaff || isInstructor,
        category,
        categoryId: row.category,
        comments: 0,
        createdAt: row.created_at,
        endorsed: row.endorsed,
        isQuestion: row.is_question,
        lastViewedAt: null,
        liked: false,
        likes: 0,
        mostRecentCommentTime: null,
        postId: row.post_id,
        private: row.private,
        starred: false,
        title: row.title,
        watched: false
    }

    resp.status(200).json({ newPostInfo })

}, sessionOptions)

const invalidParams = (reqBody) => {
    const { 
        title, category, isQuestion, isAnnouncement, displayContent,
        isPrivate, isPinned, isAnonymous, createdAt, editContent, courseId
    } = reqBody

    if ([title, category, displayContent].some(
        s => typeof(s) !== 'string')) return true
    if ([isQuestion, isAnnouncement, isPrivate, isPinned, isAnonymous].some(
        b => typeof(b) !== 'boolean')) return true
    if (new Date(createdAt).toString() === 'Invalid Date') return true
    if (typeof(editContent) !== 'object') return true
    if (typeof(courseId) !== 'number') return true
}