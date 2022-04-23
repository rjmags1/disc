const { Pool } = require("pg")
const path = require("path")
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const pool = new Pool()
const { faker } = require('@faker-js/faker')
const Delta = require('quill-delta') // delta constructor

// 9/3/2003 midnight UTC, fall 2003 term start 
const SPECIAL_TERM_START = +(new Date(Date.UTC(2003, 8, 3, 0, 0)))
// 12/18/2003 EON UTC, fall 2003 term end
const SPECIAL_TERM_END = +(new Date(Date.UTC(2003, 11, 18, 23, 59)))


/*
a quick note about this script: like all of the other scripts in this folder,
this script is not meant to generate perfectly realistic data nor is code
quality meant to be perfect. the purpose of all of the scripts in this folder
is to generate data that is sufficiently realistic such that it will
allow me to develop the discussion page. 

the only posts generated by this script are posts in a particular course,
which is the course whose sample data i will use to develop the discussion
page.
*/



const genPosts = async function() {
    // get course for which we are generating sample posts (special course)
    let queryText = `SELECT course_id FROM course WHERE 
                        code = 'CS344' AND section = 1 AND term = 
                            (SELECT term_id FROM term 
                                WHERE year = 2003 AND name = 'Fall');`
    const specialCourseIdQuery = await query(queryText)
    const specialCourseId = specialCourseIdQuery.rows[0].course_id

    // get post categories associated with special course.
    // post categories are course associated and so are indirectly
    // how posts are associated with courses
    queryText = `SELECT category_id FROM post_category WHERE
                    course = $1;`
    let queryParams = [specialCourseId]
    const specialCoursePostCatQuery = await query(queryText, queryParams)
    const specialCategoryIds = specialCoursePostCatQuery.rows.map(
        row => row.category_id
    )

    // get people enrolled in special course
    queryText = `SELECT person FROM person_course WHERE course = $1;`
    queryParams = [specialCourseId]
    const postersQuery = await query(queryText, queryParams)
    const posterIds = postersQuery.rows.map(
        row => row.person
    )

    // get harry. will always be enrolled in special course if 
    // enrollment script functions correctly. want to guarantee
    // some posts are written by harry so we can test special
    // post attributes, such as private (ie, harry can see his private
    // posts but no one else can)
    queryText = `SELECT user_id FROM person WHERE
                    f_name = 'Harry' AND l_name = 'Potter';`
    const harryQuery = await query(queryText)
    const harryId = harryQuery.rows[0].user_id

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
    // console.log(instructorId)
    // console.log(staffId)

    queryText = `INSERT INTO post 
                    (category, 
                    author, 
                    created_at, 
                    title, 
                    edit_content,
                    display_content)
                    VALUES
                    ($1, $2, $3, $4, $5, $6);`
    for (const categoryId of specialCategoryIds) {
        // generate core content of 20 posts for the categoryId
        // perform specified boolean attribute markup later
        // core content is: category, author, created_at, title, 
        //      edit_content, display_content

        for (let createdPost = 0; createdPost < 20; createdPost++) {
            let author
            if (createdPost === 0) author = harryId
            else if (createdPost === 1) author = instructorId
            else if (createdPost === 2) author = staffId
            else author = getRandomPoster(posterIds)

            const createdAt = randomPostCreatedAtDate()
            const title = faker.lorem.sentence(3 + Math.floor(Math.random() * 8))
            const displayContentTags = []
            const editContents = []
            for (let _ = 1; _ < 5; _++) {
                const paragraph = faker.lorem.paragraph(
                    Math.floor(Math.random() * 5)
                )
                editContents.push(paragraph)
                displayContentTags.push(`<p>${ paragraph }</p>\n<p><br></p>`)
            }
            const displayContent = displayContentTags.join()
            const editContent = new Delta([])
            const insertThis = editContents.join('\n\n') + '\n'
            editContent.insert(insertThis)
            
            queryParams = [
                categoryId,
                author,
                createdAt,
                title,
                editContent,
                displayContent
            ]
            await query(queryText, queryParams)
        }
    }

    const postIdsQuery = await query("SELECT post_id FROM post;")
    const postIds = postIdsQuery.rows.map(
        row => row.post_id
    )
    
    // mark 4 posts as pinned
    const pinned = new Set()
    while (pinned.size < 4) {
        pinned.add(getRandomPost(postIds))
    }
    queryText = `UPDATE post SET pinned = TRUE 
                    WHERE post_id = $1;`
    for (const postId of pinned) {
        queryParams = [postId]
        await query(queryText, queryParams)
    }

    // mark half of all posts as questions
    // mark 1/4 of all questions as answered
    // mark 1/4 of all non questions as resolved
    queryText = `UPDATE post SET is_question = TRUE
                    WHERE post_id = $1;`
    for (let i = 0; i < postIds.length; i++) {
        queryParams = [postIds[i]]
        if (i % 2 === 1) {
            await query(queryText, queryParams)
            if ((i - 1) % 8 === 0) { // 1/4 of all questions
                const markAnsweredQueryText = `
                    UPDATE post SET answered = TRUE
                        WHERE post_id = $1;`
                await query(markAnsweredQueryText, queryParams)
            }
        }
        else if (i % 8 === 0) { // 1/4 of all non-questions
            const markResolvedQueryText = `
                UPDATE post SET resolved = TRUE
                    WHERE post_id = $1;`
            await query(markResolvedQueryText, queryParams)
        }
    }

    // mark 3 posts as announcements. must be staff or instructor posts.
    queryText = `SELECT post_id FROM post WHERE 
                    author = $1 OR author = $2;`
    const instructorStaffPostsQuery = await query(
        queryText, [staffId, instructorId])
    const instructorStaffPosts = instructorStaffPostsQuery.rows.map(
        row => row.post_id
    )
    queryText = `UPDATE post SET is_announcement = TRUE
                    WHERE post_id = $1;`
    const announcements = new Set()
    for (let _ = 0; _ < 3; _++) {
        let randomPost = getRandomPost(instructorStaffPosts)
        while (randomPost in announcements) {
            randomPost = getRandomPost(instructorStaffPosts)
        }
        await query(queryText, [randomPost])
        announcements.add(randomPost)
    }

    // mark 10 non-pinned, non-announcement posts as private
    // make sure one of the private posts are by harry for dev
    queryText = `SELECT post_id FROM post WHERE author = $1;`
    const harryPostsQuery = await query(queryText, [harryId])
    const harryPosts = harryPostsQuery.rows.map(
        row => row.post_id
    )
    queryText = `UPDATE post SET private = TRUE
                    WHERE post_id = $1;`
    const privates = new Set()
    for (let _ = 0; _ < 10; _++) {
        let randomPost
        if (_ === 0) randomPost = getRandomPost(harryPosts)
        else randomPost = getRandomPost(postIds)
        while (privates.has(randomPost) ||
                pinned.has(randomPost) ||
                announcements.has(randomPost)) {
            randomPost = getRandomPost(postIds)
        }
        await query(queryText, [randomPost])
        privates.add(randomPost)
    }

    // mark 5 non-pinned, non-private, non-announcement posts as deleted
    queryText = `UPDATE post SET deleted = TRUE
                    WHERE post_id = $1;`
    const deleted = new Set()
    for (let _ = 0; _ < 5; _++) {
        let randomPost = getRandomPost(postIds)
        while (pinned.has(randomPost) ||
                announcements.has(randomPost) ||
                deleted.has(randomPost) ||
                privates.has(randomPost)) {
            randomPost = getRandomPost(postIds)
        }
        await query(queryText, [randomPost])
        deleted.add(randomPost)
    }

    // mark 10 posts as endorsed, cant be private, deleted,
    // announcement, or pinned 
    queryText = `UPDATE post SET endorsed = TRUE
                    WHERE post_id = $1;`
    const endorsed = new Set()
    for (let _ = 0; _ < 10; _++) {
        let randomPost = getRandomPost(postIds)
        while (endorsed.has(randomPost) ||
                privates.has(randomPost) ||
                deleted.has(randomPost) ||
                pinned.has(randomPost)) {
            randomPost = getRandomPost(postIds)
        }
        await query(queryText, [randomPost])
        endorsed.add(randomPost)
    }

    // mark 20 posts as anonymous, cant be deleted, private,
    // pinned, or announcement
    queryText = `UPDATE post SET anonymous = TRUE
                    WHERE post_id = $1;`
    const anonymous = new Set()
    for (let _ = 0; _ < 20; _++) {
        let randomPost = getRandomPost(postIds)
        while (anonymous.has(randomPost) ||
                deleted.has(randomPost) ||
                privates.has(randomPost) ||
                pinned.has(randomPost) ||
                announcements.has(randomPost)) {
            randomPost = getRandomPost(postIds)
        }
        await query(queryText, [randomPost])
        anonymous.add(randomPost)
    }

    pool.end(() => {})
}

const getRandomPost = (postIds) =>
    postIds[Math.floor(Math.random() * postIds.length)]

const getRandomPoster = (posterIds) => 
    posterIds[Math.floor(Math.random() * posterIds.length)]

const randomPostCreatedAtDate = () => 
    new Date(SPECIAL_TERM_START + Math.random() * (SPECIAL_TERM_END - SPECIAL_TERM_START))

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

genPosts()