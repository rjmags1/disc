import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "lib/session"
import { query } from "../../db/index"
import { hash } from "bcrypt"
import { validEmail, validPassword } from "../../lib/validation"

export async function createUserRoute(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session) {
        resp.status(400).json({ message: "not authenticated" })
        return
    }
    if (!req.session.user.isAdmin) {
        resp.status(401).json({ message: "not authorized" })
        return
    }

    const {
        fname, lname, email, avatarUrl, password, isAdmin, org
    } = req.body?.newUser
    if (!fname || !lname || !email || !avatarUrl || !org
        || !password || !(isAdmin === true || isAdmin === false)) {
        resp.status(400).json({ 
            message: "please specify org, fname, lname, email, avatarUrl, password, admin status for new user."
        })
        return
    }
    if (!validEmail(email) || !validPassword(password)) {
        resp.status(400).json( {
            message: "please specify valid username and password for new user."
        })
        return
    }


    try {
        const formattedOrg = org.slice(0, 1).toUpperCase() + org.slice(1).toLowerCase()
        const queryText = `SELECT * FROM orgs WHERE name=$1 LIMIT 1`
        const params = [formattedOrg]
        const result = await query(queryText, params)
        const rows = result.rows
        if (rows.length === 0) {
            resp.status(400).json({ message: "invalid org" })
            return
        }
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }

    try {
        const hashed = await hash(password, 12)
        const queryText = `INSERT INTO person(fname, lname, email, avatarurl, passwordhash, isadmin) 
                            VALUES($1, $2, $3, $4, $5, $6) RETURNING *`
        const params = [fname, lname, email, avatarUrl, hashed, isAdmin]
        const result = await query(queryText, params)
        const rows = result.rows

        const userId = rows[0].userid
        const newUserInfo = {
            userId: userId,
            isAdmin: isAdmin,
            fname: fname,
            lname: lname,
            email: email,
            avatarUrl: avatarUrl,
            org: org
        }
        resp.status(200).json(newUserInfo)
    }
    catch (error) {
        resp.status(400).json({ message: "problem adding new user. consider specifying alt email" })
    }
}

export default withIronSessionApiRoute(createUserRoute, sessionOptions)