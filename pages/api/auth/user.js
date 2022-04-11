import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function (req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) { // no session cookie
        resp.status(404).json({
            authenticated: false,
            user_id: "",
            f_name: "",
            l_name: "",
            primary_email: "",
            avatar_url: ""
        })
        return
    }


    // return user in session cookie
    resp.status(200).json({
        ...req.session.user
    })

}, sessionOptions)

