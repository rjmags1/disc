import {
    getClientFromPool, clientQuery, releaseClient
} from '../../../../../../../../../db/index'
import { sessionOptions } from '../../../../../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

const BOOLEAN_COMMENT_INTERACTIONS = [
    "like", "delete", "endorse", "markAnswered", "markResolved"]

const STATUSES = ["true", "false"]

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not logged in" })
        return
    }
    const userId = req.session.user.user_id
    const commentId = parseInt(req.query.commentId, 10)
    const slug = req.query.boolInteractionStatusSlug
    console.log(userId, commentId, slug)
    if (!commentId || commentId < 1 || ! slug || slug.length !== 2) {
        resp.status(400).json({ message: "bad url params" })
        return
    }
    const [boolInteraction, status] = slug
    if (BOOLEAN_COMMENT_INTERACTIONS.indexOf(boolInteraction) === -1 || 
        STATUSES.indexOf(status) === -1) {
        resp.status(400).json({ message: "bad url params" })
        return
    }
    let checkQueryText, insertQueryText, deleteQueryText, updateQueryText
    let params = [commentId, userId]
    if (boolInteraction === "like") {
        checkQueryText = `SELECT comment_like_id FROM comment_like 
            WHERE comment = $1 AND liker = $2;`
        insertQueryText = `INSERT INTO comment_like (comment, liker) VALUES ($1, $2);`
        deleteQueryText = `DELETE FROM comment_like WHERE comment = $1 AND liker = $2;`
    }
    if (boolInteraction === "delete") {
        updateQueryText = `UPDATE comment SET deleted = TRUE where comment_id = $1;`
        params = [commentId]
    }


    let client, queryFailure
    try {
        client = await getClientFromPool()
        const needCheck = !!checkQueryText
        if (needCheck) { 
            // we are dealing w/ tables where row presence represent 
            // interaction on status (ie, a liked post has a row with
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



    resp.status(200).json({ boolInteraction, status, userId })

}, sessionOptions)