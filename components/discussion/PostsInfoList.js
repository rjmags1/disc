import Loading from '../lib/Loading'
import PostsLoading from '../lib/ButtonLoading'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { usePostsInfo, useCategories } from '../../lib/hooks'
import PostInfo from './PostInfo'
import ObservedPostInfo from './ObservedPostInfo'
import { LIGHT_RAINBOW_HEX } from'../../lib/colors'


const PostsInfoList = React.memo(function() {
    const router = useRouter()
    const { courseId } = router.query

    const [postsInfoApiPage, setPostsInfoApiPage] = useState(1)
    const [postsInfo, setPostsInfo] = useState([])
    const [initialLoadTime] = useState(Date.now())
    const [loadedAllPosts, setLoadedAllPosts] = useState(false)

    const {
        categories: categoriesInfo,
        loading: loadingCategories
    } = useCategories(courseId)

    const { 
        paginatedPostsInfo, 
        loading: loadingPostsInfo
    } = usePostsInfo(courseId, postsInfoApiPage, initialLoadTime)

    const observedRef = useRef(null)
    const observerRef = useRef(new IntersectionObserver(
        (observedPostInfos) => {
            // do nothing on observer init
            if (observedPostInfos.length === 0) return 

            // only ever observe one post info at a time -- the last loaded one
            if (observedPostInfos[0].isIntersecting) {
                setPostsInfoApiPage(postsInfoApiPage => postsInfoApiPage + 1)
            }
        })
    )
    
    // whenever we load more posts, update postsInfo state
    useEffect(() => { 
        if (!paginatedPostsInfo?.posts) return

        const { posts: loadedPosts, nextPage } = paginatedPostsInfo
        const didntLoadNewApiPage = 
            (postsInfo.length > 0 ? postsInfo[0] : null) === loadedPosts[0]
        if (didntLoadNewApiPage) return

        setPostsInfo([...postsInfo, ...loadedPosts])
        setLoadedAllPosts(nextPage === null)
    }, [paginatedPostsInfo])

    // whenever we display new post info, observe new last post or 
    // disconnect observer if all posts loaded to prevent firing request
    useEffect(() => {  
        if (!observedRef.current || !postsInfo) return
        const observer = observerRef.current

        if (loadedAllPosts) {
            observer.disconnect()
            return
        }

        const needsToBeObserved = observedRef.current
        observer.observe(needsToBeObserved)
    }, [postsInfo])

    const categoriesToLightRainbowHex = useMemo(() => {
        if (!categoriesInfo) return

        const mapped = {}
        for (let i = 0; i < categoriesInfo.length; i++) {
            const { category } = categoriesInfo[i]
            mapped[category] = LIGHT_RAINBOW_HEX[i % LIGHT_RAINBOW_HEX.length]
        }
        return mapped
    }, [categoriesInfo])

    const postInfoListings = useMemo(() => postsInfo.map(
        (postInfo, i) => {
            if (i === postsInfo.length - 1) {
                const observer = observerRef.current
                const prevObserved = observedRef.current
                if (observer && prevObserved) observer.unobserve(prevObserved)
            }

            const categoryColor = categoriesToLightRainbowHex[postInfo.category]
            return i < postsInfo.length - 1 ?
                <PostInfo info={ postInfo } key={ postInfo.postId } 
                    categoryColor={ categoryColor } />
                : <ObservedPostInfo ref={ observedRef } key={ postInfo.postId }
                    info={ postInfo } categoryColor={ categoryColor } />
        }
    ), [postsInfo])

    const loadingDataHooks = 
        loadingCategories || (loadingPostsInfo && postsInfo.length === 0)

    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { loadingDataHooks ? <Loading /> : postInfoListings }
            { loadingPostsInfo && postsInfo.length > 0 ? 
            <div className="w-full h-[48px] border-y border-gray-500 
                border-r flex items-center justify-center">
                <PostsLoading />
            </div> : <></> 
            }
            { loadedAllPosts && 
            <div className="h-max text-center py-2 bg-zinc-900
                border-t border-gray-500 border-r">
                No more posts!
            </div>
            }
        </div>
    )
})

export default PostsInfoList