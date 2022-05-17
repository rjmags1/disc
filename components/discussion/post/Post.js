import { useContext, useEffect, useState } from 'react'
import { PostContext, TimeContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import { usePostContent } from '../../../lib/hooks'
import PostContentSection from './PostContentSection'
import Thread from './Thread'
import Comment from './Comment'
import CommentButton from './controlPanelButtons/CommentButton'

function Post() {
    const [apiPage, setApiPage] = useState(1)
    const [threads, setThreads] = useState([])
    const [loadingCommentsFor, setLoadingCommentsFor] = useState(null)
    const { currentPost } = useContext(PostContext)
    const initialLoadTime = useContext(TimeContext)


    const { content, loading: loadingPostContent } = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)

    useEffect(() => {
        if (!content || loadingPostContent) return

        const { ancestorInfo, descendantInfo } = content
        const newThreads = ancestorInfo.map(
            ancestorCommentInfo => ({
                ancestor: ancestorCommentInfo, 
                descendants: descendantInfo ? 
                    descendantInfo[ancestorCommentInfo.commentId] 
                    : []
            })
        )

        const newPostSelected = (
            loadingCommentsFor !== null && 
            loadingCommentsFor !== currentPost.postId)
        setThreads(newPostSelected ? newThreads : [...threads, ...newThreads])
        setLoadingCommentsFor(currentPost.postId)

    }, [apiPage, loadingPostContent, currentPost])


    return (
        <div data-testid="post-container"
            className="hidden lg:flex flex-col w-full flex-auto 
                bg-light-gray py-[4%] px-[7%] overflow-auto">
            { !currentPost && <NoPostSelected /> }
            { apiPage === 1 && loadingPostContent && !content && <Loading /> }
            { !!content && apiPage === 1 && 
            <>
                <PostContentSection 
                    content={{ ...currentPost, ...content.postInfo }} /> 
                <h4 className="text-lg font-base">Comments</h4>
                <hr className="mb-1"/>
                <CommentButton />
                { threads.map(thread => (
                <Thread key={ `${ thread.ancestor.commentId }-thread` } info={ thread } />)) }
            </>}
        </div>
    )
}

export default Post