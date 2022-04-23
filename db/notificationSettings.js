const { Pool } = require("pg")
const path = require("path")
require('dotenv').config({
    path: path.resolve(__dirname, '../.env.local')
})
const pool = new Pool()

const SETTING_TABLES = [
    "comment_reply_email_setting",
    "watch_email_setting",
    "mention_email_setting",
    "post_activity_email_setting"
]

const genNotificationSettings = async function() {
    // get all people
    const peopleQuery = await query("SELECT user_id FROM person;")
    const userIds = peopleQuery.rows.map(
        row => row.user_id
    )
    for (const table of SETTING_TABLES) {
        for (const userId of userIds) {
            await query(`INSERT INTO ${table} (person) VALUES ($1);`, [userId])
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

genNotificationSettings()