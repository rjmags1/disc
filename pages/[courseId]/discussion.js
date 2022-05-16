import Layout from '../../components/layout/Layout'
import CategoryPane from '../../components/discussion/categoryPane/CategoryPane'
import PostListingsPane from '../../components/discussion/postListingsPane/PostListingsPane'
import Post from '../../components/discussion/post/Post'
import { useRouter } from 'next/router'
import Head from 'next/head'
import React, { useEffect, useRef, useState } from 'react'
import { useUser, useCourse } from '../../lib/hooks'

export const PostContext = React.createContext(null)
export const TimeContext = React.createContext(null)
export const PostListingsContext = React.createContext(null)

function Discussion() {
    const router = useRouter()
    const catPaneRef = useRef(null)
    const [categoryFilter, setCategoryFilter] = useState(new Set())
    const [showHiddenPane, setShowHiddenPane] = useState(false)
    const [currentPost, setCurrentPost] = useState(null)
    const [postListings, setPostListings] = useState([])
    const [specialListings, setSpecialListings] = useState(
        { pinned: [], announcements: [] })
    const [initialLoadTime] = useState(Date.now())

    const postContext = { currentPost, setCurrentPost }
    const postListingsContext = { 
        postListings, setPostListings, specialListings, setSpecialListings }
        
    const { user, loading: loadingUser } = useUser({ redirectTo: '/login' })
    const { course, loading: loadingCourse } = useCourse(router.query.courseId)

    useEffect(() => {
        if (!catPaneRef.current) return

        catPaneRef.current.style.display = showHiddenPane ? "flex" : ""
        catPaneRef.current.style.position = showHiddenPane ? "fixed" : ""
        catPaneRef.current.style.zIndex = showHiddenPane ? "500" : ""
        catPaneRef.current.style.top = showHiddenPane ? "96px" : ""
        catPaneRef.current.style.height = showHiddenPane ? "100%" : ""

    }, [catPaneRef, showHiddenPane])
    
    useEffect(() => {
        const listingNodes = document.querySelectorAll(
            '[data-testid=post-info-container]')
        for (const listingNode of listingNodes) {
            const splitNodePostId = listingNode.id.split('-')
            const nodePostId = parseInt(splitNodePostId[splitNodePostId.length - 1])
            if (nodePostId !== currentPost.postId) {
                listingNode.style.backgroundColor = ""
            }
        }
    }, [currentPost])

    const changeFilter = (add, category) => {
        const newFilter = new Set(categoryFilter)
        if (add) newFilter.add(category)
        else newFilter.delete(category)
        setCategoryFilter(newFilter)
    }
    
    if (loadingUser || !user.authenticated || loadingCourse) return null

    const { termName, code, section } = course
    const title = (
        `${ termName } ${ code }-${ section } - Discussion`)
    return (
        <>
            <Head><title>{ title }</title></Head>
            <TimeContext.Provider value={ initialLoadTime } >
                <div data-testid="discussion-container" 
                className="flex h-[calc(100vh-48px)] w-full">
                    <CategoryPane catPaneRef={ catPaneRef } 
                        changeCategoryFilter={ changeFilter } />
                    <PostListingsContext.Provider 
                        value={ postListingsContext } >
                        <PostContext.Provider value={ postContext }>
                            <section className="flex-auto text-white flex w-full" 
                                data-testid="posts-section">
                                <PostListingsPane catPaneRef={ catPaneRef }
                                    toggleCatPane={ () => setShowHiddenPane(!showHiddenPane) }
                                    categoryFilter={ categoryFilter } setCurrentPost={ setCurrentPost }/>
                                <Post />
                            </section>
                        </PostContext.Provider>
                    </PostListingsContext.Provider>
                </div>
            </TimeContext.Provider>
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