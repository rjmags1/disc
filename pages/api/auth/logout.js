import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function (req, resp) {
    // req guard
    if (req.method !== 'DELETE') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(400).json({ message: "not signed in" })
    }


    // destroy session cookie
    try {
        req.session.destroy() // dont need to call session.save after this
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // respond with 'deleted' user
    resp.status(200).json({
        authenticated: false,
        user_id: "",
        f_name: "",
        l_name: "",
        primary_email: "",
        avatar_url: ""
    })

}, sessionOptions)