import Layout from '../../components/layout/Layout'
import Loading from '../../components/lib/Loading'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useState, useRef, useEffect } from 'react'
import { useUser, useCourse } from '../../lib/hooks'

function Discussion() {
    const MAX_CAT_PANE_WIDTH = 400
    const MAX_LISTING_PANE_WIDTH = 450
    const MIN_LISTING_PANE_WIDTH = 250
    const router = useRouter()

    const [catPaneWidth, setCatPaneWidth] = useState(null)
    const catPane = useRef(null)
    const [listingPaneWidth, setListingPaneWidth] = useState(null)
    const listingsPane = useRef(null)

    useEffect(() => {
        if (!listingsPane.current) return
        if (listingPaneWidth === null) setListingPaneWidth(400)

        listingsPane.current.style.width = `${listingPaneWidth}px`
    }, [listingPaneWidth, listingsPane])

    useEffect(() => {
        if (!catPane.current) return
        if (catPaneWidth === null) setCatPaneWidth(250)

        catPane.current.style.width = `${catPaneWidth}px`
    }, [catPaneWidth, catPane])


    const {
        user,
        loading: loadingUser
    } = useUser({ redirectTo: '/login' })

    const {
        course,
        loading: loadingCourse
    } = useCourse(router.query.courseId)


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
    
    if (loadingUser || !user.authenticated || loadingCourse) return <Loading />

    const { termName, code, section } = course
    const title = `${ termName } ${ code }-${ section } - Discussion`
    return (
        <>
            <Head><title>{ title }</title></Head>
            <div data-testid="discussion-container" className="flex h-full">
                <div data-testid="category-pane-container" ref={ catPane }
                    className="hidden lg:flex bg-zinc-700 text-white
                        justify-between overflow-hidden w-[250px]">
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
                        className="flex-none bg-zinc-600 flex justify-between w-[400px]">
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
        </>
    )
}

Discussion.getLayout = function getLayout(page) {
    const router = useRouter()
    const {
        course,
        loading: loadingCourse,
        error
    } = useCourse(router.query.courseId)

    const pageName = loadingCourse || error ? 
                        "" : 
                        `${ course.termName } ${ course.courseName }`

    return (
        <Layout pageName={ pageName }>{ page }</Layout>
    )
}

export default Discussion