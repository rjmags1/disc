import React, { useState } from "react"


const CommentLikeButton = React.memo(function(props) {
    const { initialLiked, setDisplayedLikes, postId, commentId } = props
    const [liked, setLiked] = useState(initialLiked)

    const handleClick = async () => {
        const newStatus = !liked
        setLiked(newStatus)
        try {
            // hit reply bool interaction endpoint with param like
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentId }/like/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setLiked(!newStatus)
            else setDisplayedLikes(prev => prev + (newStatus ? 1 : -1))
        }
        catch (error) { setLiked(!newStatus) }

    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick }>
            { liked ? "UNLIKE" : "LIKE" }
        </button>
    )
})

export default CommentLikeButton