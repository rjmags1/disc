import Layout from '../../components/layout/Layout'
import { useState, useRef, useEffect } from 'react'

function Discussion() {
    const MAX_CAT_PANE_WIDTH = 400
    const [catPaneWidth, setCatPaneWidth] = useState(null)
    const catPane = useRef(null)

    useEffect(() => {
        if (!catPane.current || catPaneWidth === null) return

        if (MAX_CAT_PANE_WIDTH < catPaneWidth) return

        catPane.current.style.width = `${catPaneWidth}px`
    }, [catPaneWidth])

    const handleLeftDividerMouseDown = () => {
        document.addEventListener('mousemove', handleLeftDividerDrag)
        document.addEventListener('mouseup', handleLeftDividerMouseUp)
    }

    const handleLeftDividerDrag = (event) => {
        const newWidthInPixels = event.clientX
        setCatPaneWidth(newWidthInPixels)
    }

    const handleLeftDividerMouseUp = () => {
        document.removeEventListener('mousemove', handleLeftDividerDrag)
        document.removeEventListener('mouseup', handleLeftDividerMouseUp)
    }

    return (
        <div data-testid="discussion-container" className="flex h-full">
            <div data-testid="category-pane-container" ref={ catPane }
                className="hidden lg:flex bg-zinc-700 text-white w-64
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
            <div className="flex-auto text-white flex" id="posts-section">
                Post listing and post display
                <div data-testid="post-listings-container">

                </div>
                <div data-testid="post-container" 
                    className="hidden md:flex">

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