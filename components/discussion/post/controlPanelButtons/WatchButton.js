import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function WatchButton({ watched }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(watched)

    const handleClick = async () => {
        const newStatus = !status
        setStatus(prevStatus => !prevStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/watch/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setStatus(!newStatus)
            else {
                const listings = currentPost.pinned || currentPost.isAnnouncement ? 
                    specialListings : postListings
                const setListings = currentPost.pinned || currentPost.isAnnouncement ?
                    setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "watch", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { setStatus(!newStatus) }
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