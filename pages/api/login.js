import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "../../lib/session"
import { query } from "../../db/index"
import { compare } from "bcrypt"
import { loginValidator, formatOrgForDb } from "../../lib/validation"

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (req.session.user) {
        resp.status(204).json({ message: "already logged in" })
        return
    }
    if (!req.body) {
        resp.status(400).json({
            message: "need to supply credentials to login"
        })
        return
    }
    const { email, password, org } = await req.body
    if (!email || !password || !loginValidator(email, password, org)) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }

    let result
    try {
        let queryText = `SELECT
                            user_id, 
                            f_name, 
                            l_name, 
                            is_admin,
                            is_staff,
                            is_instructor,
                            avatar_url,
                            password_hash
                        FROM person JOIN email ON
                            person.user_id = email.person WHERE email = $1`
        let params = [email]
        result = await query(queryText, params)
        console.log(result.rows[0])

        // extra round trip now for dev
        queryText = `SELECT * FROM orgs WHERE name = $1`
        params = [formatOrgForDb(org)]
        const checkForRow = await query(queryText, params)
        if (checkForRow.rows.length === 0) {
            resp.status(400).json({ message: "invalid credentials" })
            return
        }
    }
    catch (err) {
        console.log(err)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (result.rows.length === 0) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }
    
    const hashed = result.rows[0].password_hash
    const match = await compare(password, hashed)
    if (!match) {
        resp.status(400).json({ message: "invalid credentials" })
        return
    }
    const userInfo = Object.fromEntries(Object.entries(result.rows[0]).
        filter(([key]) => !key.includes("password_hash")))
    const user = { 
        authenticated: true,
        ...userInfo
    }
    req.session.user = user
    await req.session.save()
    resp.status(200).json(user)
}, sessionOptions)