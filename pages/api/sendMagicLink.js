import { sendEmail } from '../../lib/email'
import { validEmail } from '../../lib/validation'
import { query } from '../../db/index'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sealData } from 'iron-session'
import { sessionOptions } from '../../lib/session'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (req.session.user) {
        resp.status(400).json({ message: "already signed in" })
        return
    }
    if (!req.body.email) {
        resp.status(400).json({ message: "must specify email to send magic link to"})
        return
    }
    const email = req.body.email
    if (!validEmail(email)) {
        resp.status(400).json({ message: "malformed email" })
        return
    }
    

    try {
        const queryText = "SELECT userid from person where email = $1"
        const params = [email]
        const result = await query(queryText, params)
        const rows = result.rows
        if (rows.length === 0) {
            resp.status(400).json({ message: "unregistered email" })
            return
        }

        const userId = rows[0].userid
        const seal = await sealData(
            { userId: userId },
            { password: process.env.SECRET_COOKIE_PASSWORD }
        )
        const message = `
            <h1>Hello from disc!</h1>
            <p>Here's your magic 
                <a href=${ process.env.DOMAIN_URL }/api/magicLogin?seal=${ seal }>link</a>
                . Click it to login.
            </p>`
        
        await sendEmail(email, "disc <donotreply@disc.com>", "Email login link", message)
        
        resp.status(200).json({ message: "check your email!" })
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)