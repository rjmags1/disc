import React, { useState, useRef, useLayoutEffect } from 'react'
import PostsInfoList from './PostsInfoList'
import PostInfoTextSearchFilter from './PostInfoTextSearchFilter'

const PostListingsPane = React.memo(function({ catPaneRef, categoryFilter }) {
    const MAX_LISTING_PANE_WIDTH = 450
    const MIN_LISTING_PANE_WIDTH = 250
    const INITIAL_LISTING_PANE_WIDTH = 400

    const [filterText, setFilterText] = useState("")
    
    const [listingPaneWidth, setListingPaneWidth] = useState(
        INITIAL_LISTING_PANE_WIDTH
    )
    const listingsPane = useRef(null)
    const filter = useRef(null)

    useLayoutEffect(() => {
        if (!listingsPane.current) return

        listingsPane.current.style.width = `${ listingPaneWidth }px`
        filter.current.style.width = `${ listingPaneWidth }px`
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
            <div data-testid="filter-container" ref={ filter } 
                className={ `fixed w-[${ INITIAL_LISTING_PANE_WIDTH }px]  
                border-0 border-r-4 h-12 flex p-1 border-zinc-500 items-center
                justify-center` }>
                <PostInfoTextSearchFilter setFilterText={ setFilterText }/>
                dr
            </div>
            <div data-testid="post-listings-pane-container" ref={ listingsPane }
                className={ `flex-none bg-zinc-700 flex justify-between 
                    w-[${ INITIAL_LISTING_PANE_WIDTH }px] relative top-12` }>
                <PostsInfoList categoryFilter={ categoryFilter } 
                    filterText={ filterText }/>
                <div data-testid="right-divider"
                    onMouseDown={ handleRightDividerMouseDown }
                    className="w-1 bg-zinc-500 hover:cursor-ew-resize" />
            </div>
        </>
    )
})

export default PostListingsPane