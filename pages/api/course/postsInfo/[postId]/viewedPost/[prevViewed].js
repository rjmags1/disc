import { query } from '../../../../../../db/index'
import { sessionOptions } from '../../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not logged in" })
        return
    }
    if (!req.query) {
        resp.status(400).json({ message: "no params in url" })
        return
    }
    const userId = req.session.user.user_id
    const { postId, prevViewed } = req.query
    

    
    // perform the relevant db interaction based on if the user
    // has previously viewed the post or not
    try {
        const queryText = prevViewed === "t" ?
            `UPDATE post_view SET last_viewed_at = $1 
            WHERE post = $2 AND viewer = $3;`
            :
            `INSERT INTO post_view (last_viewed_at, post, viewer)
            VALUES ($1, $2, $3);`
        await query(queryText, [new Date(Date.now()), postId, userId])
    }
    catch(error) {
        resp.status(500).json({ message: "internal server error" })
        return
    }

    resp.status(200).json({ userId })
    return

}, sessionOptions)