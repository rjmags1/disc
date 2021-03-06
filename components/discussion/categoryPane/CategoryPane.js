import { useState, useLayoutEffect, useEffect } from 'react'
import { useCourse } from '../../../lib/hooks'
import { useRouter } from 'next/router'
import Loading from '../../lib/Loading'
import Category from './Category'
import { RAINBOW_HEX } from '../../../lib/colors'
import { LARGE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT } from '../../../lib/layout'

function CategoryPane({ catPaneRef, changeCategoryFilter, setNewPost, newPost }) {
    const MAX_CAT_PANE_WIDTH = 400
    const INITIAL_CAT_PANE_WIDTH = 250
    const router = useRouter()
    const { courseId } = router.query    
    const [catPaneWidth, setCatPaneWidth] = useState(INITIAL_CAT_PANE_WIDTH)
    const [resize, setResize] = useState(false)

    const { course, loading: loadingCourse } = useCourse(courseId)

    useEffect(() => {
        window.addEventListener('resize',
        () => {
            if (window.innerWidth < LARGE_MEDIA_BREAKPOINT) setResize(true)
            else setResize(false)
        })
    }, [])

    useLayoutEffect(() => {
        if (!catPaneRef.current) return
        if (window.innerWidth < LARGE_MEDIA_BREAKPOINT) {
            catPaneRef.current.style.width = `180px`
            return
        }

        catPaneRef.current.style.width = `${ catPaneWidth }px`
    }, [catPaneWidth, resize])

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

    const categories = !course?.categories ? [] : (
        course.categories.map((category, i) => (
            <Category bulletColor={ RAINBOW_HEX[i % RAINBOW_HEX.length] }
                changeFilter={ changeCategoryFilter } name={ category } 
                key={ i } />))
    )

    return newPost && window.innerWidth < SMALL_MEDIA_BREAKPOINT ? null : (
        <section data-testid="category-pane-container" ref={ catPaneRef }
            className={ `hidden md:flex bg-zinc-800 text-white justify-between
               w-[180px] flex-none lg:w-[${ INITIAL_CAT_PANE_WIDTH }px]` } >
            <div data-testid="category-headers-container"
                className="w-full flex flex-col items-center justify-start 
                    overflow-hidden my-2">
                { !newPost && 
                <button className='w-[90%] bg-purple border border-white
                    rounded py-1 mb-3 mt-1 hover:bg-violet-800 font-mono
                    whitespace-nowrap truncate' 
                    onClick={ () => setNewPost(true) } data-testid="new-post-btn">
                    + New Post
                </button> }
                <header className="w-full">
                    <h3 className="text-sm font-mono text-gray-400 w-full
                        text-left px-4 truncate">
                        CATEGORIES
                    </h3>
                </header>
                <ul className="w-full">
                { loadingCourse ? <Loading /> : categories }
                </ul>
            </div>
            <div className="w-1 bg-zinc-500 hover:cursor-ew-resize 
                hidden lg:block" onMouseDown={ handleLeftDividerMouseDown }
                data-testid="left-divider" />
        </section>
    )
}

export default CategoryPane