import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { query } from '../../../db/index'
import { hash } from 'bcrypt'
import { unsealData } from 'iron-session'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'PATCH') {
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

    const newPassword = req.body.newPassword
    const { user_id: userId } = req.session.user
    try {
        const { canReset } = await unsealData(req.body.seal, {
            password: process.env.SECRET_COOKIE_PASSWORD
        })
        if (!canReset) {
            resp.status(400).json({ message: "try again" })
            return
        }

        const hashedNewPassword = await new Promise((res, rej) => {
            hash(newPassword, 12, function(err, hash) {
                if (err) rej(err)
                res(hash)
            })
        })
        const queryText = `UPDATE person SET 
                            password_hash = $1 WHERE 
                            user_id = $2;`
        const params = [hashedNewPassword, userId]
        await query(queryText, params)
        req.session.destroy()
        resp.status(200).json({ message: "successfully updated password" })
    }
    catch (error) {
        resp.status(400).json({ message: error.message })
    }
}, sessionOptions)