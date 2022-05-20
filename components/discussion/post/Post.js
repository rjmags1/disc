import { useContext, useEffect, useState, useRef } from 'react'
import { PostContext, TimeContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import { usePostContent } from '../../../lib/hooks'
import PostContentSection from './PostContentSection'
import Thread from './Thread'
import CommentButton from './controlPanelButtons/CommentButton'
import { EditorContext } from '../../../pages/[courseId]/discussion'

function Post() {
    const Editor = useContext(EditorContext)
    const [apiPage, setApiPage] = useState(1)
    const [threads, setThreads] = useState([])
    const [loadingCommentsFor, setLoadingCommentsFor] = useState(null)
    const [observed, setObserved] = useState(false)
    const [postContent, setPostContent] = useState(null)
    const { currentPost } = useContext(PostContext)
    const [postResolved, setPostResolved] = useState(null)
    const [postAnswered, setPostAnswered] = useState(null)
    const [showNewCommentBtn, setShowNewCommentBtn] = useState(true)
    const initialLoadTime = useContext(TimeContext)
    const loaderRef = useRef(null) // triggers thread lazy loading on intersxn
    const canLoadMoreRef = useRef(false) // .current true only if just loaded 
                                         // api page and theres another one 
    const observerRef = useRef(new IntersectionObserver((entries) => {
        if (canLoadMoreRef.current && entries[0].isIntersecting) {
            setApiPage(prev => prev + 1)
            canLoadMoreRef.current = false
        }
    }))

    console.log(threads)

    // get new post content associated with currentPost (selected 
    // from postListingsPane) and apiPage, which is inc on lazy loader intersxn
    const { content, loading: loadingPostContent } = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)

    // reset apiPage whenever a new post is selected, 
    // hook up observer on first post selection from postListingsPane
    useEffect(() => {
        if (!currentPost) return
        setPostAnswered(currentPost.answered)
        setPostResolved(currentPost.resolved)
        setApiPage(1)

        if (observed) return
        observerRef.current.observe(loaderRef.current)
        setObserved(true)
        
    }, [currentPost])

    // update threads and postContent to be displayed on new/first 
    // post selection and successful subsequent data loading.
    // also update whether it is possible to load more threads,
    // and remember this post so the next time this effect runs
    // we'll know whether its running again due to new post selection
    // from listings pane or lazy loading more threads associated
    // with this post
    useEffect(() => {
        if (!content || loadingPostContent) return

        const { ancestorInfo, descendantInfo, nextPage } = content
        const newThreads = ancestorInfo.map(
            ancestorCommentInfo => ({
                ancestor: ancestorCommentInfo, 
                descendants: (
                    !!descendantInfo && 
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

    const handleNewThread = async ({ editContent, displayContent, anonymous }) => {
        // talk to backend
        const { postId } = currentPost
        const body = { 
            post: postId,
            ancestorComment: null,
            threadId: null,
            editContent,
            displayContent,
            createdAt: new Date(Date.now()).toUTCString(),
            anonymous
        }
        console.log(body.createdAt)
        let submitSuccessful, newCommentInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ postId }/content/newComment`, { 
                    method: 'POST', 
                    body: JSON.stringify(body), 
                    headers: { 'Content-Type': 'application/json'} 
                })
            submitSuccessful = resp.ok
            if (submitSuccessful) {
                const parsed = await resp.json()
                newCommentInfo = parsed.newCommentInfo
            }
        }
        catch (error) { 
            console.error(error)
            submitSuccessful = false 
        }
        // localize utc created at received from backend
        newCommentInfo.createdAt = new Date(newCommentInfo.createdAt)

        // update threads state with correct shape object
        const newThread = { ancestor: newCommentInfo, descendants: [] }
        setThreads([newThread, ...threads])
        
        // return truthy if submit success so editor removes itself
        return submitSuccessful
    }

    const neverSelectedPost = !currentPost
    const loadingNewPost = apiPage === 1 && loadingPostContent
    const postContentSyncedWithCurrentPost = 
        (postContent?.postId === currentPost?.postId)
    const showPost = !!postContent && postContentSyncedWithCurrentPost

    return (
        <div data-testid="post-container"
            className="hidden lg:flex flex-col w-full flex-auto 
                bg-light-gray py-[4%] px-[7%] overflow-y-scroll">
            { neverSelectedPost && <NoPostSelected /> }
            { loadingNewPost && <Loading /> }
            { showPost && 
            <>
                <PostContentSection answered={ postAnswered }
                    resolved={ postResolved } content={ postContent } /> 
                <h4 className="text-lg font-base">Comments</h4>
                <hr className="mb-1"/>
                { showNewCommentBtn &&
                <CommentButton hideCommentBtn={ () => setShowNewCommentBtn(false) } /> }
                { !showNewCommentBtn &&
                <Editor hideEditor={ () => setShowNewCommentBtn(true) } 
                    handleSubmit={ handleNewThread } />}
                { threads.map(thread => (
                <Thread key={ `${ thread.ancestor.commentId }-thread` } postId={ currentPost.postId }
                    info={{ ...thread, postAuthorId: currentPost.authorId }}
                    postIsQuestion={ currentPost.isQuestion } 
                    setPostResolved={ setPostResolved } 
                    setPostAnswered={ setPostAnswered }/>)) }
            </>}
            <div ref={ loaderRef } className="w-full h-[1px] bg-inherit" />
        </div>
    )
}

export default Post