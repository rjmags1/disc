import { sessionOptions } from "../../../../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"
import { query } from '../../../../../../db/index'
import { responseSymbol } from "next/dist/server/web/spec-compliant/fetch-event"

export default withIronSessionApiRoute(async function(req, resp) {
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

    let editPostQuery, editFailure
    try {
        const editPostQueryText = `
            UPDATE post
            SET edit_content = $1, display_content = $2
            WHERE post_id = $3
            RETURNING post_id, edit_content, display_content;`
        editPostQuery = await query(editPostQueryText, [
            editContent, displayContent, postId])
        editFailure = editPostQuery.rows.length === 0
    }
    catch (error) {
        editFailure = true
        console.error(error)
    }
    if (editFailure) {
        resp.status(500).json({ message: "internal server error" })
        return
    }

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