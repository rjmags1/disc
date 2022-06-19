import { useState, useContext, useRef } from 'react'
import { 
    PostContext, PostListingsContext 
} from '../../../../pages/discussion/[courseId]'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function LikeButton({ liked }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(liked)
    
    const handleClick = async () => {
        // update backend when user likes or unlikes the post, and disable
        // the button while waiting on the request outcome. if the backend
        // update was successful, update the ui via syncListingWithBoolInteraction
        // call to reflect the new post like/unlike
        const newStatus = !status
        setStatus(newStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/like/${ newStatus }`,
                { method: 'PUT' })
            if (!resp.ok) setStatus(!newStatus)
            else {
                const specialPost = currentPost.pinned || currentPost.isAnnouncement
                const listings = specialPost ? specialListings : postListings
                const setListings = specialPost ? setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "like", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { 
            console.error(error)
            setStatus(!newStatus) 
        }
        finally { buttonRef.current.disabled = false }
    }


    return (
        <div data-testid="post-like-button-container" className="h-[25px] text-sm">
            <button className="flex items-center justify-center w-max px-1.5 
                h-full rounded bg-sky-500 hover:bg-sky-600 border border-white 
                hover:cursor-pointer" ref={ buttonRef } onClick={ handleClick }>
                <span>{ status ? "Unlike" : "Like" }</span>
            </button>
        </div>
    )
}

export default LikeButton