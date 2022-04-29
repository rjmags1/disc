import { useState, useRef, useLayoutEffect } from 'react'
import PostsInfoList from './PostsInfoList'

function PostListingsPane({ catPaneRef }) {
    const MAX_LISTING_PANE_WIDTH = 450
    const MIN_LISTING_PANE_WIDTH = 250
    const INITIAL_LISTING_PANE_WIDTH = 400
    
    const [listingPaneWidth, setListingPaneWidth] = useState(
        INITIAL_LISTING_PANE_WIDTH
    )
    const listingsPane = useRef(null)

    useLayoutEffect(() => {
        if (!listingsPane.current) return

        listingsPane.current.style.width = `${ listingPaneWidth }px`
    }, [listingPaneWidth])

    const handleRightDividerMouseDown = () => {
        document.body.style.userSelect = "none"
        document.body.style.cursor = "ew-resize"
        document.addEventListener('mousemove', handleRightDividerDrag)
        document.addEventListener('mouseup', handleRightDividerMouseUp)
    }
    const handleRightDividerDrag = (event) => {
        const catPaneWidth = catPaneRef.current.clientWidth
        const newWidthInPixels = event.clientX - catPaneWidth
        setListingPaneWidth(Math.max(
            Math.min(newWidthInPixels, MAX_LISTING_PANE_WIDTH),
            MIN_LISTING_PANE_WIDTH
        ))
    }
    const handleRightDividerMouseUp = () => {
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        document.removeEventListener('mousemove', handleRightDividerDrag)
        document.removeEventListener('mouseup', handleRightDividerMouseUp)
    }

    return (
        <>
            <div data-testid="post-listings-pane-container" ref={ listingsPane }
                className={ `flex-none bg-zinc-600 flex justify-between 
                    w-[${ INITIAL_LISTING_PANE_WIDTH }px]` }>
                <PostsInfoList />
                <div data-testid="right-divider"
                    onMouseDown={ handleRightDividerMouseDown }
                    className="w-1 bg-zinc-500 hover:cursor-ew-resize" />
            </div>
        </>
    )
}

export default PostListingsPane