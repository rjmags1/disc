import { sessionOptions } from "../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { query } from '../../../../../../db/index'

export default withIronSessionApiRoute(async function(req, resp) {
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

    let editCommentQuery, editFailure
    try {
        const editCommentQueryText = `
            UPDATE comment 
            SET edit_content = $1, display_content = $2
            WHERE comment_id = $3
            RETURNING comment_id, edit_content, display_content;`
        editCommentQuery = await query(editCommentQueryText, [
            editContent, displayContent, commentId])
        editFailure = editCommentQuery.rows.length === 0
    }
    catch (error) {
        editFailure = true
        console.error(error)
    }
    if (editFailure) {
        resp.status(500).json({ message: "internal server error" })
        return
    }

    console.log(editFailure)
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