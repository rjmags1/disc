import { sendEmail } from '../../../lib/email'
import { validEmail, formatOrgForDb, validOrg } from '../../../lib/validation'
import { query } from '../../../db/index'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sealData } from 'iron-session'
import { sessionOptions } from '../../../lib/session'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (req.session?.user) {
        resp.status(400).json({ message: "already signed in" })
        return
    }
    if (!req.body) {
        resp.status(400).json({ 
            message: "must specify email to send magic link to"})
        return
    }
    const { org, email } = req.body
    if (!org || !email || !validEmail(email) || !validOrg(org)) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }
    

    // db query to check for valid org 
    //  (dev, would be used to route to org's db-server in real app)
    // db query on input email to verify it is associated with a user
    let queryResults
    const orgQueryText = `SELECT org_id FROM orgs WHERE name = $1`
    const orgQueryParams = [formatOrgForDb(org)]
    const userQueryText = `
        SELECT user_id FROM
            person JOIN email ON person.user_id = email.person 
        WHERE email = $1 LIMIT 1`
    const userQueryParams = [email]
    try {
        const queryPromises = []
        const orgQueryPromise = query(orgQueryText, orgQueryParams)
        queryPromises.push(orgQueryPromise)
        const userQueryPromise = query(userQueryText, userQueryParams)
        queryPromises.push(userQueryPromise)
        queryResults = await Promise.all(queryPromises)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    const [orgQueryResult, userQueryResult] = queryResults
    if (orgQueryResult.rows.length === 0 || userQueryResult.rows.length === 0) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }


    // seal user_id for placement into 'magic' login link
    let seal
    try {
        if (!process.env.SECRET_COOKIE_PASSWORD) {
            throw new Error("no encryption password in environment")
        }
        const { user_id: userId } = userQueryResult.rows[0]
        seal = await sealData({ userId }, { 
            password: process.env.SECRET_COOKIE_PASSWORD,
            ttl: 5 * 60 // expire in 5 minutes
        })
    }
    catch (error) {
        console.log(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
        

    // send 'magic' login link signed by user (with password)
    const message = `
            <h1>Hello from disc!</h1>
            <p>Here's your magic 
                <a href=
                ${ process.env.DOMAIN_URL }/api/auth/magicLogin?seal=${ seal }>link
                </a>
                . Click it to login.
            </p>`
    try {
        if (!process.env.DOMAIN_URL) {
            throw new Error("no domain url for magic login link")
        }
        await sendEmail(
            email, 
            process.env.SES_REG_FROM_EMAIL, 
            "Email login link", 
            message)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // send success response if everything went ok:
    // all env vars present, db query success and email sent
    resp.status(200).json({ message: "check your email!" })

}, sessionOptions)