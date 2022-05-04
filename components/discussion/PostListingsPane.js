import React, { useState, useRef, useLayoutEffect } from 'react'
import PostsInfoList from './PostsInfoList'
import PostInfoTextSearchFilter from './PostInfoTextSearchFilter'
import PostAttribute from './PostAttribute'
import Image from 'next/image'
import OutsideClickHandler from 'react-outside-click-handler'

const ATTRIBUTES = [
    "All", "Unread", "Unanswered", "Unresolved", "Endorsed", "Watching",
    "Starred", "Private", "Public", "Staff", "Mine"
]

const PostListingsPane = React.memo(function({ catPaneRef, categoryFilter }) {
    const MAX_LISTING_PANE_WIDTH = 450
    const MIN_LISTING_PANE_WIDTH = 250
    const INITIAL_LISTING_PANE_WIDTH = 400

    const [filterText, setFilterText] = useState("")
    const [attributeFilter, setAttributeFilter] = useState("All")
    const [showDropdown, setShowDropdown] = useState(false)
    
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

    const buttonStyles = `${ showDropdown ? "rotate-180" : "" } 
        mr-2 opacity-40 hover:cursor-pointer`

    const handleOutsideClick = (e) => {
        if (e.target.getAttribute("data-testid") === "toggler") return
        setShowDropdown(false)
    }

    return (
        <>
            <div data-testid="filter-container" ref={ filter } 
                className={ `fixed w-[${ INITIAL_LISTING_PANE_WIDTH }px] z-10
                flex items-center justify-center` }>
                <PostInfoTextSearchFilter setFilterText={ setFilterText }/>
                <div className={ buttonStyles } onClick={ 
                    () => setShowDropdown(!showDropdown) }>
                    <Image src="/sort-down.png" width="15" height="15" data-testid="toggler"/>
                </div>
                {showDropdown && 
                <OutsideClickHandler onOutsideClick={ handleOutsideClick } >
                    <div className="absolute w-[160px] text-right pb-1 
                        bg-zinc-900 right-0 top-12 rounded-b-lg shadow-2xl">
                        { ATTRIBUTES.map(attr => <PostAttribute attribute={ attr } 
                            selected={ attributeFilter === attr } key={ attr }
                            hideDropdown={ () => setShowDropdown(false) }
                            changeAttribute={ (newFilter) => {
                                setAttributeFilter(newFilter)
                                setShowDropdown(false) }} />) }
                    </div>
                </OutsideClickHandler>
                }
                <div data-testid="right-divider" onMouseDown={ handleRightDividerMouseDown }
                    className="flex-none w-1 bg-zinc-500 hover:cursor-ew-resize h-[48px]" />
            </div>
            <div data-testid="post-listings-pane-container" ref={ listingsPane }
                className={ `flex-none bg-zinc-700 flex justify-between h-[calc(100%-3rem)] 
                    w-[${ INITIAL_LISTING_PANE_WIDTH }px] relative top-12` }>
                <PostsInfoList categoryFilter={ categoryFilter } 
                    filterText={ filterText } attributeFilter={ attributeFilter } />
                <div data-testid="right-divider"
                    onMouseDown={ handleRightDividerMouseDown }
                    className="w-1 bg-zinc-500 hover:cursor-ew-resize" />
            </div>
        </>
    )
})

export default PostListingsPane