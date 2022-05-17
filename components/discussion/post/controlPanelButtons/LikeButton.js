import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function LikeButton({ liked }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(liked)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!buttonRef.current) return

        buttonRef.current.style.backgroundColor = loading ? 
            "#18181b" : ""

    }, [loading])
    
    const handleClick = async () => {
        if (loading) return

        const newStatus = !status
        setStatus(newStatus)
        setLoading(true)
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
        finally { setLoading(false) }
    }


    return (
        <div data-testid="like-button-container" className="h-[25px] text-sm">
            <button className="flex items-center justify-center w-max px-1.5 
                h-full rounded bg-sky-500 hover:bg-sky-600 border border-white 
                hover:cursor-pointer" ref={ buttonRef } onClick={ handleClick }>
                <span>{ status ? "Unlike" : "Like" }</span>
                { loading && <ButtonLoading /> }
            </button>
        </div>
    )
}

export default LikeButton