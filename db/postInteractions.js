const { Pool } = require("pg")
const path = require("path")
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const pool = new Pool()

// 12/18/2003 EON UTC, fall 2003 term end
const SPECIAL_TERM_END = +(new Date(Date.UTC(2003, 11, 18, 23, 59)))

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
    const postsQueryText = `SELECT post_id, created_at FROM post;`
    const postsQuery = await query(postsQueryText)
    for (let i = 0; i < postsQuery.rows.length; i++) {
        if (i % 2 === 0) continue

        const { post_id: postId, created_at: postCreatedAt } = postsQuery.rows[i]
        console.log(postId)
        const queryParams = [postId, harryId]
        for (const queryText of QUERIES) {
            if (queryText === VIEW_QUERY) {
                queryParams.push(getRandomTimeAfter(postCreatedAt))
                await query(queryText, queryParams)
                queryParams.pop()
            }
            else {
                await query(queryText, queryParams)
            }
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

const getRandomTimeAfter = (time) => {
    time = +time
    return new Date(time + Math.random() * (SPECIAL_TERM_END - time))
}

genInteractions()