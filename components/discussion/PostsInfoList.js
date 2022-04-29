import Loading from '../lib/Loading'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { usePostsInfo } from '../../lib/hooks'
import PostInfo from './PostInfo'
import React from 'react'

const PostsInfoList = React.memo(function() {
    const router = useRouter()
    const { courseId } = router.query

    const [postsInfoApiPage, setPostsInfoApiPage] = useState(1)
    const [postsInfo, setPostsInfo] = useState([])

    const { 
        paginatedPostsInfo, 
        loading: loadingPostsInfo
    } = usePostsInfo(courseId, postsInfoApiPage)

    useEffect(() => {
        if (!paginatedPostsInfo?.posts) return

        const { posts: loadedPosts } = paginatedPostsInfo
        const didntLoadNewApiPage = 
            (postsInfo.length > 0 ? postsInfo[0] : null) === loadedPosts[0]
        if (didntLoadNewApiPage) return

        // make sure keys are present on PostInfoListing to prevent
        // rerender of all PostInfo components represented by postsInfo state
        setPostsInfo([...postsInfo, ...loadedPosts])
    }, [paginatedPostsInfo])


    //if (postsInfo.length > 0) console.log(postsInfo)
    const postInfoListings = postsInfo.map(
        (postInfo) => {
            return <PostInfo info={ postInfo } key={ postInfo.postId } />
        }
    )

    return (
        <div data-testid="post-listings-container" id="post-listings-container"
            className="w-full overflow-auto" >
            { loadingPostsInfo ? <Loading /> : postInfoListings }
        </div>
    )
})

export default PostsInfoList