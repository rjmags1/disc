import React, { useContext } from "react"
import { PostListingsContext, PostContext } from '../../../../pages/[courseId]/discussion'
import { syncListingWithBoolInteraction } from "../../../../lib/uiSync"

const CommentMarkResolvingButton = React.memo(function(props) {
    const { commentInfo, postId, isResolving, 
        setPostResolved, setCommentResolving } = props
    const { 
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)
    const { currentPost } = useContext(PostContext)

    const handleClick = async () => {
        try {
            // tell backend about new post resolve status 
            // and new comment is resolving status
            const newStatus = !isResolving
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentInfo.commentId }/resolve/${ newStatus }`,
                { method: "PUT" })
            if (!resp.ok) return // return if backend update failed

            // update ui to reflect new comment and post resolution status
            setPostResolved(newStatus) 
            setCommentResolving(newStatus)

            const listings = currentPost.pinned || currentPost.isAnnouncement ? 
                    specialListings : postListings
            const setListings = currentPost.pinned || currentPost.isAnnouncement ?
                setSpecialListings : setPostListings
            // rerender associated listings based on resolution status 
            // (ie, remove checkmark or add one)
            syncListingWithBoolInteraction(
                "resolve", listings, setListings, currentPost, newStatus)
        }
        catch (error) {
            console.error(error)
        }
    }

    return (
        <button className="px-1 hover:opacity-60 whitespace-nowrap" onClick={ handleClick }
            data-testid="comment-mark-resolving-btn">
            { isResolving ? "UNMARK AS RESOLVING" : "MARK AS RESOLVING" }
        </button>
    )
})

export default CommentMarkResolvingButton