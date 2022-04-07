import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

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
        resp.status(400).json({ message: "bad url "})
        return
    }

    try {
        const { userId } = req.query
        const queryText = `SELECT email FROM email WHERE
                            person = $1;`
        const params = [userId]
        const result = await query(queryText, params)
        const emails = { emails: [] }
        result.rows.forEach(({ email }) => emails.emails.push(email))
        resp.status(200).json(emails)
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)