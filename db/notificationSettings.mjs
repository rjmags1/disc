import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()

const SETTING_TABLES = [
    "comment_reply_email_setting",
    "watch_email_setting",
    "mention_email_setting",
    "post_activity_email_setting"
]

const genNotificationSettings = async function() {
    // get all people and set up default noti settings for each of them
    const peopleQuery = await query("SELECT user_id FROM person;")
    const userIds = peopleQuery.rows.map(row => row.user_id)
    for (const table of SETTING_TABLES) {
        for (const userId of userIds) {
            await query(`INSERT INTO ${table} (person) VALUES ($1);`, [userId])
        }
    }
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
    await genNotificationSettings()
}
catch (error) {
    console.error(
        "something went wrong. run the destroy_db script and try again\n\n")
}
finally {
    await client.end()
}