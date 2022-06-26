import {
    getClientFromPool, clientQuery, releaseClient
} from '../../../../../../../../db/index'
import { sessionOptions } from '../../../../../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

const BOOLEAN_COMMENT_INTERACTIONS = [
    "like", "delete", "endorse", "answer", "resolve"]
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
    const commentId = parseInt(req.query.commentId, 10)
    const postId = parseInt(req.query.postId)
    const slug = req.query.boolInteractionStatusSlug
    if (!postId || postId < 0 || !commentId || 
        commentId < 1 || !slug || slug.length !== 2) {
        resp.status(400).json({ message: "bad url params" })
        return
    }
    const [boolInteraction, status] = slug
    if (BOOLEAN_COMMENT_INTERACTIONS.indexOf(boolInteraction) === -1 || 
        STATUSES.indexOf(status) === -1) {
        resp.status(400).json({ message: "bad url params" })
        return
    }



    // determine which queries to user based on interaction type
    let checkQueryText, insertQueryText, deleteQueryText
    let updateQueryText, postUpdateQueryText 
    let checkUnresolvePostQueryText, checkUnanswerPostQueryText
    let params = [commentId, userId]
    if (boolInteraction === "like") {
        checkQueryText = `SELECT comment_like_id FROM comment_like 
            WHERE comment = $1 AND liker = $2;`
        insertQueryText = `INSERT INTO comment_like (comment, liker) VALUES ($1, $2);`
        deleteQueryText = `DELETE FROM comment_like WHERE comment = $1 AND liker = $2;`
    }
    else if (boolInteraction === "delete") {
        updateQueryText = `UPDATE comment SET deleted = TRUE where comment_id = $1;`
        params = [commentId]
    }
    else if (boolInteraction === "endorse") {
        updateQueryText = `UPDATE comment SET endorsed = $2 WHERE comment_id = $1;`
        params = [commentId, status]
    }
    else if (boolInteraction === "resolve") {
        updateQueryText = `UPDATE comment SET is_resolving = $2 WHERE comment_id = $1;`
        postUpdateQueryText = `UPDATE post SET resolved = $2 WHERE post_id = $1;`
        checkUnresolvePostQueryText = `
            SELECT COUNT(comment_id) AS resolving_comments FROM (
                SELECT comment_id FROM comment 
                WHERE post = $1 AND is_resolving) AS resolving_comments;`
        params = [commentId, status]
    }
    else if (boolInteraction === "answer") {
        updateQueryText = `UPDATE comment SET is_answer = $2 WHERE comment_id = $1;`
        postUpdateQueryText = `UPDATE post SET answered = $2 WHERE post_id = $1;`
        checkUnanswerPostQueryText = `
            SELECT COUNT(comment_id) AS answering_comments FROM (
                SELECT comment_id FROM comment 
                WHERE post = $1 AND is_answer) AS answering_comments;`
        params = [commentId, status]
    }


    let client, queryFailure, shouldUpdatePost
    try {
        // checkout a client because we may need to perform multiple queries
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

            // always update the relevant comment table
            await clientQuery(client, updateQueryText, params) 

            const mayAffectPostInfo = ( // may need to mark post as resolved
                // or answered if this is the first comment on the post
                // which the author has marked as resolving or answered, 
                // or if this was the only comment that was resolving/an answer
                // and the user unmarked it as such
                boolInteraction === "resolve" || boolInteraction === "answer")
            if (mayAffectPostInfo) {
                shouldUpdatePost = true
                const shouldUpdatePostQuery = (boolInteraction === "resolve" ?
                    (await clientQuery(
                        client, checkUnresolvePostQueryText, [postId]))
                    : (await clientQuery(
                        client, checkUnanswerPostQueryText, [postId])))
                if (status === "false") {
                    shouldUpdatePost = boolInteraction === "resolve" ? 
                        parseInt(shouldUpdatePostQuery.rows[0].resolving_comments) === 0 :
                        parseInt(shouldUpdatePostQuery.rows[0].answering_comments) === 0
                }
                else shouldUpdatePost = boolInteraction === "resolve" ? 
                    parseInt(shouldUpdatePostQuery.rows[0].resolving_comments) === 1 :
                    parseInt(shouldUpdatePostQuery.rows[0].answering_comments) === 1

                if (shouldUpdatePost) {
                    await clientQuery(client, postUpdateQueryText, [postId, status])
                }
            }
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



    resp.status(200).json({ 
        boolInteraction, status, userId, 
        postAnsResAltered: !!shouldUpdatePost 
    })

}, sessionOptions)