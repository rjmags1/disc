import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.body?.userId || !req.body.newEmail) {
        resp.status(400).json({ message: "must provide email and userId"})
        return
    }

    try {
        const { userId, newEmail } = req.body
        const queryText = `INSERT into EMAIL
                            (person,
                            email)
                            VALUES
                            ($1,
                            $2);`
        const params = [userId, newEmail]
        const result = await query(queryText, params)
        console.log(result)
        resp.status(200).json({ 
            message: `successfully registered ${ newEmail }`
        })
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)