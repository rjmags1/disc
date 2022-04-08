import { poolQuery } from "../../../../../db"
import { sessionOptions } from "../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"

const SETTINGS = [
    "comment_reply_email_setting",
    "mention_email_setting",
    "post_activity_email_setting",
    "watch_email_setting"
]

const SETTING_QUERIES = Object.fromEntries(
    SETTINGS.map(setting => [
        setting, `UPDATE ${ setting } SET is_on = $1 WHERE person = $2`
    ])
)

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'PATCH') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.body?.userId || !req.body.settings) {
        resp.status(400).json({ message: "bad request body" })
    }

    try {
        const { userId, settings: newSettings } = req.body
        const queryPromises = []
        for (const setting in SETTING_QUERIES) {
            const queryText = SETTING_QUERIES[setting]
            const queryPromise = poolQuery(queryText, [
                newSettings[setting], 
                userId
            ])
            queryPromises.push(queryPromise)
        }
        await Promise.all(queryPromises)

        resp.status(200).json({ newSettings })
    }
    catch (error) {
        console.error(error.message)
        resp.status(400).json({ message: "problem updating settings" })
    }
}, sessionOptions)