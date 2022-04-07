import { query } from '../../../db/index'
import { sessionOptions } from '../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
    }
    if (!req.body?.newAvatarUrl || !req.body.userId) {
        resp.status(405).json({ message: "no new avatar url specified"})
        return
    }

    try {
        const queryText = `UPDATE person 
                            SET avatar_url = $1
                            WHERE user_id = $2;`
        const params = [req.body.newAvatarUrl, req.body.userId]
        await query(queryText, params) // array of row objects cont. email addrs
        req.session.user = { ...req.session.user, avatar_url: req.body.newAvatarUrl }
        await req.session.save()
        resp.status(200).json({ message: "update successful" })
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)