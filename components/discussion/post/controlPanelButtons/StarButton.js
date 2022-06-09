import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function StarButton({ starred }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(starred)

    const handleClick = async () => {
        const newStatus = !status
        setStatus(prevStatus => !prevStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/star/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setStatus(!newStatus)
            else {
                const listings = currentPost.pinned || currentPost.isAnnouncement ? 
                    specialListings : postListings
                const setListings = currentPost.pinned || currentPost.isAnnouncement ?
                    setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "star", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { setStatus(!newStatus) }
        finally { buttonRef.current.disabled = false }
    }

    return (
        <div data-testid="post-star-button-container" className="h-[25px] text-sm">
            <button className="flex items-center justify-center w-max px-1.5 rounded
                h-full bg-yellow-500 hover:bg-yellow-800 border border-white 
                hover:cursor-pointer" ref={ buttonRef } onClick={ handleClick }>
                <span>{ status ? "Unstar" : "Star" }</span>
            </button>
        </div>
    )
}

export default StarButton