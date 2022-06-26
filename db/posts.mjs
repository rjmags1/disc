import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()
import { faker } from '@faker-js/faker'
import Delta from 'quill-delta' // delta constructor

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
const genAllPosts = async () => {
    for (const termName of Object.keys(termIntervals)) {
        const termCourseIds = await getTermCourses(termName)
        for (const courseId of termCourseIds) {
            await genCoursePosts(courseId, termName)
        }
    }
}

const genCoursePosts = async function(courseId, termName) {
    // get post categories associated with course.
    // post categories are course associated and so are indirectly
    // how posts are associated with courses
    let queryText = `SELECT category_id FROM post_category WHERE course = $1;`
    let queryParams = [courseId]
    const coursePostCatQuery = await query(queryText, queryParams)
    const categoryIds = coursePostCatQuery.rows.map(row => row.category_id)

    // get people enrolled in course
    queryText = `SELECT person FROM person_course WHERE course = $1;`
    queryParams = [courseId]
    const postersQuery = await query(queryText, queryParams)
    const posterIds = postersQuery.rows.map(row => row.person)
    if (posterIds.length === 0) return // no one enrolled in this course

    let harryId
    if (courseId === specialCourseId) {
        // get harry. will always be enrolled in special course if 
        // enrollment script functions correctly. want to guarantee
        // some posts are written by harry so we can test special
        // post attributes, such as private (ie, harry can see his private
        // posts but no one else can)
        queryText = `
            SELECT user_id FROM person 
            WHERE f_name = 'Harry' AND l_name = 'Potter';`
        const harryQuery = await query(queryText)
        harryId = harryQuery.rows[0].user_id
    }

    // get instructor and staff associated with course
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
        row.user_id, { isStaff: row.is_staff, isInstructor: row.is_instructor }])
    if (staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isInstructor).length === 0) console.log(staffInstructorIds, courseId, posterIds)
    const instructorId = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isInstructor)[0][0]
    const staffInfos = staffInstructorIds.filter(
        ([_, statusObj]) => statusObj.isStaff)
    const staffId = staffInfos.length > 0 ? staffInfos[0][0] : null

    queryText = `
        INSERT INTO post 
            (category, 
            author, 
            created_at, 
            title, 
            edit_content,
            display_content)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING post_id, author;`
    const postIds = []
    const instructorStaffPosts = []
    for (const categoryId of categoryIds) {
        // generate core content of 20 posts for the categoryId
        // perform boolean attribute inserts/updates later
        // core content is: category, author, created_at, title, 
        //      edit_content, display_content

        const posts = specialCourseId === courseId ? 20 : 10
        for (let createdPost = 0; createdPost < posts; createdPost++) {
            let author
            if (createdPost === 0 && courseId === specialCourseId) author = harryId
            else if (createdPost === 1) author = instructorId
            else if (createdPost === 2 && staffId) author = staffId
            else author = getRandomPoster(posterIds)

            const createdAt = randomPostCreatedAtDate(termName)
            const title = faker.lorem.sentence(
                3 + Math.floor(Math.random() * 8)).slice(0, 100)
            const displayContentTags = []
            const editContents = []
            for (let _ = 1; _ < 5; _++) {
                const paragraph = faker.lorem.paragraph(
                    Math.floor(Math.random() * 5)
                )
                editContents.push(paragraph)
                displayContentTags.push(`<p>${ paragraph }</p><p><br></p>`)
            }
            const displayContent = displayContentTags.join("")
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
            const postInsertQuery = await query(queryText, queryParams)
            const { author: newAuthor, post_id } = postInsertQuery.rows[0]
            postIds.push(post_id)
            if (newAuthor === instructorId || newAuthor === staffId) {
                instructorStaffPosts.push(post_id)
            }
        }
    }
   
    // mark 4 posts as pinned
    const pinned = new Set()
    while (pinned.size < 4) {
        pinned.add(getRandomPost(postIds))
    }
    queryText = `UPDATE post SET pinned = TRUE WHERE post_id = $1;`
    for (const postId of pinned) {
        await query(queryText, [postId])
    }

    // mark half of all posts as questions
    // mark 1/4 of all questions as answered
    // mark 1/4 of all non questions as resolved
    queryText = `UPDATE post SET is_question = TRUE WHERE post_id = $1;`
    for (let i = 0; i < postIds.length; i++) {
        queryParams = [postIds[i]]
        if (i % 2 === 1) {
            await query(queryText, queryParams)
            if ((i - 1) % 8 === 0) { // 1/4 of all questions
                const markAnsweredQueryText = `
                    UPDATE post SET answered = TRUE WHERE post_id = $1;`
                await query(markAnsweredQueryText, queryParams)
            }
        }
        else if (i % 8 === 0) { // 1/4 of all non-questions
            const markResolvedQueryText = `
                UPDATE post SET resolved = TRUE WHERE post_id = $1;`
            await query(markResolvedQueryText, queryParams)
        }
    }

    // mark 3 posts as announcements. must be staff or instructor posts.
    queryText = `UPDATE post SET is_announcement = TRUE WHERE post_id = $1;`
    const announcements = new Set()
    for (let _ = 0; _ < 3; _++) {
        let randomPost = getRandomPost(instructorStaffPosts)
        while (randomPost in announcements) {
            randomPost = getRandomPost(instructorStaffPosts)
        }
        await query(queryText, [randomPost])
        announcements.add(randomPost)
    }

    // mark 5 non-pinned, non-announcement posts as private
    // make sure one of the private posts are by harry for dev if special course
    let harryPosts
    if (courseId === specialCourseId) {
        queryText = `SELECT post_id FROM post WHERE author = $1;`
        const harryPostsQuery = await query(queryText, [harryId])
        harryPosts = harryPostsQuery.rows.map(row => row.post_id)
    }
    queryText = `UPDATE post SET private = TRUE WHERE post_id = $1;`
    const privates = new Set()
    for (let _ = 0; _ < 5; _++) {
        let randomPost
        if (_ === 0 && courseId === specialCourseId) {
            randomPost = getRandomPost(harryPosts)
        }
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

    // mark 10 posts as anonymous; cant be deleted, private,
    // pinned, or announcement
    queryText = `UPDATE post SET anonymous = TRUE
                    WHERE post_id = $1;`
    const anonymous = new Set()
    for (let _ = 0; _ < 10; _++) {
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
}

const getRandomPost = (postIds) =>
    postIds[Math.floor(Math.random() * postIds.length)]

const getRandomPoster = (posterIds) => 
    posterIds[Math.floor(Math.random() * posterIds.length)]

const randomPostCreatedAtDate = (termName) => {
    const { start, end } = termIntervals[termName]

    return new Date(start + (Math.random() * (end - start)))
}

const query = async function (queryText, queryParams) {
    try {
        const queryResult = await client.query(queryText, queryParams)
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

const getTermCourses = async (termName) => {
    const [name, sYear]= termName.split(' ')
    const queryText = `
        SELECT course_id FROM course WHERE term = (
            SELECT term_id FROM term WHERE name = $1 AND year = $2);`
    const termCourseIdsQuery = await query(queryText, [name, parseInt(sYear)])

    return termCourseIdsQuery.rows.map(row => row.course_id)
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
    await genAllPosts()
}
catch (e) {
    console.log(e)
    console.error("something went wrong. run the destroy db script and try again.")
}
finally {
    await client.end()
}