import { query } from '../../../db/index'
import { sessionOptions } from '../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
    }
    if (!req.body.newAvatarUrl) {
        resp.status(405).json({ message: "bad request body"})
        return
    }


    // update user's avatar url in the db
    const { newAvatarUrl } = req.body
    const { user_id: userId } = req.session.user
    try {
        const newAvatarQueryText = `UPDATE person SET avatar_url = $1 
                                    WHERE user_id = $2;`
        const newAvatarQueryParams = [newAvatarUrl, userId]
        await query(newAvatarQueryText, newAvatarQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // save new url in session
    try {
        req.session.user = {
            ...req.session.user,
            avatar_url: req.body.newAvatarUrl 
        }
        await req.session.save()
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // send new avatar url back in success response
    resp.status(200).json({ 
        message: `update avatar to ${ newAvatarUrl } successful`
    })

}, sessionOptions)