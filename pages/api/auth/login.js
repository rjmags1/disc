import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "../../../lib/session"
import { query } from "../../../db/index"
import { compare } from "bcrypt"
import { validLoginInfo, formatOrgForDb } from "../../../lib/validation"

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (req.session?.user) {
        resp.status(400).json({ message: "already logged in" })
        return
    }
    if (!req.body) {
        resp.status(401).json({
            message: "need to supply credentials to login"
        })
        return
    }
    const { email, password, org } = req.body
    if (!email || !password || !org || !validLoginInfo(email, password, org)) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }


    // db query
    let userQueryResult
    try {
        /*
        real app would do something like determine if we have a valid
        org-user relation, and then forward the request to a db
        server associated with the user's organization to
        do the actual user verification and send client response
        */
        let queryText = `SELECT * FROM orgs WHERE name = $1`
        let queryParams = [formatOrgForDb(org)]
        const orgCheck = await query(queryText, queryParams)
        if (orgCheck.rows.length === 0) {
            resp.status(400).json({ message: "invalid credentials" })
            return
        }

        queryText = `SELECT
                        person.user_id, 
                        person.f_name, 
                        person.l_name, 
                        person.is_admin,
                        person.is_staff,
                        person.is_instructor,
                        person.avatar_url,
                        person.password_hash,
                        email.email as primary_email
                    FROM person JOIN email ON person.user_id = email.person
                    WHERE (
                        SELECT person.primary_email FROM person 
                            WHERE person.user_id = 
                                (SELECT person from email WHERE email = $1)
                        ) = email.email_id;` // unique email-org
        queryParams = [email]
        userQueryResult = await query(queryText, queryParams)
    }
    catch (err) {
        console.log(err)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (userQueryResult.rows.length === 0) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }
    

    // user verification
    const userByEmail = userQueryResult.rows[0]
    const { password_hash: hashed } = userByEmail
    const correctPassword = await compare(password, hashed)
    if (!correctPassword) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }
    const userInfo = Object.fromEntries(
        Object.entries(userByEmail).
            filter(([db_field]) => !db_field.includes("password_hash"))
    )
    const user = { 
        authenticated: true,
        ...userInfo
    }


    // session creation + success response if everything worked out
    req.session.user = user
    await req.session.save()
    console.log("logged in", user)
    resp.status(200).json(user)

}, sessionOptions)