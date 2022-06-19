import { useRef } from 'react'

function CommentEndorseButton({ postId, commentId, setEndorsed, endorsed }) {
    const buttonRef = useRef(null)

    const handleClick = async () => {
        // optimistically update the ui to the new endorsed status before
        // attempting to talk to the backend. disable the button while
        // waiting for the backend request to finish, and if it failed
        // reset the ui to its original endorsed status

        const newStatus = !endorsed
        setEndorsed(newStatus)
        buttonRef.current.disabled = true
        let backendUpdateSuccessful
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentId }/endorse/${ !endorsed }`,
                { method: 'PUT' }
            )
            backendUpdateSuccessful = resp.ok
        }
        catch (error) {
            backendUpdateSuccessful = false
            console.error(error) 
        }
        finally { 
            if (!backendUpdateSuccessful) setEndorsed(!newStatus)
            buttonRef.current.disabled = false 
        }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick }
            data-testid="comment-endorse-btn" ref={ buttonRef }>
            { endorsed ? "UNENDORSE" : "ENDORSE" }
        </button>
    )
}

export default CommentEndorseButton