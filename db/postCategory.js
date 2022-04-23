const { Pool } = require("pg")
const path = require("path")
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const pool = new Pool()

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
    const courseIds = allCourseIdQuery.rows.map(
        row => row.course_id
    )

    queryText = `INSERT INTO post_category (course, name) VALUES ($1, $2);`
    for (const courseId of courseIds) {
        for (const category of SAMPLE_CATEGORIES) {
            await query(queryText, [courseId, category])
        }
    }

    pool.end(() => {})
}

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

genPostCategories()