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
        resp.status(400).json({ message: "bad url param" })
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
        resp.status(500).json({ message: "internal server error" })
        return
    }
    

    // send user associated emails in success resp
    const emails = emailQueryResult.rows.map(({ email }) => email)
    resp.status(200).json({ emails })

}, sessionOptions)