import React, { useState } from "react"

const CommentEndorseButton = React.memo(function(props) {
    const { postId, commentId, setEndorsed, endorsed } = props
    
    const handleClick = async () => {
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentId }/endorse/${ !endorsed }`,
                { method: 'PUT' }
            )
            if (resp.ok) setEndorsed(!endorsed)
        }
        catch (error) { console.error(error) }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick }
            data-testid="comment-endorse-btn">
            { endorsed ? "UNENDORSE" : "ENDORSE" }
        </button>
    )
})

export default CommentEndorseButton