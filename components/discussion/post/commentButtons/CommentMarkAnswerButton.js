import React, { useContext } from "react"
import { PostContext, PostListingsContext } from "../../../../pages/[courseId]/discussion"
import { syncListingWithBoolInteraction } from "../../../../lib/uiSync"

const CommentMarkAnswerButton = React.memo(function(props) {
    const { commentInfo, postId, isAnswer, 
        setPostAnswered, setCommentIsAnswer } = props
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)
    const { currentPost } = useContext(PostContext)
    
    const handleClick = async () => {
        try {
            // tell backend about new post resolve status 
            // and new comment is resolving status
            const newStatus = !isAnswer
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/replies/info/${ commentInfo.commentId }/answer/${ newStatus }`,
                { method: "PUT" })
            if (!resp.ok) return // return if backend update failed

            // update ui to reflect new comment and post resolution status
            setPostAnswered(newStatus) 
            setCommentIsAnswer(newStatus)

            const specialListing = currentPost.pinned || currentPost.isAnnouncement
            const listings = specialListing ?  specialListings : postListings
            const setListings = specialListing ?  setSpecialListings : setPostListings
            // rerender associated listings based on resolution status 
            // (ie, remove checkmark or add one)
            syncListingWithBoolInteraction(
                "answer", listings, setListings, currentPost, newStatus)
        }
        catch (error) {
            console.error(error)
        }
    }

    return (
        <button className="px-1 hover:opacity-60" onClick={ handleClick }>
            { isAnswer ? "UNMARK AS ANSWER" : "MARK AS ANSWER" }
        </button>
    )
})

export default CommentMarkAnswerButton