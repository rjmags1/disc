import { sendEmail } from '../../../lib/email'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sealData } from 'iron-session'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(400).json({ message: "not authenticated" })
        return
    }
    const { primary_email: primaryEmail } = req.session.user

    try {
        const seal = await sealData({ canReset: true }, { 
            password: process.env.SECRET_COOKIE_PASSWORD,
            ttl: 5 * 60 // expire in 5 minutes
        })
        const message = `
            <h1>Hello from disc!</h1>
            <p>Here's your password reset 
                <a href=
                ${ process.env.DOMAIN_URL }/resetPassword?seal=${ seal }>
                link
                </a>
                . Click it to reset your password.
            </p>`
        
        await sendEmail(
            primaryEmail, 
            "disc <donotreply@disc.com>", 
            "Reset password link", 
            message)
        
        resp.status(200).json({ message: "check your email!" })
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)