import { useContext, useRef } from "react"
import { PostContext, PostListingsContext } from "../../../../pages/discussion/[courseId]"
import { syncListingWithBoolInteraction } from "../../../../lib/uiSync"

function CommentMarkAnswerButton(props) {
    const { commentInfo, postId, isAnswer, 
        setPostAnswered, setCommentIsAnswer } = props
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)
    const { currentPost } = useContext(PostContext)

    const buttonRef = useRef(null)
    
    const handleClick = async () => {
        // optimistically update the comment before communicating with the
        // backend and disable the button while waiting on the backend request. 
        // once the backend request resolves, use the response to determine whether
        // the mark answer button interaction caused the post to change from an 
        // unanswered to an answered state or vice versa. if there was a post
        // answered state change, update the relevant post ui (its listing and
        // its actual content) to reflect the new answered state (either add
        // or remove the green checkmark)

        const newStatus = !isAnswer
        setCommentIsAnswer(newStatus)
        buttonRef.current.disabled = true
        let backendUpdateSuccessful, postAnsResAltered
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentInfo.commentId }/answer/${ newStatus }`,
                { method: "PUT" })
            backendUpdateSuccessful = resp.ok
            postAnsResAltered = backendUpdateSuccessful && (
                await resp.json()).postAnsResAltered
        }
        catch (error) {
            backendUpdateSuccessful = false
            console.error(error)
        }
        finally { buttonRef.current.disabled = false }

        if (!backendUpdateSuccessful) {
            setCommentIsAnswer(!newStatus)
            return
        }
        if (postAnsResAltered) {
            setPostAnswered(newStatus)
            const specialListing = currentPost.pinned || currentPost.isAnnouncement
            const listings = specialListing ? specialListings : postListings
            const setListings = specialListing ? setSpecialListings : setPostListings
            syncListingWithBoolInteraction(
                "answer", listings, setListings, currentPost, newStatus)
        }
    }

    return (
        <button className="px-1 hover:opacity-60 whitespace-nowrap" 
            onClick={ handleClick } ref={ buttonRef }
            data-testid="comment-mark-answer-btn">
            { isAnswer ? "UNMARK AS ANSWER" : "MARK AS ANSWER" }
        </button>
    )
}

export default CommentMarkAnswerButton