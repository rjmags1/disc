import { useState, useContext, useRef, useEffect } from 'react'
import { 
    PostContext, PostListingsContext 
} from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'
import { syncListingWithBoolInteraction } from '../../../../lib/uiSync'
import { SMALL_MEDIA_BREAKPOINT } from '../../../../lib/layout'

function DeleteButton({ toggleMobilePostDisplay }) {
    const buttonRef = useRef(null)
    const { currentPost, setCurrentPost } = useContext(PostContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)
    const [loading, setLoading] = useState(false)

    useEffect(() => { 
        // effect for indicating button disabled with gray bg color while the 
        // application attempts to delete the post on the backend
        if (!buttonRef.current) return

        buttonRef.current.style.backgroundColor = loading ? 
            "#18181b" : ""

    }, [loading])
    
    const handleClick = async () => {
        // attempt to delete post on the backend before updating the ui.
        // disable the button while waiting on backend request outcome,
        // and render a spinner in the button/change its background color
        // by setLoading(true). if the backend delete was successful,
        // call syncListingWithBoolInteraction to remove it from the appropriate
        // listings list, set currentPost to null to remove the now deleted
        // post from the ui, and return the user to the post listings pane
        // if they are on mobile (on mobile, users see post listings pane OR 
        // the actual post, as opposed to seeing both at the same time on
        // larger viewports)
        if (loading) return

        setLoading(true)
        buttonRef.current.disabled = true
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/delete/${ true }`,
                { method: 'PUT' })
            if (resp.ok) {
                const specialPost = currentPost.pinned || currentPost.isAnnouncement
                const listings = specialPost ? specialListings : postListings
                const setListings = specialPost ? 
                    setSpecialListings : setPostListings
                syncListingWithBoolInteraction(
                    "delete", listings, setListings, currentPost, true)
                buttonRef.current.disabled = false
                setCurrentPost(null)
                if (window.innerWidth < SMALL_MEDIA_BREAKPOINT) {
                    toggleMobilePostDisplay()
                }
            }

        }
        catch (error) { 
            console.error(error)
            setLoading(false) 
        }
        finally { 
            if (buttonRef.current) buttonRef.current.disabled = false 
        }
    }
    
    return (
        <div data-testid="post-delete-button-container"
            className="h-[25px] text-sm ">
            <button className="h-full bg-red-600 rounded border px-1.5
                border-white hover:cursor-pointer hover:bg-red-700 w-max
                flex items-center justify-center py-0.5"
                onClick={ handleClick } ref={ buttonRef }>
                { loading ? <ButtonLoading /> : "Delete" }
            </button>
        </div>
    )
}

export default DeleteButton