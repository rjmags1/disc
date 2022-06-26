import { sessionOptions } from "../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { 
    getClientFromPool, clientQuery, releaseClient
} from '../../../../../../db/index'
import {
    parseForMentionTokens, genMentionNotifsInDb 
} from "../../../../../../lib/mention"



export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'PUT') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not authenticated" })
        return
    }
    const { postId, editContent, displayContent } = req.body
    if (invalidParams(postId, editContent, displayContent)) {
        resp.status(400).json({ message: "suppled params invalid" })
        return
    }



    // update the relevant post record in the db and parse for any mentions,
    // generating mention notifs in the db if necessary
    let editPostQuery, editFailure, client
    try {
        client = await getClientFromPool()
        const editPostQueryText = `
            UPDATE post
            SET edit_content = $1, display_content = $2
            WHERE post_id = $3
            RETURNING post_id, edit_content, display_content;`
        editPostQuery = await clientQuery(client, editPostQueryText, [
            editContent, displayContent, postId])
        editFailure = editPostQuery.rows.length === 0

        if (!editFailure) {
            const mentions = parseForMentionTokens(displayContent)
            if (mentions.length > 0) await genMentionNotifsInDb(
                client, mentions, postId, false, new Date(Date.now()))
        }
    }
    catch (error) {
        editFailure = true
        resp.status(500).json({ message: "internal server error" })
    }
    finally {
        await releaseClient(client)
    }
    if (editFailure) return



    const editedRow = editPostQuery.rows[0]
    const editedPostInfo = {
        postId: editedRow.post_id,
        editContent: editedRow.edit_content,
        displayContent: editedRow.display_content
    }
    resp.status(200).json({ editedPostInfo })

}, sessionOptions)

const invalidParams = (postId, editContent, displayContent) => {
    if (typeof(postId) !== 'number' || postId < 1) return true
    if (typeof(editContent) !== 'object') return true
    if (typeof(displayContent) !== 'string') return true
}