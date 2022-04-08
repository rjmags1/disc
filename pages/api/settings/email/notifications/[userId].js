import { poolQuery } from '../../../../../db/index'
import { sessionOptions } from '../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

const QUERIES = [
    `SELECT is_on FROM comment_reply_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM mention_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM post_activity_email_setting 
        WHERE person = $1;`,
    `SELECT is_on FROM watch_email_setting
        WHERE person = $1`
]

const SETTINGS = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.query?.userId) {
        resp.status(400).json({ message: "bad url" })
        return
    }

    try {
        const { userId } = req.query
        const queryPromises = []
        for (const queryText of QUERIES) {
            const queryPromise = poolQuery(queryText, [userId])
            queryPromises.push(queryPromise)
        }
        const queryResults = await Promise.all(queryPromises)

        const settingStatuses = Object.fromEntries(
            queryResults.map((result, i) => [
                SETTINGS[i], 
                result.rows[0].is_on
            ]))

        resp.status(200).json({ settingStatuses })
    }
    catch (error) {
        console.error(error.message)
        resp.status(400).json({ message: "problem fetching settings"})
    }
}, sessionOptions)