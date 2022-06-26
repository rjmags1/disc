import { query } from '../../../../../db/index'
import { sessionOptions } from '../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'
import { fixNodePgUTCTimeInterpretation } from '../../../../../lib/time'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ announcements: [], pinned: [] })
        return
    }
    const courseId = parseInt(req.query.courseId, 10)
    if (!courseId || !Number.isInteger(courseId)) {
        resp.status(400).json({ message: "non integer courseId" })
        return
    }



    // retrieve all announcements and pinned posts for courseId
    let announcementsPinnedsQuery
    try {
        const { user_id: userId } = req.session.user
        const announcementsPinnedsQueryParams = [courseId, userId]
        announcementsPinnedsQuery = await query(
            announcementsPinnedsQueryText,
            announcementsPinnedsQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    



    const rows = announcementsPinnedsQuery.rows
    const announcements = [], pinned = []
    rows.filter(r => !r.deleted && 
        (!r.private || r.private && r.user_id === userId)).forEach(row => {
        const processed = processRow(row)
        if (processed.pinned) pinned.push(processed)
        else announcements.push(processed)
    })

    

    resp.status(200).json({ announcements, pinned })
}, sessionOptions)


const processRow = (row) => ({
    postId: row.post_id,
    title: row.title,
    categoryId: row.category_id,
    category: row.category_name,
    deleted: row.deleted,
    createdAt: 
        fixNodePgUTCTimeInterpretation(row.created_at),
    pinned: row.pinned,
    isQuestion: row.is_question,
    [row.is_question ? "answered" : "resolved"] : 
        row.is_question ? row.answered : row.resolved,
    endorsed: row.endorsed,
    isAnnouncement: row.is_announcement,
    authorId: row.user_id,
    author: `${row.f_name} ${row.l_name}`,
    authorIsStaffOrInstructor: row.author_is_staff || row.author_is_instructor,
    private: row.private,
    starred: Boolean(row.star_id),
    watched: Boolean(row.watch_id),
    lastViewedAt: row.last_viewed_at ? 
        fixNodePgUTCTimeInterpretation(row.last_viewed_at) : null,
    mostRecentCommentTime: row.latest_comment_time ? 
        fixNodePgUTCTimeInterpretation(row.latest_comment_time) : null,
    likes: parseInt(row.likes, 10),
    liked: !!row.liker,
    comments: parseInt(row.comments, 10)
})


const announcementsPinnedsQueryText = `
SELECT
    post_id, title, category_name, category_id, created_at, liker, deleted,
    is_question, resolved, answered, endorsed, pinned, is_announcement,
    f_name, l_name, user_id, private, author_is_staff, author_is_instructor,
    star_id, watch_id, last_viewed_at, likes, comments, latest_comment_time
FROM
    (SELECT category_id, name as category_name 
        FROM post_category WHERE course = $1) 
    AS course_categories
    JOIN (SELECT * FROM post WHERE 
        (NOT private OR author = $2) AND 
        (pinned OR is_announcement)) 
    AS displayed_posts
        ON displayed_posts.category = category_id
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
        ON displayed_posts.author = user_id
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
    LEFT JOIN (
        SELECT post AS liked_post, liker FROM post_like
            WHERE liker = $2
        ) AS user_liked_posts
    ON liked_post = post_id

ORDER BY created_at DESC;`