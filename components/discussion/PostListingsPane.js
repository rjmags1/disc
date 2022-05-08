import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import PostsInfoList from './PostsInfoList'
import PostInfoTextSearchFilter from './PostInfoTextSearchFilter'
import PostAttributesDropdownButton from './PostAttributesDropdownButton'
import PostAttributesDropdown from './PostAttributesDropdown'
import CategoryHamburger from './CategoryHamburger'
import { LARGE_MEDIA_BREAKPOINT } from '../../lib/layout'

const MAX_LISTING_PANE_WIDTH = 450
const MIN_LISTING_PANE_WIDTH = 250
const INITIAL_LISTING_PANE_WIDTH = 400


const PostListingsPane = React.memo(function(props) {
    const { catPaneRef, categoryFilter, toggleCatPane } = props
    const [filterText, setFilterText] = useState("")
    const [attributeFilter, setAttributeFilter] = useState("All")
    const [showDropdown, setShowDropdown] = useState(false)
    const [resized, setResized] = useState(false)
    const [listingPaneWidth, setListingPaneWidth] = useState(
        INITIAL_LISTING_PANE_WIDTH)

    const listingsPane = useRef(null)
    const filter = useRef(null)

    useEffect(() => {
        window.addEventListener('resize', 
        () => {
            if ((!listingsPane.current.style.width && 
                window.innerWidth >= LARGE_MEDIA_BREAKPOINT)  ||
                (listingsPane.current.style.width && 
                    window.innerWidth < LARGE_MEDIA_BREAKPOINT)) {
                
                setResized(true)
            }
        })
    }, [])

    useLayoutEffect(() => {
        if (!listingsPane.current || !filter.current) return

        const largeWindowWidth = window.innerWidth >= LARGE_MEDIA_BREAKPOINT
        listingsPane.current.style.width = largeWindowWidth ?
            `${ listingPaneWidth }px` : ""
        filter.current.style.width = largeWindowWidth ? 
            `${ listingPaneWidth }px` : ""

        setResized(false)

    }, [listingPaneWidth, resized])


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
    const handleOutsideClick = (e) => {
        if (e.target.getAttribute("data-testid") === "toggler") return
        setShowDropdown(false)
    }

    return (
        <>
            <section data-testid="filter-container" ref={ filter } 
                className={ `fixed w-full md:w-[calc(100%-180px)] 
                lg:w-[${ INITIAL_LISTING_PANE_WIDTH }px] z-10
                flex items-center justify-start bg-zinc-900` }>
                <CategoryHamburger toggleCatPane={ toggleCatPane } />
                <PostInfoTextSearchFilter setFilterText={ setFilterText }/>
                <PostAttributesDropdownButton show={ showDropdown } 
                    handleClick={ () => setShowDropdown(!showDropdown) } />
                {showDropdown &&
                <PostAttributesDropdown handleOutsideClick={ handleOutsideClick }
                    attributeFilter={ attributeFilter } 
                    hideDropdown={ () => setShowDropdown(false) } 
                    changeAttribute={ (attr) => setAttributeFilter(attr) } />
                }
                <div data-testid="top-right-divider" className="flex-none w-1 
                    bg-zinc-500 hover:cursor-ew-resize h-[48px] opacity-0 lg:opacity-100"
                    onMouseDown={ handleRightDividerMouseDown } />
            </section>
            <section data-testid="post-listings-pane-container" ref={ listingsPane }
                className={ `flex-none bg-zinc-700 flex justify-between 
                    h-[calc(100%-3rem)] w-full lg:w-[${ INITIAL_LISTING_PANE_WIDTH }px] 
                    relative top-12` }>
                <PostsInfoList attributeFilter={ attributeFilter }
                    categoryFilter={ categoryFilter } filterText={ filterText } />
                <div data-testid="lower-right-divider"
                    onMouseDown={ handleRightDividerMouseDown }
                    className="w-0.5 lg:w-1 bg-zinc-500 hover:cursor-ew-resize" />
            </section>
        </>
    )
})

export default PostListingsPane