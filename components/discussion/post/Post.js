import { useContext, useEffect, useState } from 'react'
import { PostContext, TimeContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import { usePostContent } from '../../../lib/hooks'
import PostContentSection from './PostContentSection'

function Post() {
    const [apiPage, setApiPage] = useState(1)
    const [threads, setThreads] = useState([])
    const { currentPost } = useContext(PostContext)
    const initialLoadTime = useContext(TimeContext)


    const { content, loading: loadingPostContent } = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)

    useEffect(() => {
        if (!content) return

        console.log(content.descendantInfo)
        //console.log(content.ancestorInfo, content.descendantInfo)
        //const newThreads = content.ancestorInfo.map()
        //setThreads([...threads, ...newThreads])
    }, [content])

    return (
        <div data-testid="post-container"
            className="hidden lg:flex w-full flex-auto bg-light-gray">
            { !currentPost && <NoPostSelected /> }
            { apiPage === 1 && loadingPostContent && !content && <Loading /> }
            { !!content && apiPage === 1 && 
            <PostContentSection 
                content={{ ...currentPost, ...content.postInfo }} /> }
        </div>
    )
}

export default Post