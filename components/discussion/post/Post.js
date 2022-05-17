import { useContext, useEffect, useState, useRef } from 'react'
import { PostContext, TimeContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import { usePostContent } from '../../../lib/hooks'
import PostContentSection from './PostContentSection'
import Thread from './Thread'
import CommentButton from './controlPanelButtons/CommentButton'

function Post() {
    const [apiPage, setApiPage] = useState(1)
    const [threads, setThreads] = useState([])
    const [loadingCommentsFor, setLoadingCommentsFor] = useState(null)
    const [observed, setObserved] = useState(false)
    const [postContent, setPostContent] = useState(null)
    const { currentPost } = useContext(PostContext)
    const initialLoadTime = useContext(TimeContext)

    const loaderRef = useRef(null)
    const canLoadMoreRef = useRef(false)
    const observerRef = useRef(new IntersectionObserver((entries) => {
        if (canLoadMoreRef.current && entries[0].isIntersecting) {
            setApiPage(prev => prev + 1)
            canLoadMoreRef.current = false
        }
    }))

    const { content, loading: loadingPostContent } = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)

    useEffect(() => {
        if (!currentPost) return
        setApiPage(1)

        if (observed) return
        observerRef.current.observe(loaderRef.current)
        setObserved(true)
        
        return () => observerRef.current.unobserve(loaderRef.current)
    }, [currentPost])

    useEffect(() => {
        if (!content || loadingPostContent) return

        const { ancestorInfo, descendantInfo, nextPage } = content
        const newThreads = ancestorInfo.map(
            ancestorCommentInfo => ({
                ancestor: ancestorCommentInfo, 
                descendants: (
                    descendantInfo && 
                    descendantInfo[ancestorCommentInfo.commentId]) ? 
                    descendantInfo[ancestorCommentInfo.commentId] : []
            })
        )

        const newPostSelected = (
            loadingCommentsFor !== null && 
            loadingCommentsFor !== currentPost.postId)
        if (apiPage === 1 && (newPostSelected || loadingCommentsFor === null)) {
            setPostContent({ ...currentPost, ...content.postInfo })
        }
        canLoadMoreRef.current = !!nextPage
        setThreads(newPostSelected ? newThreads : [...threads, ...newThreads])
        setLoadingCommentsFor(currentPost.postId)

    }, [loadingPostContent, currentPost])

    return (
        <div data-testid="post-container"
            className="hidden lg:flex flex-col w-full flex-auto 
                bg-light-gray py-[4%] px-[7%] overflow-auto">
            { !currentPost && <NoPostSelected /> }
            { apiPage === 1 && loadingPostContent && !content && <Loading /> }
            { !!postContent && 
            <>
                <PostContentSection 
                    content={ postContent } /> 
                <h4 className="text-lg font-base">Comments</h4>
                <hr className="mb-1"/>
                <CommentButton />
                { threads.map(thread => (
                <Thread key={ `${ thread.ancestor.commentId }-thread` } info={ thread }
                    postIsQuestion={ currentPost.isQuestion } />)) }
            </>}
            <div ref={ loaderRef } className="w-full h-[1px] bg-inherit" />
        </div>
    )
}

export default Post