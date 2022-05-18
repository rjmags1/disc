import React from "react"

function CommentDeleteButton({ postId, commentId, markDeleted }) {

    const handleClick = async () => {
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentId }/delete/${ true }`,
                { method: 'PUT' }
            )
            if (resp.ok) markDeleted()
        }
        catch (error) { console.error(error) }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick } >
            DELETE
        </button>
    )
}

export default CommentDeleteButton