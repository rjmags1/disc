import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'


function EndorseButton({ endorsed }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [status, setStatus] = useState(endorsed)
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
        catch (error) { setStatus(!newStatus) }
        finally { setLoading(false) }
    }

    return (
        <div data-testid="endorse-button-container"
            className="h-[25px] text-sm">
            <button className="w-max px-1.5 h-full bg-blue-600 rounded border 
                border-white hover:bg-blue-700 hover:cursor-pointer"
                onClick={ handleClick }>
                <span>{ status ? "Unendorse" : "Endorse" }</span>
                { loading && <ButtonLoading /> }
            </button>
        </div>
    )
}

export default EndorseButton