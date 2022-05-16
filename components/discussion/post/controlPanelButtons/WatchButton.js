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
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!buttonRef.current) return

        buttonRef.current.style.backgroundColor = loading ? 
            "#18181b" : ""

    }, [loading])

    const handleClick = async () => {
        if (loading) return

        const newStatus = !status
        setStatus(prevStatus => !prevStatus)
        setLoading(true)
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
        finally { setLoading(false) }
    }
    

    return (
        <div data-testid="watched-button-container" className="h-[40px] w-[30%]">
            <button className="flex items-center justify-center w-full rounded
                h-full bg-rose-400 hover:bg-rose-500 border border-white
                hover:cursor-pointer" ref={ buttonRef } onClick={ handleClick } >
                <span>{ status ? "Unwatch" : "Watch" }</span>
                { loading && <ButtonLoading />}
            </button>
        </div>
    ) 
}

export default WatchButton