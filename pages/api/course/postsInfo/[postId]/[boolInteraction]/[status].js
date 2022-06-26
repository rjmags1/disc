import { 
    getClientFromPool, clientQuery, releaseClient 
} from '../../../../../../db/index'
import { sessionOptions } from '../../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

const BOOLEAN_POST_INTERACTIONS = [
    "like", "watch", "star", "endorse", "delete", "resolve"]

const STATUSES = ["true", "false"]


export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not logged in" })
        return
    }
    const userId = req.session.user.user_id
    const { postId, boolInteraction, status } = req.query
    const parsedPostId = parseInt(postId)
    if (!parsedPostId || 
        BOOLEAN_POST_INTERACTIONS.indexOf(boolInteraction) === -1 || 
        STATUSES.indexOf(status) === -1) {
        resp.status(400).json({ message: "incorrect url params" })
    }


    // determine which query/ies to use based on interaction type
    let checkQueryText, insertQueryText, deleteQueryText, updateQueryText
    let params = [parsedPostId, userId]
    if (boolInteraction === "like") {
        checkQueryText = `SELECT post_like_id FROM post_like 
            WHERE post = $1 AND liker = $2;`
        insertQueryText = `INSERT INTO post_like (post, liker) VALUES ($1, $2);`
        deleteQueryText = `DELETE FROM post_like WHERE post = $1 AND liker = $2;`
    }
    else if (boolInteraction === "watch") {
        checkQueryText = `SELECT watch_id FROM post_watch 
            WHERE post = $1 AND watcher = $2;`
        insertQueryText = `INSERT INTO post_watch (post, watcher) VALUES ($1, $2);`
        deleteQueryText = `DELETE FROM post_watch WHERE post = $1 AND watcher = $2;`
    }
    else if (boolInteraction === "star") {
        checkQueryText = `SELECT star_id FROM post_star 
            WHERE post = $1 AND starrer = $2;`
        insertQueryText = `INSERT INTO post_star (post, starrer) VALUES ($1, $2);`
        deleteQueryText = `DELETE FROM post_star WHERE post = $1 AND starrer = $2;`
    }
    else if (boolInteraction === "endorse") {
        updateQueryText = `UPDATE post SET endorsed = $1 WHERE post_id = $2;`
        params = [status, postId]
    }
    else if (boolInteraction === "delete") {
        updateQueryText = `UPDATE post SET deleted = TRUE WHERE post_id = $1;`
        params = [postId]
    }


    let client, queryFailure
    try {
        // checkout a client from the pool in case we need to do multiple queries
        client = await getClientFromPool()
        const needCheck = !!checkQueryText
        if (needCheck) { // we are dealing w/ tables where row presence 
            // represent interaction on status (ie, a liked post has a row with
            // liker and post in post_like db relation)
            const checkResult = await clientQuery(client, checkQueryText, params)
            const rowAlreadyPresent = checkResult.rows.length > 0
            if (rowAlreadyPresent && status === "false") { 
                // do nothing if turning on, see above comment
                // delete row if turning off
                await clientQuery(client, deleteQueryText, params) 
            }
            else if (!rowAlreadyPresent && status === "true") { 
                // we need to insert a new row to indicate on status
                await clientQuery(client, insertQueryText, params)
            }
        }
        else { // interaction status represented by boolean col in post table
            await clientQuery(client, updateQueryText, params)
        }
    }
    catch(error) {
        queryFailure = true
        resp.status(500).json({ message: "internal server error" })
    }
    finally {
        if (!!client) await releaseClient(client)
    }
    if (queryFailure) return




    resp.status(200).json({ parsedPostId, boolInteraction, status, userId })

}, sessionOptions)