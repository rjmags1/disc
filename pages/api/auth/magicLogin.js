import { unsealData } from 'iron-session'
import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../../lib/session'
import { query } from '../../../db/index'

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.query.seal) {
        resp.status(400).json({ message: "no seal in query string"})
        return
    }


    const { userId } = await unsealData(req.query.seal, {
        password: process.env.SECRET_COOKIE_PASSWORD
    })

    let result
    try {
        const queryText =`SELECT
                            user_id, 
                            f_name, 
                            l_name, 
                            is_admin,
                            is_staff,
                            is_instructor,
                            avatar_url,
                            password_hash
                        FROM person WHERE user_id = $1`
        const params = [userId]
        result = await query(queryText, params)
    }
    catch (error) {
        console.log(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (result.rows.length === 0) {
        resp.status(400).json({ 
            message: "failed to perform login. do not alter the sent link." })
        return
    }

    const user = {
        authenticated: true,
        ...result.rows[0]
    }
    req.session.user = user
    await req.session.save()
    resp.redirect('/')
}, sessionOptions)