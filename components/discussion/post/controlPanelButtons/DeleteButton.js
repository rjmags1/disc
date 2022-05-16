import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext, PostListingsContext } from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'

function DeleteButton() {
    const buttonRef = useRef(null)
    const { currentPost, setCurrentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!buttonRef.current) return

        buttonRef.current.style.backgroundColor = loading ? 
            "#18181b" : ""

    }, [loading])
    
    const handleClick = async () => {
        if (loading) return

        setLoading(true)
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/delete/${ true }`,
                { method: 'PUT' })
            if (!resp.ok) return

            const listings = currentPost.pinned || currentPost.isAnnouncement ? 
                specialListings : postListings
            const setListings = currentPost.pinned || currentPost.isAnnouncement ?
                setSpecialListings : setPostListings
            syncListingWithBoolInteraction(
                "delete", listings, setListings, currentPost, true)
            setCurrentPost(null)
        }
        catch (error) { setLoading(false) }
    }
    
    return (
        <div data-testid="delete-button-container"
            className="w-full h-[40px]">
            <button className="w-full h-full bg-red-600 rounded border 
                border-white hover:cursor-pointer hover:bg-red-700"
                onClick={ handleClick }>
                Delete
                { loading && <ButtonLoading /> }
            </button>
        </div>
    )
}

export default DeleteButton