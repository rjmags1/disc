import { unsealData } from 'iron-session'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { query } from '../../../db/index'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.query?.seal) {
        resp.status(400).json({ message: "bad url"})
        return
    }


    // unseal encrypted iron seal containing userId for query
    let unsealed
    try {
        if (!process.env.SECRET_COOKIE_PASSWORD) {
            throw new Error("no encryption password in environment")
        }
        unsealed = await unsealData(req.query.seal, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    const { userId } = unsealed
    if (!userId) {
        resp.status(400).json({ message: "do not alter the email link" })
        return
    }


    // db query on userId that was encrypted and passed in email sent
    // from /sendMagicLink endpoint to email address entered on /login page 
    let userQueryResult
    try {
        const queryText = `
            /*
            cant select directly on userId from join because we need
            to store primary_email, not just any user-associated email,
            in session. direct userId selection -> for each user, one row 
            per email associated with their account in the join table. 
            so, userId -> primary_email id of user w/ userId -> 
                join table row with primary_email address
            */
            SELECT
                person.user_id, 
                person.f_name, 
                person.l_name, 
                person.is_admin,
                person.is_staff,
                person.is_instructor,
                avatar_url.avatar_url,
                person.password_hash,
                email.email as primary_email
            FROM (SELECT * FROM person WHERE user_id = $1) as person
            JOIN email ON person.user_id = email.person
            JOIN avatar_url ON person.avatar_url = avatar_url.avatar_url_id;`
        const params = [userId]
        userQueryResult = await query(queryText, params)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (userQueryResult.rows.length === 0) {
        resp.status(400).json({ 
            message: "failed to perform login. do not alter the sent link." })
        return
    }


    // dont put password hash in session
    const userInfo = Object.fromEntries(
        Object.entries(userQueryResult.rows[0]).
            filter(([db_field]) => !db_field.includes("password_hash"))
    )
    const user = {
        authenticated: true,
        ...userInfo
    }


    // session creation 
    try {
        req.session.user = user
        await req.session.save()
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
    }


    // redirect response if everything worked out
    resp.redirect(307, '/')

}, sessionOptions)