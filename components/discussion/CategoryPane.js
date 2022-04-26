import { useState, useEffect } from 'react'
import { useCategories } from '../../lib/hooks'
import { useRouter } from 'next/router'
import Loading from '../lib/Loading'
import Category from './Category'
import { RAINBOW_HEX } from '../../lib/colors'

function CategoryPane({ catPaneRef }) {
    const MAX_CAT_PANE_WIDTH = 400
    const INITIAL_CAT_PANE_WIDTH = 250
    const router = useRouter()
    const { courseId } = router.query

    const [catPaneWidth, setCatPaneWidth] = useState(INITIAL_CAT_PANE_WIDTH)

    useEffect(() => {
        if (!catPaneRef.current) return

        catPaneRef.current.style.width = `${ catPaneWidth }px`
    }, [catPaneWidth, catPaneRef])

    const {
        categories: categoriesInfo,
        loading: loadingCategories
    } = useCategories(courseId)

    const handleLeftDividerMouseDown = () => {
        document.body.style.userSelect = "none"
        document.body.style.cursor = "ew-resize"
        document.addEventListener('mousemove', handleLeftDividerDrag)
        document.addEventListener('mouseup', handleLeftDividerMouseUp)
    }
    const handleLeftDividerDrag = (event) => {
        const newWidthInPixels = event.clientX
        setCatPaneWidth(Math.min(newWidthInPixels, MAX_CAT_PANE_WIDTH))
    }
    const handleLeftDividerMouseUp = () => {
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        document.removeEventListener('mousemove', handleLeftDividerDrag)
        document.removeEventListener('mouseup', handleLeftDividerMouseUp)
    }

    if (loadingCategories) return <Loading />

    const categories = categoriesInfo.map(
        (categoryInfo, i) => {
            const { categoryId } = categoryInfo
            return <Category info={ categoryInfo } key={ categoryId } 
                        bulletColor={ RAINBOW_HEX[i % RAINBOW_HEX.length] }/>
        }
    )

    return (
        <div data-testid="category-pane-container" ref={ catPaneRef }
            className={ `hidden lg:flex bg-zinc-700 text-white justify-between
                w-[${ INITIAL_CAT_PANE_WIDTH }px]` } >
            <div data-testid="category-headers-container"
                className="w-full flex flex-col items-center justify-start 
                    overflow-hidden my-2 px-4">
                <h3 className="text-sm font-mono text-gray-400 w-full text-left">
                    CATEGORIES
                </h3>
                { categories }
            </div>
            <div className="w-1 bg-zinc-500 hover:cursor-ew-resize"
                onMouseDown={ handleLeftDividerMouseDown }
                data-testid="left-divider" />
        </div>
    )
}

export default CategoryPane