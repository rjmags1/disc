import { query } from '../../../../../db/index'
import { sessionOptions } from '../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

const SETTING_TABLES = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

const SETTING_QUERIES = Object.fromEntries(
    SETTING_TABLES.map(setting => [
        setting, `SELECT is_on FROM ${ setting } WHERE person = $1`
    ])
)

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ settingStatuses: [] })
        return
    }
    const parsed = parseInt(req.query.userId, 10)
    if (parsed !== req.session.user.user_id) {
        // userId in query will always come from
        // session cookie via useUser hook in normal app usage. if not, 
        // and the session cookie user_id doesnt match userId in query,
        // someone may be trying to maliciously view someone elses information
        resp.status(400).json({ message: "dont be malicious" })
        return
    }

    
    // get email notifications settings associated with userId from db
    const { userId } = req.query
    let settingsQueryResults = []
    try {
        const queryPromises = []
        for (const setting in SETTING_QUERIES) {
            const queryText = SETTING_QUERIES[setting]
            const queryPromise = query(queryText, [userId])
            queryPromises.push(queryPromise)
        }
        settingsQueryResults = await Promise.all(queryPromises)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    for (const queryResult of settingsQueryResults) {
        if (queryResult.rows.length === 0) {
            resp.status(400).json({ message: "bad url" })
            return
        }
    }


    // send user settings in success response
    const settingStatuses = Object.fromEntries(
        settingsQueryResults.map((result, i) => [
            SETTING_TABLES[i], result.rows[0].is_on
        ])
    )
    resp.status(200).json({ settingStatuses })

}, sessionOptions)