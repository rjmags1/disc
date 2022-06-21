// comment on all resolved or answered posts once, marking
//      the comment as resolving or answer respectively
// comment on all private posts once. only staff, instructors can be authors
// comment on all endorsed posts once, marking comment as endorsed
// comment 0-3 times on all non-private posts
// comment 50 times on latest post, mark 3 as deleted
// make 5 'regular' comments anonymous

import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()
import { faker } from '@faker-js/faker'
import Delta from 'quill-delta' // delta constructor
import { fixNodePgUTCTimeInterpretation } from '../e2e/lib/time.js'

const YEARS = [2000, 2001, 2002, 2003]
const TERM_NAMES = ['Winter', 'Spring', 'Summer', 'Fall']
const termIntervals = {}
for (const year of YEARS) {
    for (const term of TERM_NAMES) {
        let startArgs, endArgs
        if (term === 'Winter') {
            startArgs = [year, 0, 1, 0, 0]
            endArgs = [year, 2, 31, 23, 59]
        }
        else if (term === 'Spring') {
            startArgs = [year, 3, 1, 0, 0]
            endArgs = [year, 5, 30, 23, 59]
        }
        else if (term === 'Summer') {
            startArgs = [year, 6, 1, 0, 0]
            endArgs = [year, 8, 30, 23, 59]
        }
        else {
            startArgs = [year, 9, 1, 1, 0, 0]
            endArgs = [year, 11, 31, 23, 59]
        }
        termIntervals[`${ term } ${ year }`] = {
            start: +(new Date(Date.UTC(...startArgs))),
            end: +(new Date(Date.UTC(...endArgs)))
        }
    }
}

const THREAD_ID_ZERO_PAD = 5

const genAllComments = async () => {
    for (const term of Object.keys(termIntervals)) {
        const [name, sYear] = term.split(' ')
        const termId = (await query(
            `SELECT term_id FROM term WHERE year = $1 AND name = $2;`,
            [parseInt(sYear), name])).rows[0].term_id
        const { end: termEnd } = termIntervals[term]

        const termCourseIds = (await query(
            `SELECT course_id FROM course WHERE term = $1;`, [termId]
        )).rows.map(row => row.course_id)

        for (const courseId of termCourseIds) {
            await genCourseComments(courseId, termEnd)
        }
    }
}


