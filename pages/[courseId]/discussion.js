import Layout from '../../components/layout/Layout'
import { useState, useRef, useEffect } from 'react'

function Discussion() {
    const [catPaneWidth, setCatPaneWidth] = useState(null)
    const catPane = useRef(null)

    const pixelsToPercentStr = (pixels) => {
            const inPercent = (pixels / document.body.clientWidth) * 100
            return `${inPercent}%`
    }

    useEffect(() => {
        if (!catPane.current || catPaneWidth === null) return

        const maxWidthInPixels = Math.floor(document.body.clientWidth / 6)
        if (maxWidthInPixels < catPaneWidth) return

        const newActualCatPaneWidth = pixelsToPercentStr(catPaneWidth)
        catPane.current.style.width = newActualCatPaneWidth
    }, [catPaneWidth])

    const handleMouseDown = () => {
        document.addEventListener('mousemove', handleDrag)
        document.addEventListener('mouseup', handleMouseUp)
    }

    const handleDrag =  (event) => {
        const newWidthInPixels = event.clientX
        setCatPaneWidth(newWidthInPixels)
    }

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    return (
        <div data-testid="discussion-container" className="flex h-full">
            <div data-testid="category-pane-container" ref={ catPane }
                className="hidden lg:flex bg-zinc-700 max-w-[1/6] 
                            text-white w-[12%] justify-between overflow-hidden">
                <div>
                    <h3>category1</h3>
                    <h3>category2</h3>
                    <h3>category3</h3>
                </div>
                <div className="w-1 bg-zinc-500 hover:cursor-ew-resize" 
                    onMouseDown={ handleMouseDown } />
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