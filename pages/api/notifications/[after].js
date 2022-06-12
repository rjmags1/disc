import {
    getClientFromPool, clientQuery, releaseClient 
} from '../../../db/index'
import { sessionOptions } from '../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not logged in" })
        return
    }
    const userId = req.session.user.user_id
    const { after } = req.query
    const parsedAfterTimestamp = parseInt(after)
    if (!Number.isInteger(parsedAfterTimestamp)) {
        resp.status(400).json({
            message: "invalid after timestamp in request url" })
        return
    }
    const afterDate = new Date(parsedAfterTimestamp)

    let client, notifs = []
    let queryFailure = false
    try {
        client = await getClientFromPool()
        const getNotifsQuery = await clientQuery(
            client, notifsQueryText, [userId, afterDate])
        for (const row of getNotifsQuery.rows) {
            const notif = await getNotifInfoFromDbRow(client, row)
            notifs.push(notif)
        }
    }
    catch (error) {
        console.error(error)
        queryFailure = true
    }
    finally {
        await releaseClient(client)
    }
    if (queryFailure) {
        resp.status(500).json({ message: "internal server error" })
        return
    }

    const filteredNotifs = notifs.filter(n => n.notifGenAuthor !== userId)
    resp.status(200).json({ notifications: filteredNotifs })

}, sessionOptions)



const getNotifInfoFromDbRow = async (client, {
    gen_comment, gen_post,
    is_watch_noti, is_user_post_activity_noti, is_user_comment_reply_noti,
    is_mention_noti, is_announcement_noti
}) => {
    if (is_watch_noti) {
        const notifInfo  = await getWatchUserPostActCommentReplyNotifInfo(
                client, gen_comment)
        return { type: "watch", ...notifInfo }
    }
    else if (is_user_post_activity_noti) {
        const notifInfo  = await getWatchUserPostActCommentReplyNotifInfo(
                client, gen_comment)
        return { type: "userPostActivity", ...notifInfo }
    }
    else if (is_user_comment_reply_noti) {
        const notifInfo  = await getWatchUserPostActCommentReplyNotifInfo(
                client, gen_comment)
        return { type: "userCommentReply", ...notifInfo }
    }
    else if (is_mention_noti) {
        const genIsPost = !!gen_post
        const genId = genIsPost ? gen_post : gen_comment
        const notifInfo = await getUserMentionNotifInfo(client, genId, genIsPost)
        return { type: "mention", ...notifInfo }
    }
    else if (is_announcement_noti) {
        const notifInfo = await getAnnouncementNotifInfo(client, gen_post)
        return { type: "announcement", ...notifInfo }
    }
}

const getWatchUserPostActCommentReplyNotifInfo = async (client, genCommentId) => {
    const commentAuthorQuery = await clientQuery(
        client, commentAuthorQueryText, [genCommentId])
    const { f_name, l_name } = commentAuthorQuery.rows[0]
    const postQuery = await clientQuery(
        client, postFromCommentQueryText, [genCommentId])
    const { post: post_id } = postQuery.rows[0]
    const postTitleQuery = await clientQuery(
        client, postAuthorTitleQueryText, [post_id])
    const { title } = postTitleQuery.rows[0]
    const commentCourseQuery = await clientQuery(
        client, courseFromCommentQueryText, [genCommentId])
    const { course_id, course_name } = commentCourseQuery.rows[0]

    return {
        notifGenAuthor: `${ f_name } ${ l_name }`,
        postTitle: title,
        courseName: course_name,
        courseId: course_id
    }
}

const getUserMentionNotifInfo = async (client, genId, genIsPost) => {
    const authorQueryText = genIsPost ? 
        postAuthorTitleQueryText : commentAuthorQueryText
    const authorQuery = await clientQuery(
        client, authorQueryText, [genId])
    const { f_name, l_name } = authorQuery.rows[0]
    const courseQueryText = genIsPost ?
        courseFromPostQueryText : courseFromCommentQueryText
    const courseQuery = await clientQuery(client, courseQueryText, [genId])
    const { course_id, course_name } = courseQuery.rows[0]
    let thePostId = genId
    if (!genIsPost) {
        const postQuery = await clientQuery(
            client, postFromCommentQueryText, [genId])
        const { post: post_id } = postQuery.rows[0]
        thePostId = post_id
    }
    const postTitleQuery = await clientQuery(
        client, postAuthorTitleQueryText, [thePostId])
    const title = postTitleQuery.rows[0].title

    return {
        notifGenAuthor: `${ f_name } ${ l_name }`,
        courseName: course_name,
        courseId: course_id,
        postTitle: title,
        mentionedInPost: genIsPost
    }
}

const getAnnouncementNotifInfo = async (client, postId) => {
    const postAuthorQuery = await clientQuery(
        client, postAuthorTitleQueryText, [postId])
    const { f_name, l_name } = postAuthorQuery.rows[0]
    const courseQuery = await clientQuery(
        client, courseFromPostQueryText, [postId])
    const { course_id, course_name } = courseQuery.rows[0]

    return {
        notifGenAuthor: `${ f_name } ${ l_name }`,
        courseName: course_name,
        courseId: course_id
    }
}

const notifsQueryText = `
    SELECT person, gen_comment, gen_post, is_watch_noti, 
        is_user_post_activity_noti, is_user_comment_reply_noti,
        is_mention_noti, is_announcement_noti
    FROM notification
    WHERE person = $1 AND NOT deleted AND created_at > $2;`

const postAuthorTitleQueryText = `
    SELECT f_name, l_name, title FROM 
        (SELECT author, title FROM post WHERE post_id = $1) AS post_author_title
        LEFT JOIN person ON author = person.user_id;`

const commentAuthorQueryText = `
    SELECT f_name, l_name FROM 
        (SELECT author FROM comment WHERE comment_id = $1) AS comment_author
        LEFT JOIN person ON author = person.user_id;`

const postFromCommentQueryText = `
    SELECT post FROM comment WHERE comment_id = $1;`

const courseFromCommentQueryText = `
    SELECT course_id, course.name AS course_name FROM
        (SELECT post FROM comment WHERE comment_id = $1) AS comment_post
        LEFT JOIN post ON comment_post.post = post_id
        LEFT JOIN post_category ON post_category.category_id = post.category
        LEFT JOIN course ON post_category.course = course.course_id;`
    
const courseFromPostQueryText = `
    SELECT course_id, course.name AS course_name FROM
        (SELECT post_id, category FROM post WHERE post_id = $1) AS the_post
        LEFT JOIN post_category ON post_category.category_id = the_post.category
        LEFT JOIN course ON post_category.course = course.course_id;`