const genCourseComments = async function(courseId, termEnd) {

    // get people enrolled in course
    let queryText = `SELECT person FROM person_course WHERE course = $1;`
    let queryParams = [courseId]
    const commentersQuery = await query(queryText, queryParams)
    const commenterIds = commentersQuery.rows.map(row => row.person)

    if (!commenterIds.length) return // no one enrolled in this course

    // get posts generated in sample post generation script
    queryText = `
        SELECT post_id, resolved, private, answered, endorsed, created_at 
        FROM ((SELECT category_id FROM post_category WHERE course = $1) 
        AS cats
        LEFT JOIN post ON category_id = post.category);`
    const postsQuery = await query(queryText, [courseId])
    const postIds = postsQuery.rows.map(row => row.post_id)

    // get instructor and staff associated with special course
    queryText = `
        SELECT 
            person.user_id, 
            person_course.is_staff, 
            person_course.is_instructor
        FROM person JOIN person_course ON 
            person.user_id = person_course.person 
        WHERE person_course.course = $1 AND (
            person_course.is_instructor OR person_course.is_staff);`
    queryParams = [courseId]
    const staffInstructorQuery = await query(queryText, queryParams)
    const staffInstructorIds = staffInstructorQuery.rows.map(row => [
        row.user_id, 
        { isStaff: row.is_staff, isInstructor: row.is_instructor }])
    const instructorId = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isInstructor)[0][0]
    const staffInfos = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isStaff)
    const staffId = staffInfos.length > 0 ? staffInfos[0][0] : null


    // comment on all non private 
    // resolved posts once, marking the comment as resolving
    const resolvedPosts = postsQuery.rows.filter(
        row => !row.private && row.resolved).map(row => row.post_id)
    queryText = `
        INSERT INTO comment 
            (author, post, created_at, is_resolving, edit_content, display_content)
        VALUES ($1, $2, $3, TRUE, $4, $5);`
    for (const resolvedPostId of resolvedPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const resolvedPostCreationTime = await getPostCreatedAtTime(resolvedPostId)
        const commentCreationTime = getRandomTimeAfter(resolvedPostCreationTime, termEnd)
        
        await query(queryText, [
            randomCommenter,
            resolvedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        await handlePostViewFromComment(
            resolvedPostId, randomCommenter, commentCreationTime)
    }



    // comment on all non private answered posts once, marking the comment answer
    const answeredPosts = postsQuery.rows.filter(
        row => !row.private && row.answered).map(row => row.post_id)
    queryText = `
        INSERT INTO comment
            (author, post, created_at, is_answer, edit_content, display_content)
        VALUES ($1, $2, $3, TRUE, $4, $5);`
    for (const answeredPostId of answeredPosts) {
        const randomCommenter = getRandomCommenter(commenterIds)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const answeredPostCreationTime = await getPostCreatedAtTime(answeredPostId)
        const commentCreationTime = getRandomTimeAfter(answeredPostCreationTime, termEnd)

        await query(queryText, [
            randomCommenter,
            answeredPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        await handlePostViewFromComment(
            answeredPostId, randomCommenter, commentCreationTime)
    }

    

    // comment on all private posts once, author must be instructor or staff.
    // if post is answered or resolved, mark comment as resolving or answer
    const privatePosts = postsQuery.rows.filter(row => row.private).map(
        row => [row.post_id, row.resolved, row.answered])
    queryText = `
        INSERT INTO comment
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
        const randomPrivilegedCommenter = staffId ? 
            getRandomCommenter(privilegedCommenters) : instructorId
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const privatePostCreationTime = await getPostCreatedAtTime(privatePostId)
        const commentCreationTime = getRandomTimeAfter(privatePostCreationTime, termEnd)

        await query(queryText, [
            randomPrivilegedCommenter,
            privatePostId,
            commentCreationTime,
            editContent,
            displayContent,
            resolved,
            answered
        ])
        await handlePostViewFromComment(
            privatePostId, randomPrivilegedCommenter, commentCreationTime)
    }



    // comment on all endorsed posts once, marking comment as endorsed
    const endorsedPosts = postsQuery.rows.filter(
        row => row.endorsed).map(row => [row.post_id, row.private])
    queryText = `INSERT INTO comment
                    (author,
                    post,
                    created_at,
                    endorsed,
                    edit_content,
                    display_content)
                VALUES
                    ($1, $2, $3, TRUE, $4, $5);`
    for (const [endorsedPostId, privatePost] of endorsedPosts) {
        const randomCommenter = (privatePost ?
            staffId : getRandomCommenter(commenterIds))
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const endorsedPostCreationTime = await getPostCreatedAtTime(endorsedPostId)
        const commentCreationTime = getRandomTimeAfter(endorsedPostCreationTime, termEnd)

        await query(queryText, [
            randomCommenter,
            endorsedPostId,
            commentCreationTime,
            editContent,
            displayContent
        ])
        await handlePostViewFromComment(
            endorsedPostId, randomCommenter, commentCreationTime)
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
            const commentCreationTime = getRandomTimeAfter(postCreationTime, termEnd)
            
            await query(queryText, [
                randomCommenter,
                postId,
                commentCreationTime,
                editContent,
                displayContent
            ])
        await handlePostViewFromComment(
            postId, randomCommenter, commentCreationTime)
        }
    }


    if (specialCourseId !== courseId) return


    // comment 50 times on latest post that isnt private, 0-50 nested replies per,
    // if we are creating comments for special course thats used for testing
    const latestPostInfo = postsQuery.rows.filter(row => !row.private).map(
        row => [row.post_id, row.created_at]).sort((a, b) => {
            const [_, aCreatedAt] = a
            const [__, bCreatedAt] = b
            return Date.parse(bCreatedAt) - Date.parse(aCreatedAt)
        })[0]
    const [latestPost, latestPostCreationTime] = latestPostInfo
    queryText = `
        INSERT INTO comment
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
        const commentCreationTime = getRandomTimeAfter(latestPostCreationTime, termEnd)
        
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
        await handlePostViewFromComment(
            latestPost, randomCommenter, commentCreationTime)

        const { 
            comment_id: commentId, 
            created_at: createAfter 
        } = justInserted.rows[0]
        const nestedReplies = Math.floor(Math.random() * 50)
        await genNestedComments(
            nestedReplies, commenterIds, latestPost, 
            createAfter, queryText, commentId, termEnd)
    }
}

const genNestedComments = (
    async (nestedCommentsLeft, commenters, post, createAfter,
        queryText, ancestorCommentId, termEnd) => {

    let parentThreadId = null, parentCreatedAt = createAfter
    let youngestSiblingThreadId = null, siblingCreatedAt = null
    while (nestedCommentsLeft > 0) {
        const randomCommenter = getRandomCommenter(commenters)
        const comment = faker.lorem.sentence() + '\n'
        const editContent = new Delta([])
        editContent.insert(comment)
        const displayContent = `<p>${ comment }</p>`
        const commentCreationTime = getRandomTimeAfter(createAfter, termEnd)

        const nestedCommentQuery = await query(queryText, [
            randomCommenter, post, commentCreationTime, editContent,
            displayContent, false, false, ancestorCommentId
        ])
        await handlePostViewFromComment(post, randomCommenter, commentCreationTime)

        const {
             comment_id: justInsertedCommentId, 
             created_at: justInsertedCreatedAt 
        } = nestedCommentQuery.rows[0]
        const newThreadId = genNewThreadId(
            parentThreadId, youngestSiblingThreadId)
        await query(
            "UPDATE comment SET thread_id = $1 WHERE comment_id = $2;",
            [newThreadId, justInsertedCommentId])

        const goDeeper = Math.random() < 0.3
        parentThreadId = goDeeper ? newThreadId : parentThreadId
        youngestSiblingThreadId = goDeeper ? null : newThreadId
        parentCreatedAt = goDeeper ? justInsertedCreatedAt : parentCreatedAt
        siblingCreatedAt = goDeeper ? null : justInsertedCreatedAt
        createAfter = goDeeper ? parentCreatedAt : siblingCreatedAt

        nestedCommentsLeft--
    }
})

const genNewThreadId = (parentThreadId, youngestSiblingThreadId) => {
    let newThreadId
    if (parentThreadId === null) {
        newThreadId = (youngestSiblingThreadId !== null ? 
            incThreadId(youngestSiblingThreadId)
            : zeroPad("1"))
    }
    else {
        newThreadId = (youngestSiblingThreadId !== null ? 
            incThreadId(youngestSiblingThreadId)
            : parentThreadId + "." + zeroPad("1"))
    }
    
    return newThreadId
}

const incThreadId = (threadId) => {
    const tokens = threadId.split('.')
    const lastToken = tokens[tokens.length - 1]
    const incLastToken = zeroPad(
        (parseInt(lastToken, 10) + 1).toString())
    tokens.pop()
    tokens.push(incLastToken)
    return tokens.join('.')
}

const zeroPad = (stringInt) => {
    const zeroes = new Array(
        THREAD_ID_ZERO_PAD - stringInt.length).fill('0').join('')
    return zeroes + stringInt
}

const query = async function (queryText, queryParams) {
    try {
        const queryResult = await client.query(queryText, queryParams)
        return queryResult
    }
    catch (error) {
        throw new Error("problem executing query", { cause: error })
    }
}

const getRandomTimeAfter = (time, termEnd) => {
    time = +time
    return new Date(time + Math.random() * (termEnd - time))
}

const getPostCreatedAtTime = async (postId) => {
    const queryText = `SELECT created_at FROM post WHERE post_id = $1;`
    const queryParams = [postId]
    const createdAtQuery = await query(queryText, queryParams)

    return fixNodePgUTCTimeInterpretation(createdAtQuery.rows[0].created_at)
}

const getRandomCommenter = (commenterIds) => (
    commenterIds[Math.floor(Math.random() * commenterIds.length)])

const handlePostViewFromComment = async (post, viewer, time) => {
    try {
        await query(
            `INSERT INTO post_view (post, viewer, last_viewed_at)
            VALUES ($1, $2, $3)`, [post, viewer, time])
    }
    catch (e) {
        try {
            await query(
                `UPDATE post_view SET last_viewed_at = $3
                WHERE post = $1 AND viewer = $2;`, [post, viewer, time])
        }
        catch (e) {}
    }
}

const getSpecialCourseId = async () => {
    const queryText = `SELECT course_id FROM course WHERE 
                        code = 'CS344' AND section = 1 AND term = 
                            (SELECT term_id FROM term 
                                WHERE year = 2003 AND name = 'Fall');`
    const specialCourseIdQuery = await query(queryText)

    return specialCourseIdQuery.rows[0].course_id
}
const specialCourseId = await getSpecialCourseId()



try {
    await genAllComments()
}
catch (e) {
    console.error(e)
    console.error("something went wrong. run the destroy_db script and try again.")
}
finally {
    await client.end()
}