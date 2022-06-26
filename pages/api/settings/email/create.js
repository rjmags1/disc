import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'



export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.body?.newEmail) {
        resp.status(400).json({ message: "bad request body"})
        return
    }


    // insert new email into db
    const { newEmail } = req.body
    const { user_id: userId } = req.session.user
    try {
        const createEmailQueryText = `
            INSERT into EMAIL (person, email) VALUES ($1, $2);`
        const createEmailQueryParams = [userId, newEmail]
        await query(createEmailQueryText, createEmailQueryParams)
    }
    catch (error) {
        resp.status(500).json({ message: "internal server error" })
        return
    }
    

    // send new email added message in success response
    resp.status(200).json({ message: `successfully registered ${ newEmail }` })

}, sessionOptions)