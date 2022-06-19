import { useContext, useRef } from "react"
import { PostListingsContext, PostContext } from '../../../../pages/discussion/[courseId]'
import { syncListingWithBoolInteraction } from "../../../../lib/uiSync"

function CommentMarkResolvingButton(props) {
    const { 
        commentInfo, postId, isResolving, setPostResolved, setCommentResolving 
    } = props
    const { 
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)
    const { currentPost } = useContext(PostContext)
    
    const buttonRef = useRef(null)

    const handleClick = async () => {
        // optimistically update the comment before communicating with the
        // backend and disable the button while waiting on the backend request. 
        // once the backend request resolves, use the response to determine whether
        // the mark resolving button interaction caused the post to change from an 
        // unresolved to resolved state or vice versa. if there was a post
        // resolved state change, update the relevant post ui (its listing and
        // actual content) to reflect the new resolved state (either add
        // or remove the green checkmark)

        const newStatus = !isResolving
        setCommentResolving(newStatus)
        buttonRef.current.disabled = true
        let backendUpdateSuccessful, postAnsResAltered
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentInfo.commentId }/resolve/${ newStatus }`,
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
            setCommentResolving(!newStatus)
            return
        }
        if (postAnsResAltered) {
            setPostResolved(newStatus) 
            const specialListing = currentPost.pinned || currentPost.isAnnouncement
            const listings = specialListing ? specialListings : postListings
            const setListings = specialListing ? setSpecialListings : setPostListings
            syncListingWithBoolInteraction(
                "resolve", listings, setListings, currentPost, newStatus)
        }
    }

    return (
        <button className="px-1 hover:opacity-60 whitespace-nowrap" 
            onClick={ handleClick } ref={ buttonRef }
            data-testid="comment-mark-resolving-btn">
            { isResolving ? "UNMARK AS RESOLVING" : "MARK AS RESOLVING" }
        </button>
    )
}

export default CommentMarkResolvingButton