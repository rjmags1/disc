import { useState, useContext, useRef } from 'react'
import { 
    PostContext, PostListingsContext 
} from '../../../../pages/discussion/[courseId]'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'


function EndorseButton({ endorsed }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(endorsed)

    const handleClick = async () => {
        // update backend when user endorses or unendorses the post, and disable
        // the button while waiting on the request outcome. if the backend
        // update was successful, update the ui via syncListingWithBoolInteraction
        // call to reflect the new post endorse/unendorse
        const newStatus = !status
        setStatus(newStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/endorse/${ newStatus }`,
                { method: 'PUT' })
            if (!resp.ok) setStatus(!newStatus)
            else {
                const specialPost = currentPost.pinned || currentPost.isAnnouncement
                const listings = specialPost ? specialListings : postListings
                const setListings = specialPost ? setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "endorse", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { 
            console.error(error)
            setStatus(!newStatus) 
        }
        finally { buttonRef.current.disabled = false }
    }

    return (
        <div data-testid="post-endorse-button-container"
            className="h-[25px] text-sm">
            <button className="w-max px-1.5 h-full bg-blue-600 rounded border 
                border-white hover:bg-blue-700 hover:cursor-pointer"
                onClick={ handleClick } ref={ buttonRef }>
                <span>{ status ? "Unendorse" : "Endorse" }</span>
            </button>
        </div>
    )
}

export default EndorseButton