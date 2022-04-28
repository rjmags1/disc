import { query } from '../../../../../db/index'
import { sessionOptions } from '../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'


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
    let settingsQueryResult
    try {
        // get all user notifications settings in one query
        const settingsQueryText = `
        SELECT
            comment_reply_email_setting,
            mention_email_setting,
            post_activity_email_setting,
            watch_email_setting
        FROM
            (SELECT 
                is_on AS comment_reply_email_setting, person
                FROM comment_reply_email_setting WHERE person = $1) 
                AS setting_1
            JOIN
            (SELECT is_on AS mention_email_setting, person AS person_2
                FROM mention_email_setting WHERE person = $1) 
                AS setting_2 ON person = person_2
            JOIN
            (SELECT is_on AS post_activity_email_setting, person AS person_3
                FROM post_activity_email_setting WHERE person = $1)
                AS setting_3 ON person = person_3
            JOIN
            (SELECT is_on AS watch_email_setting, person AS person_4
                FROM watch_email_setting WHERE person = $1)
                AS setting_4 ON person = person_4;`
        const settingsQueryParams = [userId]
        settingsQueryResult = await query(settingsQueryText, settingsQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (settingsQueryResult.rows.length === 0) {
        resp.status(400).json({ message: "bad url" })
        return
    }


    // send user settings in success response
    const settingStatuses = settingsQueryResult.rows[0]
    resp.status(200).json({ settingStatuses })

}, sessionOptions)