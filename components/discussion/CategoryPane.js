import { useState, useLayoutEffect } from 'react'
import { useCourse } from '../../lib/hooks'
import { useRouter } from 'next/router'
import Loading from '../lib/Loading'
import Category from './Category'
import { RAINBOW_HEX } from '../../lib/colors'

function CategoryPane({ catPaneRef, changeCategoryFilter }) {
    const MAX_CAT_PANE_WIDTH = 400
    const INITIAL_CAT_PANE_WIDTH = 250
    const router = useRouter()
    const { courseId } = router.query

    const [catPaneWidth, setCatPaneWidth] = useState(INITIAL_CAT_PANE_WIDTH)

    useLayoutEffect(() => {
        if (!catPaneRef.current) return

        catPaneRef.current.style.width = `${ catPaneWidth }px`
    })

    const { course, loading: loadingCourse } = useCourse(courseId)

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

    const categories = !course?.categories ? [] : course.categories.map(
        (category, i) => {
            return <Category name={ category } key={ i } 
                        changeFilter={ changeCategoryFilter }
                        bulletColor={ RAINBOW_HEX[i % RAINBOW_HEX.length] }/>
        }
    )

    return (
        <div data-testid="category-pane-container" ref={ catPaneRef }
            className={ `hidden lg:flex bg-zinc-800 text-white justify-between
                w-[${ INITIAL_CAT_PANE_WIDTH }px]` } >
            <div data-testid="category-headers-container"
                className="w-full flex flex-col items-center justify-start 
                    overflow-hidden my-2">
                <h3 className="text-sm font-mono text-gray-400 w-full
                        text-left px-4">
                    CATEGORIES
                </h3>
                { loadingCourse ? <Loading /> : categories }
            </div>
            <div className="w-1 bg-zinc-500 hover:cursor-ew-resize hidden lg:block"
                onMouseDown={ handleLeftDividerMouseDown }
                data-testid="left-divider" />
        </div>
    )
}

export default CategoryPane