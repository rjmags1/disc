import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function (req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (req.session.user) {
        resp.json({
            ...req.session.user
        })
    }
    else {
        resp.json({
            authenticated: false,
            userid: "",
            fname: "",
            lname: "",
            email: "",
            avatarurl: ""
        })
    }
}, sessionOptions)

