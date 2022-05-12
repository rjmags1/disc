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

const THREAD_ID_ZERO_PAD = 9


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
                VALUES ($1, $2, $3, TRUE, $4, $5)
                RETURNING comment_id;`
    for (const resolvedPostId of resolvedPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const resolvedPostCreationTime = await getPostCreatedAtTime(resolvedPostId)
        const commentCreationTime = getRandomTimeAfter(resolvedPostCreationTime)
        
        const justInserted = await query(queryText, [
            randomCommenter,
            resolvedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        const { comment_id: commentId } = justInserted.rows[0]
        await insertTopLevelThreadId(commentId)
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
                    ($1, $2, $3, TRUE, $4, $5)
                RETURNING comment_id;`
    for (const answeredPostId of answeredPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const answeredPostCreationTime = await getPostCreatedAtTime(answeredPostId)
        const commentCreationTime = getRandomTimeAfter(answeredPostCreationTime)

        const justInserted = await query(queryText, [
            randomCommenter,
            answeredPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        const { comment_id: commentId } = justInserted.rows[0]
        await insertTopLevelThreadId(commentId)
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
                    ($1, $2, $3, $4, $5, $6, $7)
                RETURNING comment_id;`
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

        const justInserted = await query(queryText, [
            randomPrivilegedCommenter,
            privatePostId,
            commentCreationTime,
            editContent,
            displayContent,
            resolved,
            answered
        ])
        const { comment_id: commentId } = justInserted.rows[0]
        await insertTopLevelThreadId(commentId)
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
                    ($1, $2, $3, TRUE, $4, $5)
                RETURNING comment_id;`
    for (const endorsedPostId of endorsedPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const endorsedPostCreationTime = await getPostCreatedAtTime(endorsedPostId)
        const commentCreationTime = getRandomTimeAfter(endorsedPostCreationTime)

        const justInserted = await query(queryText, [
            randomCommenter,
            endorsedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        const { comment_id: commentId } = justInserted.rows[0]
        await insertTopLevelThreadId(commentId)
    }



    // 0-3 'regular' comments on all non-private posts
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    edit_content,
                    display_content)
                VALUES
                    ($1, $2, $3, $4, $5)
                RETURNING comment_id;`
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
            
            const justInserted = await query(queryText, [
                randomCommenter,
                postId,
                commentCreationTime,
                editContent,
                displayContent
            ])
            const { comment_id: commentId } = justInserted.rows[0]
            await insertTopLevelThreadId(commentId)
        }
    }



    // comment 50 times on latest post that isnt private, 0-10 nested replies per
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
                    ancestor_comment)
                VALUES
                    ($1, $2, $3, $4, $5, $6 ,$7, $8)
                RETURNING comment_id, created_at;`
    for (let _ = 0; _ < 50; _++) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const latestPostCreationTime = await getPostCreatedAtTime(latestPost)
        const commentCreationTime = getRandomTimeAfter(latestPostCreationTime)
        
        const justInserted = await query(queryText, [
            randomCommenter,
            latestPost,
            commentCreationTime,
            editContent,
            displayContent,
            _ % 10 === 0 && _ < 30, // mark 3 of the comments as deleted
            _ > 0 && _ < 42 && _ % 7 === 0, // mark 5 non deleted as anonymous,
            null
        ])
        const { 
            comment_id: commentId, 
            created_at: createAfter 
        } = justInserted.rows[0]
        const threadId = await insertTopLevelThreadId(commentId)

        const nestedReplies = Math.floor(Math.random() * 10)
        await genNestedComments(
            nestedReplies, commenterIds, latestPost, 
            threadId, createAfter, queryText, commentId)
    }

    pool.end(() => {})
}

const genNestedComments = (
    async (
        nestedCommentsLeft, 
        commenters, 
        post,
        ancestorThreadId,
        createAfter,
        queryText,
        ancestorCommentId) => {
    if (nestedCommentsLeft === 0) return
    
    let parentThreadId = ancestorThreadId
    while (nestedCommentsLeft > 0) {
        const randomCommenter = getRandomCommenter(commenters)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const commentCreationTime = getRandomTimeAfter(createAfter)

        const queryParams = [
            randomCommenter, post, commentCreationTime, editContent,
            displayContent, false, false, ancestorCommentId
        ]
        const nestedCommentQuery = await query(queryText, queryParams)
        const {
             comment_id: commentId, 
             created_at: justInsertedCreatedAt 
        } = nestedCommentQuery.rows[0]

        const justInsertedThreadId = (
            await insertLowerLevelThreadId(parentThreadId, commentId))

        const goDeeper = Math.random() > 0.5
        if (goDeeper) {
            createAfter = justInsertedCreatedAt
            parentThreadId = justInsertedThreadId
        }
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

const insertTopLevelThreadId = async (commentId) => {
    const toStr = commentId.toString()
    const zeroes = new Array(
        THREAD_ID_ZERO_PAD - toStr.length).fill('0').join('')
    const threadId = zeroes + toStr
    await query(
        "UPDATE comment SET thread_id = $1 WHERE comment_id = $2;",
        [threadId, commentId]
    )

    return threadId
}

const insertLowerLevelThreadId = async (parentThreadId, commentId) => {
    const nestingTokens = parentThreadId.split(".")
    const lastToken = nestingTokens[nestingTokens.length - 1]
    const paddedIncLastToken = incThreadIdToken(lastToken)
    const rightBoundThreadTokens = nestingTokens.slice(0, nestingTokens.length - 1)
    rightBoundThreadTokens.push(paddedIncLastToken)
    const rightBoundThreadId = rightBoundThreadTokens.join(".")
    const youngestSiblingQuery = await query(`
        SELECT thread_id FROM comment 
        WHERE thread_id > $1 AND thread_id < $2
        ORDER BY thread_id DESC LIMIT 1`,
        [parentThreadId, rightBoundThreadId]
    )
    
    let diffToken
    if (youngestSiblingQuery.rows.length === 0) {
        diffToken = new Array(THREAD_ID_ZERO_PAD - 1).fill('0').join('') + '1'
    }
    else {
        const { thread_id: prevThreadId } = youngestSiblingQuery.rows[0]
        const tokens = prevThreadId.split(".")
        diffToken = incThreadIdToken(tokens[tokens.length - 1])
    }
    nestingTokens.push(diffToken)
    const newThreadId = nestingTokens.join(".")

    await query(
        "UPDATE comment SET thread_id = $1 WHERE comment_id = $2;",
        [newThreadId, commentId])
    return newThreadId
}

const incThreadIdToken = (token) => {
    const incToken = (parseInt(token) + 1).toString()
    const zeroes = new Array(
        THREAD_ID_ZERO_PAD - incToken.length).fill('0').join('')
    return zeroes + incToken
}

genComments()