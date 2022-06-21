import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()

const SAMPLE_CATEGORIES = [
    "General",
    "Projects",
    "Midterm",
    "Final Exam",
    "Assignments",
    "Socials",
    "Extra Credit"
]

const genPostCategories = async function() {
    let queryText = `SELECT course_id FROM course;`
    const allCourseIdQuery = await query(queryText)
    const courseIds = allCourseIdQuery.rows.map(row => row.course_id)

    queryText = `INSERT INTO post_category (course, name) VALUES ($1, $2);`
    for (const courseId of courseIds) {
        for (const category of SAMPLE_CATEGORIES) {
            await query(queryText, [courseId, category])
        }
    }

    await client.end()
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

try {
    await genPostCategories()
}
catch (e) {
    console.error(
        "something went wrong. run the destroy_dbb script and try again\n\n")
}
finally {
    await client.end()
}