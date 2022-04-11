import { getClientFromPool, clientQuery, releaseClient } from "../../../../../db"
import { sessionOptions } from "../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"

const SETTING_TABLES = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

const SETTING_QUERIES = Object.fromEntries(
    SETTING_TABLES.map(setting => [
        setting, `UPDATE ${ setting } SET is_on = $1 WHERE person = $2`
    ])
)

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.body?.settings) { 
        resp.status(400).json({ message: "bad request body" })
        return
    }


    // check out client from pool
    let updater
    try {
        updater = await getClientFromPool()
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // do transaction to update user settings in db 
    // (1 distinct table per setting)
    const { user_id: userId } = req.session.user
    const { settings: newSettings } = req.body
    try {
        await clientQuery(updater, 'BEGIN')
        for (const setting in SETTING_QUERIES) {
            const queryText = SETTING_QUERIES[setting]
            const newOnStatus = newSettings[setting]
            await clientQuery(updater, queryText, [newOnStatus, userId])
        }
        await clientQuery(updater, 'COMMIT')
    }
    catch (error) {
        await clientQuery(updater, 'ROLLBACK')
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
    }
    finally { // always release pool clients!
        releaseClient(updater)
    }


    // send newSettings now present in db in success response
    resp.status(200).json({ newSettings })

}, sessionOptions)