import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(logoutRoute, sessionOptions)

async function logoutRoute(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session.user) {
        resp.status(400).json({ message: "not signed in" })
    }
    req.session.destroy()
    resp.status(200).json({
        authenticated: false,
        user_id: "",
        f_name: "",
        l_name: "",
        email: "",
        avatar_url: ""
    })
}