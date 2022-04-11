import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { query } from '../../../db/index'
import { hash } from 'bcrypt'
import { unsealData } from 'iron-session'
import { validPassword } from '../../../lib/validation'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }
    if (!req.body?.newPassword || !req.body.seal) {
        resp.status(400).json({ message: "try again" })
        return
    }


    // unseal seal that was supposed to come email sent by server, check it
    const { newPassword } = req.body
    const { user_id: userId } = req.session.user
    let canReset
    try {
        if (!process.env.SECRET_COOKIE_PASSWORD) {
            throw new Error("no cookie password in env")
        }
        const unsealed = await unsealData(req.body.seal, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })
        canReset = unsealed.canReset
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return 
    }
    if (!canReset) {
        resp.status(400).json({ message: "dont be malicious" })
        return
    }


    // validate password before hashing and storing
    if (!validPassword(newPassword)) {
        resp.status(400).json({ 
            message: `input password too long, too short, 
                or contains unaccepted special characters` 
        })
        return
    }


    // hash the new password if everything ok so far
    let hashedNewPassword
    try {
        hashedNewPassword = await new Promise((res, rej) => {
            hash(newPassword, 12, function(err, hash) {
                if (err) rej(err)
                res(hash)
            })
        })
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error "})
        return 
    }


    // put the new hashed password into the db
    try {
        const updatePasswordQueryText = `UPDATE person SET password_hash = $1
                                         WHERE user_id = $2;`
        const updatePasswordQueryParams = [hashedNewPassword, userId]
        await query(updatePasswordQueryText, updatePasswordQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // destroy session cookie to force login with new password
    try {
        req.session.destroy()
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // send redirect response to login page
    resp.status(307).redirect('/login')

}, sessionOptions)