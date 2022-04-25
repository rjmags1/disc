import { useState, useEffect } from 'react'

function CategoryPane({ catPaneRef }) {
    const MAX_CAT_PANE_WIDTH = 400
    const INITIAL_CAT_PANE_WIDTH = 250

    const [catPaneWidth, setCatPaneWidth] = useState(null)

    useEffect(() => {
        if (!catPaneRef.current) return

        catPaneRef.current.style.width = `${ catPaneWidth }px`
    }, [catPaneWidth, catPaneRef])

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

    return (
        <div data-testid="category-pane-container" ref={ catPaneRef }
            className={ `hidden lg:flex bg-zinc-700 text-white justify-between
                overflow-hidden w-[${ INITIAL_CAT_PANE_WIDTH }px]` } >
            <div data-testid="category-headers-container">
                <h3>category1</h3>
                <h3>category2</h3>
                <h3>category3</h3>
            </div>
            <div className="w-1 bg-zinc-500 hover:cursor-ew-resize"
                onMouseDown={ handleLeftDividerMouseDown }
                data-testid="left-divider" />
        </div>
    )
}

export default CategoryPane