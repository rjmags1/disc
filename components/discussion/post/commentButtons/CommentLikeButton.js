import { useState, useRef } from "react"


function CommentLikeButton(props) {
    const { initialLiked, setDisplayedLikes, postId, commentId } = props
    const [liked, setLiked] = useState(initialLiked)

    const buttonRef = useRef(null)

    const handleClick = async () => {
        // optimistically reflect like/unlike action in the ui before attempting
        // to update the backend; disable the like button while waiting on
        // the outcome of the backend request

        const newStatus = !liked
        setLiked(newStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/booleanCommentInteraction/${ commentId }/like/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setLiked(!newStatus)
            else setDisplayedLikes(prev => prev + (newStatus ? 1 : -1))
        }
        catch (error) { setLiked(!newStatus) }
        finally { buttonRef.current.disabled = false }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick }
            data-testid="comment-like-button" ref={ buttonRef }>
            { liked ? "UNLIKE" : "LIKE" }
        </button>
    )
}

export default CommentLikeButton