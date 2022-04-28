import Loading from '../lib/Loading'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { usePostsInfo } from '../../lib/hooks'
import PostInfo from './PostInfo'

function PostsInfoList() {
    const router = useRouter()
    const { courseId } = router.query

    const [postsInfoApiPage, setPostsInfoApiPage] = useState(1)
    const [postsInfo, setPostsInfo] = useState([])
    const [loadMorePosts, setLoadMorePosts] = useState(false)
    const [noMorePosts, setNoMorePosts] = useState(false)

    const { 
        paginatedPostsInfo, 
        loading: loadingPostsInfo
    } = usePostsInfo(courseId, postsInfoApiPage)

    useEffect(() => {
        if (!loadMorePosts || noMorePosts) return

        setPostsInfoApiPage(paginatedPostsInfo.nextPage)
        setLoadMorePosts(false)
    }, [loadMorePosts])

    useEffect(() => {
        if (!paginatedPostsInfo || !paginatedPostsInfo?.posts) return

        const { posts: loadedPosts, nextPage } = paginatedPostsInfo
        const didntLoadNewApiPage = 
            (postsInfo.length > 0 ? postsInfo[0] : null) === loadedPosts[0]
        if (didntLoadNewApiPage) return

        // make sure keys are present on PostInfoListing to prevent
        // rerender of all PostInfo components represented by postsInfo state
        setPostsInfo([...postsInfo, ...loadedPosts])
        setNoMorePosts(!nextPage)
    }, [paginatedPostsInfo])


    if (postsInfo.length > 0) console.log(postsInfo)
    const postInfoListings = postsInfo.map(
        (postInfo) => {
            return <PostInfo info={ postInfo } key={ postInfo.postId } />
        }
    )

    return (
        <div data-testid="post-listings-container"
            className="w-full" >
            { loadingPostsInfo ? <Loading /> : postInfoListings }
        </div>
    )
}

export default PostsInfoList