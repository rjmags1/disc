import Layout from '../../components/layout/Layout'
import CategoryPane from '../../components/discussion/categoryPane/CategoryPane'
import PostListingsPane from '../../components/discussion/postListingsPane/PostListingsPane'
import Post from '../../components/discussion/post/Post'
import Head from 'next/head'
import NewPost from '../../components/discussion/newPost/NewPost'
import dynamic from 'next/dynamic'
const Editor = dynamic( 
    // must be loaded dynamically client side due to quilljs dependency.
    // quilljs only works in the browser, requires window.document.
    // component loaded here and stored in context so it is only loaded over
    // network once and can be used as needed by discussion page children 
    () => import('../../components/discussion/post/Editor'), 
    { ssr: false })
import 'quill/dist/quill.snow.css'

import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { useUser, useCourse } from '../../lib/hooks'
import { LARGE_MEDIA_BREAKPOINT } from '../../lib/layout'

export const PostContext = React.createContext(null)
export const TimeContext = React.createContext(null)
export const PostListingsContext = React.createContext(null)
export const EditorContext = React.createContext(null)

function Discussion() {
    const router = useRouter()
    const { courseId } = router.query
    const catPaneRef = useRef(null)
    const listingsPaneRef = useRef(null)
    const filterRef = useRef(null)
    const postContainerRef = useRef(null)

    const [categoryFilter, setCategoryFilter] = useState(new Set())
    const [showHiddenPane, setShowHiddenPane] = (
        useState(false)
    ) // controls cat pane visibility via hamburger btn on smaller viewports
    const [currentPost, setCurrentPost] = (
        useState(null)
    ) // set on listing click, is dynamic context
    const [postListings, setPostListings] = (
        useState([])) // set on new post or edit post, is dynamic context 
    const [specialListings, setSpecialListings] = useState({ 
        pinned: [],
        announcements: [] 
    }) // set on new pinned or announced post, is dynamic context
    const [initialLoadTime] = useState(
        Date.now()) // syncs displayed data across all loads
    const [newPost, setNewPost] = (
        useState(false)
    ) // used to toggle post display or new post form in post content section
    const [mobileDisplayPost, setMobileDisplayPost] = useState(false)


    const postContext = { 
        currentPost, setCurrentPost 
    } // dynamic context holds info about post displayed in post content section
    const postListingsContext = {
        postListings, setPostListings, specialListings, setSpecialListings 
    } // dynamic context holding info about posts listed in post listings pane
        

    const {
        user, loading: loadingUser 
    } = useUser({ redirectTo: '/login' }) // auth guard
    const { 
        course, loading: loadingCourse 
    } = useCourse(courseId) // get course info for page header


    useEffect(() => {
        if (!filterRef.current || 
            !listingsPaneRef.current || 
            !postContainerRef.current) return
        if (window.innerWidth >= LARGE_MEDIA_BREAKPOINT) return

        filterRef.current.style.display = mobileDisplayPost ? "none" : ""
        listingsPaneRef.current.style.display = mobileDisplayPost ? "none" : ""
        postContainerRef.current.style.display = mobileDisplayPost ? "block" : "none"

    }, [mobileDisplayPost])

    useEffect(() => { 
        // effect for controlling visibility of category pane when 
        // viewport is small enough that category pane is hidden by default.
        // in such a viewport, post listings pane has hamburger btn for 
        // displaying category pane that when clicked sets showHiddenPane
        if (!catPaneRef.current) return

        catPaneRef.current.style.display = showHiddenPane ? "flex" : ""
        catPaneRef.current.style.position = showHiddenPane ? "fixed" : ""
        catPaneRef.current.style.zIndex = showHiddenPane ? "500" : ""
        catPaneRef.current.style.top = showHiddenPane ? "96px" : ""
        catPaneRef.current.style.height = showHiddenPane ? "100%" : ""

    }, [catPaneRef, showHiddenPane])
    
    useEffect(() => {
        // effect for unhighlighting the previous current post after user
        // setsCurrentPost by clicking another post listing

        if (currentPost === null) return // null when post is deleted

        const listingNodes = document.querySelectorAll(
            '[data-testid=post-info-container]')
        for (const listingNode of listingNodes) {
            const splitNodePostId = listingNode.id.split('-')
            const nodePostId = parseInt(
                splitNodePostId[splitNodePostId.length - 1])
            if (nodePostId !== currentPost.postId) {
                listingNode.style.backgroundColor = ""
            }
        }
    }, [currentPost])


    const changeCategoryFilter = (add, category) => {
        const newFilter = new Set(categoryFilter)
        if (add) newFilter.add(category)
        else newFilter.delete(category)
        setCategoryFilter(newFilter)
    }

    const toggleMobilePostDisplay = () => setMobileDisplayPost(prev => !prev)
    
    if (loadingUser || !user.authenticated || loadingCourse) return null

    const { termName, code, section } = course
    const title = (
        `${ termName } ${ code }-${ section } - Discussion`)
    return (
        <>
            <Head><title>{ title }</title></Head>
            <EditorContext.Provider value={ Editor } >
            <TimeContext.Provider value={ initialLoadTime } >
            <PostListingsContext.Provider value={ postListingsContext } >
            <PostContext.Provider value={ postContext }>

            <div data-testid="discussion-container" 
                className="flex h-[calc(100vh-48px)] w-full">
                <CategoryPane catPaneRef={ catPaneRef } newPost={ newPost }
                    changeCategoryFilter={ changeCategoryFilter }
                    setNewPost={ setNewPost } />
                <section className="flex-auto text-white flex w-full"
                    data-testid="posts-section">
                    <PostListingsPane catPaneRef={ catPaneRef }
                        filterRef={ filterRef } listingsPaneRef={ listingsPaneRef }
                        showHiddenPane={ showHiddenPane }
                        toggleCatPane={ 
                            () => setShowHiddenPane(!showHiddenPane) }
                        toggleMobilePostDisplay={ toggleMobilePostDisplay }
                        categoryFilter={ categoryFilter } 
                        setCurrentPost={ setCurrentPost } newPost={ newPost } />
                    { newPost ? 
                    <NewPost exitNewPost={ () => setNewPost(false) } /> 
                    : <Post postContainerRef={ postContainerRef } 
                        toggleMobilePostDisplay={ toggleMobilePostDisplay } /> }
                </section>
            </div>

            </PostContext.Provider>
            </PostListingsContext.Provider>
            </TimeContext.Provider>
            </EditorContext.Provider>
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

    const pageName = loadingCourse || error ?  "" 
        : `${ course.courseName } - ${ course.termName }`

    return (
        <Layout pageName={ pageName }>{ page }</Layout>
    )
}

export default Discussion