import { sendEmail } from '../../../lib/email'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sealData } from 'iron-session'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(400).json({ message: "not authenticated" })
        return
    }


    // gen arbitrary seal encrypted with server env password
    const { primary_email: primaryEmail } = req.session.user
    let seal
    try {
        if (!process.env.SECRET_COOKIE_PASSWORD) {
            throw new Error("no secret cookie password env var")
        }
        seal = await sealData({ canReset: true }, { 
            password: process.env.SECRET_COOKIE_PASSWORD,
            ttl: 5 * 60 // expire in 5 minutes
        })
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // send email with seal 
    const message = `
        <h1>Hello from disc!</h1>
        <p>Here's your password reset 
            <a href=
            ${ process.env.DOMAIN_URL }/resetPassword?seal=${ seal }>
            link
            </a>
            . Click it to reset your password.
        </p>`
    try {
        await sendEmail(
            primaryEmail, 
            process.env.SES_REG_FROM_EMAIL, 
            "Reset password link", 
            message)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
        

    // send success response with message indicating email was sent
    resp.status(200).json({ message: "check your primary email!" })

}, sessionOptions)