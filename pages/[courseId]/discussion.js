import Layout from '../../components/layout/Layout'
import { useState, useRef, useEffect } from 'react'

function Discussion() {
    const MAX_CAT_PANE_WIDTH = 400
    const MAX_LISTING_PANE_WIDTH = 450
    const MIN_LISTING_PANE_WIDTH = 250

    const [catPaneWidth, setCatPaneWidth] = useState(250)
    const catPane = useRef(null)
    const [listingPaneWidth, setListingPaneWidth] = useState(400)
    const listingsPane = useRef(null)

    useEffect(() => {
        if (!listingsPane.current) return

        listingsPane.current.style.width = `${listingPaneWidth}px`
    }, [listingPaneWidth, listingsPane])

    useEffect(() => {
        if (!catPane.current) return

        catPane.current.style.width = `${catPaneWidth}px`
    }, [catPaneWidth, catPane])

    const handleLeftDividerMouseDown = () => {
        document.addEventListener('mousemove', handleLeftDividerDrag)
        document.addEventListener('mouseup', handleLeftDividerMouseUp)
    }
    const handleLeftDividerDrag = (event) => {
        const newWidthInPixels = event.clientX
        setCatPaneWidth(Math.min(newWidthInPixels, MAX_CAT_PANE_WIDTH))
    }
    const handleLeftDividerMouseUp = () => {
        document.removeEventListener('mousemove', handleLeftDividerDrag)
        document.removeEventListener('mouseup', handleLeftDividerMouseUp)
    }

    const handleRightDividerMouseDown = () => {
        document.addEventListener('mousemove', handleRightDividerDrag)
        document.addEventListener('mouseup', handleRightDividerMouseUp)
    }
    const handleRightDividerDrag = (event) => {
        const newWidthInPixels = event.clientX - catPaneWidth
        setListingPaneWidth(Math.max(
            Math.min(newWidthInPixels, MAX_LISTING_PANE_WIDTH),
            MIN_LISTING_PANE_WIDTH
        ))
    }
    const handleRightDividerMouseUp = () => {
        document.removeEventListener('mousemove', handleRightDividerDrag)
        document.removeEventListener('mouseup', handleRightDividerMouseUp)
    }

    return (
        <div data-testid="discussion-container" className="flex h-full">
            <div data-testid="category-pane-container" ref={ catPane }
                className="hidden lg:flex bg-zinc-700 text-white
                    justify-between overflow-hidden">
                <div data-testid="category-headers-container">
                    <h3>category1</h3>
                    <h3>category2</h3>
                    <h3>category3</h3>
                </div>
                <div className="w-1 bg-zinc-500 hover:cursor-ew-resize" 
                    onMouseDown={ handleLeftDividerMouseDown } 
                    data-testid="left-divider" />
            </div>
            <div className="flex-auto text-white flex" data-testid="posts-section">
                <div data-testid="post-listings-pane-container" ref={ listingsPane }
                    className="flex-none bg-zinc-600 flex justify-between">
                    <div data-testid="post-listings-container">PostListing</div>
                    <div data-testid="right-divider" 
                        onMouseDown={ handleRightDividerMouseDown }
                        className="w-1 bg-zinc-500 hover:cursor-ew-resize" />
                </div>
                <div data-testid="post-container" 
                    className="hidden md:flex w-full flex-auto">
                    Post display
                </div>
            </div>
        </div>
    )
}

Discussion.getLayout = function getLayout(page) {
    return (
        <Layout pageName="Discussion">{ page }</Layout>
    )
}

export default Discussion