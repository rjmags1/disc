import Loading from '../lib/Loading'
import PostsLoading from '../lib/ButtonLoading'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useMemo } from 'react'
import { useAnnouncementsPinned, useCourse, useUser } from '../../lib/hooks'
import PostInfo from './PostInfo'
import LoadMoreButton from './LoadMoreButton'
import { LIGHT_RAINBOW_HEX } from'../../lib/colors'
import { filterTest } from '../../lib/filter'
import Pinned from './Pinned'
import Announcements from './Announcements'


const PostsInfoList = React.memo(function(props) {
    const { categoryFilter, filterText, attributeFilter } = props
    const router = useRouter()
    const { courseId } = router.query
    const { course } = useCourse(courseId)
    const { user } = useUser()
    const categoriesToLightRainbowHex = useMemo(() => {
        if (!course?.categories) return null

        const mapped = {}
        const { categories } = course
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i]
            mapped[category] = LIGHT_RAINBOW_HEX[i % LIGHT_RAINBOW_HEX.length]
        }
        return mapped
    }, [course])


    const [loadedAllPosts, setLoadedAllPosts] = useState(false)
    const [loadingMorePosts, setLoadingMorePosts] = useState(false)
    const [apiPage, setApiPage] = useState(1)
    const [initialLoadTime] = useState(Date.now())
    const [allPosts, setAllPosts] = useState([])
    const [displayedPosts, setDisplayedPosts] = useState([])


    const {
        announcements: announcementsInfo,
        pinned: pinnedInfo,
        loading: loadingAnnouncementsPinned
    } = useAnnouncementsPinned(courseId)


    // fetch more posts on apiPage change (initial load or load more btn click)
    useEffect(async () => {
        if (!categoriesToLightRainbowHex) return
        
        // render loading post icon if not initial load
        setLoadingMorePosts(apiPage > 1) 
        const response = await fetch(
            `/api/course/postsInfo/${ courseId }/${ apiPage }/${ initialLoadTime }`
        )
        const { nextPage, posts: newPostInfo } = await response.json()
        setLoadedAllPosts(nextPage === null)

        // post freshly loaded posts into allPosts
        const newPosts = newPostInfo.map((postInfo) => {
            const catColor = categoriesToLightRainbowHex[postInfo.category]
            const component = (
                <PostInfo info={ postInfo } categoryColor={ catColor } 
                    key={ postInfo.postId } />
            )
            return { postInfo, component }
        })
        setAllPosts([...allPosts, ...newPosts])

    }, [apiPage, categoriesToLightRainbowHex])


    // filter loaded posts according to ui-set filter ui
    useEffect(() => {
        if (!user) return

        const filters = [categoryFilter, filterText, attributeFilter]
        const filtered = allPosts.filter(
            post => filterTest(post.postInfo, user, filters)).map(
                filteredPost => filteredPost.component)
        setDisplayedPosts(filtered)
        setLoadingMorePosts(false)

    }, [allPosts, categoryFilter, filterText, attributeFilter, user])


    const initialLoad = (
        ((displayedPosts.length === 0 || allPosts.length === 0) && 
        !(displayedPosts.length === 0 && allPosts.length > 0))
        || loadingAnnouncementsPinned
    )
    const notLoadingMorePosts = (
        displayedPosts.length > 0 && !loadedAllPosts && !loadingMorePosts)
    const clickedLoadMore = (
        displayedPosts.length > 0 && !loadedAllPosts && loadingMorePosts)

    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { (!initialLoad && pinnedInfo.length > 0) && 
            <Pinned pinnedPostsInfo={ pinnedInfo } 
                catColors={ categoriesToLightRainbowHex } /> }
            { (!initialLoad && announcementsInfo.length > 0) && 
            <Announcements announcementsInfo={ announcementsInfo } 
                catColors={ categoriesToLightRainbowHex } /> }
            { initialLoad ? <Loading /> : displayedPosts }
            { notLoadingMorePosts && 
            <LoadMoreButton 
                handleClick={ () => setApiPage(apiPage => apiPage + 1) } /> }
            { clickedLoadMore && 
            <div className="w-full h-[60px] flex items-center justify-center">
                <PostsLoading />
            </div>}
            { loadedAllPosts && 
            <div className="h-max text-center py-2 bg-zinc-900
                border-t border-gray-500 border-r">
                No more posts!
            </div>}
        </div>
    )
})

export default PostsInfoList