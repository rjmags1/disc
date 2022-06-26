import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()

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

const VIEW_QUERY = `
    INSERT INTO post_view (post, viewer, last_viewed_at) VALUES ($1, $2, $3);`
const QUERIES = [
    `INSERT INTO post_like (post, liker) VALUES ($1, $2);`,
    `INSERT INTO post_star (post, starrer) VALUES ($1, $2);`,
    `INSERT INTO post_watch (post, watcher) VALUES ($1, $2);`,
    VIEW_QUERY
]

const genInteractions = async function() {
    // have harry star, like, and watch half of all posts for dev
    // have harry view 3/4 of every post at some random time after its creation
    const harryId = 2
    const postsQueryText = `SELECT post_id, created_at FROM 
        (SELECT course FROM person_course WHERE person = $1) AS enrolled_courses
        LEFT JOIN post_category ON post_category.course = enrolled_courses.course
        LEFT JOIN post ON post.category = category_id;`
    const postsQuery = await query(postsQueryText, [harryId])
    for (let i = 0; i < postsQuery.rows.length; i++) {
        if (i % 2 === 0) continue

        const { post_id: postId, created_at: postCreatedAt } = postsQuery.rows[i]
        const queryParams = [postId, harryId]
        for (const queryText of QUERIES) {
            if (queryText === VIEW_QUERY) {
                queryParams.push(getRandomTimeAfter(postCreatedAt))
                try {
                    await query(queryText, queryParams)
                }
                catch (e) { } // already post view in table from comment
                queryParams.pop()
            }
            else {
                await query(queryText, queryParams)
            }
        }
    }
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

const getRandomTimeAfter = (time) => {
    time = +time
    for (const { start, end } of Object.values(termIntervals)) {
        if (time >= start && time <= end) {
            return new Date(time + Math.random() * (end - time))
        }
    }
    
}

try {
    await genInteractions()
}
catch (e) {
    console.error(e)
}
finally {
    await client.end()
}