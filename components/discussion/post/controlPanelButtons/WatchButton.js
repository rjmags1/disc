import { useState, useContext, useRef } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/discussion/[courseId]'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function WatchButton({ watched }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(watched)

    const handleClick = async () => {
        // update backend when user watches or unwatches the post, and disable
        // the button while waiting on the request outcome. if the backend
        // update was successful, update the ui via syncListingWithBoolInteraction
        // call to reflect the new post watch/unwatch
        const newStatus = !status
        setStatus(newStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/watch/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setStatus(!newStatus)
            else {
                const specialPost = currentPost.pinned || currentPost.isAnnouncement
                const listings = specialPost ? specialListings : postListings
                const setListings = specialPost ? setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "watch", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { 
            console.error(error)
            setStatus(!newStatus) 
        }
        finally { buttonRef.current.disabled = false }
    }
    
    return (
        <div data-testid="post-watch-button-container" className="h-[25px] text-sm" >
            <button className="flex items-center justify-center rounded
                h-full bg-rose-400 hover:bg-rose-500 border border-white
                hover:cursor-pointer px-1.5 w-max" ref={ buttonRef } onClick={ handleClick } >
                <span>{ status ? "Unwatch" : "Watch" }</span>
            </button>
        </div>
    ) 
}

export default WatchButton