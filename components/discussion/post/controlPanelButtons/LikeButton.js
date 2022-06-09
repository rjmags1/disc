import { useState, useContext, useRef } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function LikeButton({ liked }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(liked)
    
    const handleClick = async () => {
        const newStatus = !status
        setStatus(newStatus)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/like/${ newStatus }`,
                { method: 'PUT' })
            if (!resp.ok) setStatus(!newStatus)
            else {
                const listings = currentPost.pinned || currentPost.isAnnouncement ? 
                    specialListings : postListings
                const setListings = currentPost.pinned || currentPost.isAnnouncement ?
                    setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "like", listings, setListings, currentPost, newStatus)
            }
        }
        catch (error) { setStatus(!newStatus) }
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