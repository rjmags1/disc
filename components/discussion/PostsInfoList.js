import Loading from '../lib/Loading'
import { useRouter } from 'next/router'
import React, { useState, useEffect, useRef, forwardRef } from 'react'
import { usePostsInfo } from '../../lib/hooks'
import PostInfo from './PostInfo'
import ObservedPostInfo from './ObservedPostInfo'

const PostsInfoList = React.memo(function() {
    const router = useRouter()
    const { courseId } = router.query

    const [postsInfoApiPage, setPostsInfoApiPage] = useState(1)
    const [postsInfo, setPostsInfo] = useState([])
    const [initialLoadTime] = useState(Date.now())

    const observedRef = useRef(null)
    const observerRef = useRef(new IntersectionObserver(
        (entries) => {
            if (entries.length === 0) return // do nothing on observer init

            if (entries[entries.length - 1].isIntersecting) {
                console.log(entries[entries.length - 1].target.innerText)
                setPostsInfoApiPage(postsInfoApiPage => postsInfoApiPage + 1)
            }
        })
    )


    const { 
        paginatedPostsInfo, 
        loading: loadingPostsInfo
    } = usePostsInfo(courseId, postsInfoApiPage, initialLoadTime)


    // whenever we load more posts, update postsInfo state
    useEffect(() => { 
        if (!paginatedPostsInfo?.posts) return

        const { posts: loadedPosts } = paginatedPostsInfo
        const didntLoadNewApiPage = 
            (postsInfo.length > 0 ? postsInfo[0] : null) === loadedPosts[0]
        if (didntLoadNewApiPage) return

        setPostsInfo([...postsInfo, ...loadedPosts])
    }, [paginatedPostsInfo])

    // whenever we display new post info, observe new last post
    useEffect(() => {  
        if (!observedRef.current) return

        const observer = observerRef.current
        const needsToBeObserved = observedRef.current
        observer.observe(needsToBeObserved)
    }, [postsInfo])


    //if (postsInfo.length > 0) console.log(postsInfo)
    const postInfoListings = postsInfo.map(
        (postInfo, i) => {
            return i < postsInfo.length - 1 ?
                <PostInfo info={ postInfo } key={ postInfo.postId } />
                : <ObservedPostInfo ref={ observedRef } 
                    info={ postInfo } key={ postInfo.postId } />
        }
    )

    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { loadingPostsInfo && !postsInfo ? <Loading /> : postInfoListings }
        </div>
    )
})

export default PostsInfoList