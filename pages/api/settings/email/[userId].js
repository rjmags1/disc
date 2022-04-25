import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ emails: [] })
        return
    }
    const parsed = parseInt(req.query.userId, 10)
    if (parsed !== req.session.user.user_id) {
        // userId in query should always come from 
        // session cookie via useUser hook in normal app usage. if not, 
        // ie the session cookie user_id doesnt match userId in body,
        // someone may be trying to maliciously view someone elses info
        resp.status(400).json({ message: "dont be malicious" })
        return
    }

    
    // get emails associated with userId from db
    const { userId } = req.query
    let emailQueryResult
    try {
        const emailQueryText = `SELECT email FROM email WHERE person = $1;`
        const emailQueryParams = [userId]
        emailQueryResult = await query(emailQueryText, emailQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    

    // send user associated emails in success resp
    const emails = emailQueryResult.rows.map(({ email }) => email)
    resp.status(200).json({ emails })

}, sessionOptions)