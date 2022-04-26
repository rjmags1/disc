import { useState, useEffect } from 'react'
import { useCategories } from '../../lib/hooks'
import { useRouter } from 'next/router'
import Loading from '../lib/Loading'
import Category from './Category'

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

    if (loadingCategories) return <Loading />

    const categories = categoriesInfo.map(
        categoryInfo => {
            const { categoryId } = categoryInfo
            return <Category info={ categoryInfo } key={ categoryId } />
        }
    )

    return (
        <div data-testid="category-pane-container" ref={ catPaneRef }
            className={ `hidden lg:flex bg-zinc-700 text-white justify-between
                overflow-hidden w-[${ INITIAL_CAT_PANE_WIDTH }px]` } >
            <div data-testid="category-headers-container" >
                { categories }
            </div>
            <div className="w-1 bg-zinc-500 hover:cursor-ew-resize"
                onMouseDown={ handleLeftDividerMouseDown }
                data-testid="left-divider" />
        </div>
    )
}

export default CategoryPane