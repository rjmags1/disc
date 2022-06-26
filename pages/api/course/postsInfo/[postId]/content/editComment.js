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
    const { commentId, editContent, displayContent } = req.body
    if (invalidParams(commentId, editContent, displayContent)) {
        resp.status(400).json({ message: "suppled params invalid" })
        return
    }

    
    // update the relevant comment record in the db and search
    // for any mentions, generating mention notifs if any mentions found
    let editCommentQuery, editFailure, client
    try {
        // checkout a client, may need to perform multiple queries
        client = await getClientFromPool()

        const editCommentQueryText = `
            UPDATE comment 
            SET edit_content = $1, display_content = $2
            WHERE comment_id = $3
            RETURNING comment_id, edit_content, display_content;`
        editCommentQuery = await clientQuery(client, editCommentQueryText, [
            editContent, displayContent, commentId])
        editFailure = editCommentQuery.rows.length === 0

        if (!editFailure) {
            const mentions = parseForMentionTokens(displayContent)
            if (mentions.length > 0) await genMentionNotifsInDb(
                client, mentions, commentId, false, new Date(Date.now()))
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

    
    const editedRow = editCommentQuery.rows[0]
    const editedCommentInfo = { 
        commentId: editedRow.comment_id, 
        editContent: editedRow.edit_content, 
        displayContent: editedRow.display_content
    }
    resp.status(200).json({ editedCommentInfo })

}, sessionOptions)

const invalidParams = (commentId, editContent, displayContent) => {
    if (typeof(commentId) !== 'number' || commentId < 1) return true
    if (typeof(editContent) !== 'object') return true
    if (typeof(displayContent) !== 'string') return true
}