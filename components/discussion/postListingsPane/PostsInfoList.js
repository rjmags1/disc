import Loading from '../../lib/Loading'
import PostsLoading from '../../lib/ButtonLoading'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useMemo, useContext } from 'react'
import { useAnnouncementsPinned, useCourse, useUser } from '../../../lib/hooks'
import PostInfo from './PostInfo'
import LoadMoreButton from './LoadMoreButton'
import { categoriesToLightRainbowHex } from'../../../lib/colors'
import { filterTest } from '../../../lib/filter'
import Pinned from './Pinned'
import Announcements from './Announcements'
import { 
    TimeContext, PostListingsContext 
} from '../../../pages/[courseId]/discussion'


const PostsInfoList = React.memo(function(props) {
    const { categoryFilter, filterText, attributeFilter, setCurrentPost } = props
    const router = useRouter()
    const { courseId } = router.query
    const initialLoadTime = useContext(TimeContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings 
    } = useContext(PostListingsContext)

    const { course } = useCourse(courseId)
    const { user } = useUser()
    const categoriesToColors = useMemo(() => {
        if (!course?.categories) return null
        return categoriesToLightRainbowHex(course.categories)
    }, [course])


    const [loadedAllPosts, setLoadedAllPosts] = useState(false)
    const [loadingMorePosts, setLoadingMorePosts] = useState(false)
    const [apiPage, setApiPage] = useState(1)
    const [displayedPosts, setDisplayedPosts] = useState([])


    const {
        announcements: announcementsInfo,
        pinned: pinnedInfo,
        loading: loadingAnnouncementsPinned
    } = useAnnouncementsPinned(courseId)


    // fetch more posts on apiPage change (initial load or load more btn click)
    useEffect(async () => {
        if (!categoriesToColors) return
        
        // render loading post icon if not initial load
        setLoadingMorePosts(apiPage > 1) 
        const response = await fetch(
            `/api/course/postsInfo/course/${ courseId }/${ apiPage }/${ initialLoadTime }`
        )
        const { nextPage, posts: newPostInfo } = await response.json()
        setLoadedAllPosts(nextPage === null)

        // put freshly loaded posts into postListingComponents
        const newPosts = newPostInfo.map((postInfo) => {
            const catColor = categoriesToColors[postInfo.category]
            return { postInfo, catColor }
        })
        setPostListings([...postListings, ...newPosts])

    }, [apiPage, categoriesToColors])


    useEffect(() => {
        if (!announcementsInfo || !pinnedInfo) return

        setSpecialListings({ 
            pinned: [...specialListings.pinned, ...pinnedInfo],
            announcements: [...specialListings.announcements, ...announcementsInfo]
        })

    }, [announcementsInfo, pinnedInfo])


    // filter loaded posts according to user-set filter ui
    useEffect(() => {
        if (!user) return

        const filters = [categoryFilter, filterText, attributeFilter]
        const filtered = postListings.filter(
            ({ postInfo }) => filterTest(postInfo, user, filters)).map(
                ({ postInfo, catColor }) => (
                    <PostInfo categoryColor={ catColor } info={ postInfo }
                        key={ postInfo.postId } setCurrentPost={ setCurrentPost } />
                )
            )
        setDisplayedPosts(filtered)
        setLoadingMorePosts(false)

    }, [postListings, categoryFilter, filterText, attributeFilter, user])


    const initialLoad = (
        ((displayedPosts.length === 0 || postListings.length === 0) && 
        !(displayedPosts.length === 0 && postListings.length > 0))
        || loadingAnnouncementsPinned
    )
    const notLoadingMorePosts = (
        displayedPosts.length > 0 && !loadedAllPosts && !loadingMorePosts)
    const clickedLoadMore = (
        displayedPosts.length > 0 && !loadedAllPosts && loadingMorePosts)
    const filters = [categoryFilter, filterText, attributeFilter]
    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { (!initialLoad && pinnedInfo.length > 0) && 
            <Pinned filters={ filters } catColors={ categoriesToColors }
                user={ user } setCurrentPost={ setCurrentPost } /> 
            }
            { (!initialLoad && announcementsInfo.length > 0) && 
            <Announcements user={ user } catColors={ categoriesToColors }
                filters={ filters } setCurrentPost={ setCurrentPost } /> 
            }
            { initialLoad ? 
            <Loading /> : <ul>{ displayedPosts }</ul> 
            }
            { notLoadingMorePosts && 
            <LoadMoreButton 
                handleClick={ () => setApiPage(apiPage => apiPage + 1) } /> 
            }
            { clickedLoadMore && 
            <div className="w-full h-[60px] flex items-center justify-center">
                <PostsLoading />
            </div>
            }
            { loadedAllPosts && 
            <div className="h-max text-center py-2 bg-zinc-900
                border-t border-gray-500 border-r">
                <header><h3>No more posts!</h3></header>
            </div>}
        </div>
    )
})

export default PostsInfoList