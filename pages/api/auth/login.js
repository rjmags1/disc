import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "../../../lib/session"
import { query } from "../../../db/index"
import { compare } from "bcrypt"
import { validLoginInfo, formatOrgForDb } from "../../../lib/validation"

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
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
        resp.status(401).json({ message: "invalid credentials" })
        return
    }


    // db query to check for valid org 
    //  (dev, would be used to route to org's db-server in real app)
    // db query on input email for session info + password_hash for verification
    let queryResults
    const orgQueryText = `SELECT org_id FROM orgs WHERE name = $1`
    const orgQueryParams = [formatOrgForDb(org)]
    const userQueryText = `
        /*
        cant select directly on email from join because we need
        to store primary_email, not just any user-associated email,
        in session. email param may be non-primary, user-associated email.
        so, email -> id of associated user -> primary_email id
            -> join table row with primary_email address
        */
        SELECT
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
            WHERE (
                SELECT person from email WHERE email = $1
            ) = person.user_id
        ) = email.email_id;`
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
    

    // password user verification using bcrypt.compare w/ 
    // hashed password supplied on account creation/password reset
    const userByEmail = userQueryResult.rows[0]
    const { password_hash: hashed } = userByEmail
    const correctPassword = await compare(password, hashed)
    if (!correctPassword) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }


    // dont put password hash in session
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