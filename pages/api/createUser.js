import { withIronSessionApiRoute } from "iron-session/next"
import { sessionOptions } from "../../lib/session"
import { query } from "../../db/index"
import { hash } from "bcrypt"
import { validEmail, validPassword } from "../../lib/validation"

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'POST') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session.user) {
        resp.status(400).json({ message: "not signed in" })
        return
    }
    if (!req.session.user.isadmin) {
        resp.status(401).json({ message: "not authorized" })
        return
    }
    if (!req.body.newUser) {
        resp.status(400).json({ message: "must specify new user data" })
        return
    }

    const {
        fname, lname, email, avatarurl, password, isadmin, org
    } = req.body?.newUser
    if (!fname || !lname || !email || !avatarurl || !org
        || !password || !(isadmin === true || isadmin === false)) {
        resp.status(400).json({ 
            message: "please specify valid org, fname, lname, email, avatarUrl, password, admin status for new user."
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
        const params = [fname, lname, email, avatarurl, hashed, isadmin]
        const result = await query(queryText, params)
        const rows = result.rows

        const userId = rows[0].userid
        const newUserInfo = {
            userId: userId,
            isAdmin: isadmin,
            fname: fname,
            lname: lname,
            email: email,
            avatarUrl: avatarurl,
            org: org
        }
        resp.status(200).json(newUserInfo)
    }
    catch (error) {
        console.error(error)
        resp.status(400).json({ message: "problem adding new user. consider specifying alternate email" })
    }
}, sessionOptions)