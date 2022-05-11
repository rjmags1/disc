// comment on all resolved or answered posts once, marking
//      the comment as resolving or answer respectively
// comment on all private posts once. only staff, instructors can be authors
// comment on all endorsed posts once, marking comment as endorsed
// comment 0-3 times on all non-private posts
// comment 50 times on latest post, mark 3 as deleted
// make 5 'regular' comments anonymous

const { Pool } = require("pg")
const path = require("path")
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const pool = new Pool()
const { faker } = require('@faker-js/faker')
const Delta = require('quill-delta') // delta constructor


// 12/18/2003 EON UTC, fall 2003 term end
const SPECIAL_TERM_END = +(new Date(Date.UTC(2003, 11, 18, 23, 59)))

const genComments = async function() {
    // get course for which we are generating sample posts (special course)
    let queryText = `SELECT course_id FROM course WHERE 
                        code = 'CS344' AND section = 1 AND term = 
                            (SELECT term_id FROM term 
                                WHERE year = 2003 AND name = 'Fall');`
    const specialCourseIdQuery = await query(queryText)
    const specialCourseId = specialCourseIdQuery.rows[0].course_id

    // get people enrolled in special course
    queryText = `SELECT person FROM person_course WHERE course = $1;`
    let queryParams = [specialCourseId]
    const commentersQuery = await query(queryText, queryParams)
    const commenterIds = commentersQuery.rows.map(
        row => row.person
    )

    // get posts generated in sample post generation script
    queryText = `SELECT post_id FROM post;`
    const postsQuery = await query(queryText)
    const postIds = postsQuery.rows.map(
        row => row.post_id
    )

    // get instructor and staff associated with special course
    queryText = `SELECT 
                    person.user_id, 
                    person_course.is_staff, 
                    person_course.is_instructor
                FROM person JOIN person_course ON 
                    person.user_id = person_course.person 
                WHERE person_course.course = $1 AND (
                    person_course.is_instructor OR person_course.is_staff);`
    queryParams = [specialCourseId]
    const staffInstructorQuery = await query(queryText, queryParams)
    const staffInstructorIds = staffInstructorQuery.rows.map(
        row => [
            row.user_id, 
            { isStaff: row.is_staff, isInstructor: row.is_instructor }
        ]
    )
    const instructorId = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isInstructor
    )[0][0]
    const staffId = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isStaff
    )[0][0]

    // get harry. harry is used for development, and ensuring that he
    // is the author of a few comments will allow distinction between
    // logged in user authored comments and other peoples comments
    queryText = `SELECT user_id FROM person WHERE
                    f_name = 'Harry' AND l_name = 'Potter';`
    const harryQuery = await query(queryText)
    const harryId = harryQuery.rows[0].user_id



    // comment on all non private 
    // resolved posts once, marking the comment as resolving
    queryText = `SELECT post_id FROM post WHERE resolved AND NOT private;`
    const resolvedQuery = await query(queryText)
    const resolvedPosts = resolvedQuery.rows.map(
        row => row.post_id
    )
    queryText = `INSERT INTO comment 
                    (author, 
                    post, 
                    created_at, 
                    is_resolving,
                    edit_content,
                    display_content)
                VALUES ($1, $2, $3, TRUE, $4, $5);`
    for (const resolvedPostId of resolvedPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const resolvedPostCreationTime = await getPostCreatedAtTime(resolvedPostId)
        const commentCreationTime = getRandomTimeAfter(resolvedPostCreationTime)
        
        await query(queryText, [
            randomCommenter,
            resolvedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
    }



    // comment on all non private
    // answered posts once, marking the comment answer
    queryText = `SELECT post_id FROM post WHERE answered AND NOT private;`
    const answeredQuery = await query(queryText)
    const answeredPosts = answeredQuery.rows.map(
        row => row.post_id
    )
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    is_answer,
                    edit_content,
                    display_content)
                VALUES
                    ($1, $2, $3, TRUE, $4, $5);`
    for (const answeredPostId of answeredPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const answeredPostCreationTime = await getPostCreatedAtTime(answeredPostId)
        const commentCreationTime = getRandomTimeAfter(answeredPostCreationTime)

        await query(queryText, [
            randomCommenter,
            answeredPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
    }

    

    // comment on all private posts once, author must be instructor or staff
    // if post is answered or resolved, mark comment as resolving or answer
    queryText = `SELECT post_id, resolved, answered FROM post WHERE private;`
    const privateQuery = await query(queryText)
    const privatePosts = privateQuery.rows.map(
        row => [row.post_id, row.resolved, row.answered]
    )
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    edit_content,
                    display_content,
                    is_resolving,
                    is_answer)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7);`
    const privilegedCommenters = [staffId, instructorId]
    for (const privatePost of privatePosts) {
        const [privatePostId, resolved, answered] = privatePost
        const randomPrivilegedCommenter = getRandomCommenter(privilegedCommenters)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const privatePostCreationTime = await getPostCreatedAtTime(privatePostId)
        const commentCreationTime = getRandomTimeAfter(privatePostCreationTime)

        await query(queryText, [
            randomPrivilegedCommenter,
            privatePostId,
            commentCreationTime,
            editContent,
            displayContent,
            resolved,
            answered
        ])
    }



    // comment on all endorsed posts once, marking comment as endorsed
    queryText = `SELECT post_id FROM post WHERE endorsed;`
    const endorsedQuery = await query(queryText)
    const endorsedPosts = endorsedQuery.rows.map(
        row => row.post_id
    )
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    endorsed,
                    edit_content,
                    display_content)
                VALUES
                    ($1, $2, $3, TRUE, $4, $5);`
    for (const endorsedPostId of endorsedPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const endorsedPostCreationTime = await getPostCreatedAtTime(endorsedPostId)
        const commentCreationTime = getRandomTimeAfter(endorsedPostCreationTime)

        await query(queryText, [
            randomCommenter,
            endorsedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
    }



    // 0-3 'regular' comments on all non-private posts
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    edit_content,
                    display_content)
                VALUES
                    ($1, $2, $3, $4, $5);`
    const privatePostSet = new Set(privatePosts)
    for (const postId of postIds) {
        if (privatePostSet.has(postId)) continue

        const numComments = Math.floor(Math.random() * 4)
        for (let _ = 0; _ < numComments; _++) {
            const randomCommenter = getRandomCommenter(commenterIds)
            const comment = faker.lorem.sentence() + '\n'
            const editContent = new Delta([])
            editContent.insert(comment)
            const displayContent = `<p>${ comment }</p>`
            const postCreationTime = await getPostCreatedAtTime(postId)
            const commentCreationTime = getRandomTimeAfter(postCreationTime)
            
            await query(queryText, [
                randomCommenter,
                postId,
                commentCreationTime,
                editContent,
                displayContent
            ])
        }
    }



    // comment 50 times on latest post that isnt private, 0-5 nested replies per
    queryText = `SELECT post_id FROM post WHERE NOT private 
                    ORDER BY created_at DESC LIMIT 1;`
    const latestPostQuery = await query(queryText)
    const latestPost = latestPostQuery.rows[0].post_id
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    edit_content,
                    display_content,
                    deleted,
                    anonymous,
                    parent_comment,
                    ancestor_comment)
                VALUES
                    ($1, $2, $3, $4, $5, $6 ,$7, $8, $9)
                RETURNING comment_id, created_at;`
    for (let _ = 0; _ < 50; _++) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const latestPostCreationTime = await getPostCreatedAtTime(latestPost)
        const commentCreationTime = getRandomTimeAfter(latestPostCreationTime)
        
        const newTopLevelCommentQuery = await query(queryText, [
            randomCommenter,
            latestPost,
            commentCreationTime,
            editContent,
            displayContent,
            _ % 10 === 0 && _ < 30, // mark 3 of the comments as deleted
            _ > 0 && _ < 42 && _ % 7 === 0, // mark 5 non deleted as anonymous
            null,
            null
        ])

        const parentCommentInfo = newTopLevelCommentQuery.rows[0]
        const nestedReplies = Math.floor(Math.random() * 6)
        await genNestedComments(
            nestedReplies, 
            queryText, 
            parentCommentInfo, 
            parentCommentInfo, 
            commenterIds, 
            latestPost)
    }

    pool.end(() => {})
}

const genNestedComments = (
    async (
        nestedCommentsLeft, 
        queryText, 
        parentCommentInfo, 
        ancestorCommentInfo, 
        commenters, 
        post) => {
    if (nestedCommentsLeft === 0) return

    const { comment_id: ancestorComment } = ancestorCommentInfo

    let { 
        comment_id: parentComment, 
        created_at: parentCreatedAt 
    } = parentCommentInfo
    
    while (nestedCommentsLeft > 0) {
        const randomCommenter = getRandomCommenter(commenters)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const commentCreationTime = getRandomTimeAfter(parentCreatedAt)

        const queryParams = [
            randomCommenter, post, commentCreationTime, editContent,
            displayContent, false, false, parentComment, ancestorComment
        ]
        const nestedCommentQuery = await query(queryText, queryParams)

        const justInsertedInfo = nestedCommentQuery.rows[0]
        parentComment = justInsertedInfo.comment_id
        parentCreatedAt = justInsertedInfo.created_at
        nestedCommentsLeft--
    }
})

const query = async function (queryText, queryParams) {
    try {
        const queryResult = await pool.query(queryText, queryParams)
        return queryResult
    }
    catch (error) {
        console.error(`
            QUERY ERROR: 
            query: ${queryText}\n
            error: ${error.stack}
        `)
        throw new Error("problem executing query", { cause: error })
    }
}

const getRandomTimeAfter = (time) => {
    time = +time
    return new Date(time + Math.random() * (SPECIAL_TERM_END - time))
}

const getPostCreatedAtTime = async (postId) => {
    const queryText = `SELECT created_at FROM post WHERE post_id = $1;`
    const queryParams = [postId]
    const createdAtQuery = await query(queryText, queryParams)
    return createdAtQuery.rows[0].created_at
}

const getRandomCommenter = (commenterIds) => 
    commenterIds[Math.floor(Math.random() * commenterIds.length)]

genComments()