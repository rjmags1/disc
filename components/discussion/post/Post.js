import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import PostContentSection from './PostContentSection'
import Thread from './Thread'
import CommentButton from './controlPanelButtons/CommentButton'

import { useContext, useEffect, useState, useRef } from 'react'
import { 
    PostContext, TimeContext, EditorContext 
} from '../../../pages/[courseId]/discussion'
import { usePostContent } from '../../../lib/hooks'


function Post() {
    const Editor = useContext(EditorContext)
    const initialLoadTime = useContext(TimeContext)
    const { currentPost } = useContext(PostContext)

    const [apiPage, setApiPage] = useState(1)
    const [threads, setThreads] = useState(
        []
    ) // threads are top level (ancestor) comments and first 2 associated
      // replies, plus a load more button to load more replies
    const [loadingCommentsFor, setLoadingCommentsFor] = useState(
        null
    ) // loadingCommentsFor keeps track of post for which current apiPage 
      // corresponds to. changes when Post component renders different post info,
      // ie, when currentPost (from context) changes
    const [showNewCommentBtn, setShowNewCommentBtn] = useState(true)
    const [postContent, setPostContent] = useState(null)
    const [postResolved, setPostResolved] = useState(
        null
    ) // hold resolved and answered info in state to update ui in case
      // a user is post author and marks a comment as resolving or answer
    const [postAnswered, setPostAnswered] = useState(null)
    const [observed, setObserved] = useState(false)

    const loaderRef = useRef(null) // triggers thread lazy loading on intersxn
    const canLoadMoreContentForPostRef = useRef(
        false
    ) // .current true only if just loaded an api page and theres 
      // more info to load from the backend
    const observerRef = useRef(new IntersectionObserver((entries) => {
        if (canLoadMoreContentForPostRef.current && entries[0].isIntersecting) {
            setApiPage(prev => prev + 1)
            canLoadMoreContentForPostRef.current = false
        }
    }))

    // get post content, ie author avatar, display and edit content, 
    // associated with currentPost and apiPage, which is inc on lazy 
    // loader intersxn
    const { content, loading: loadingPostContent } = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)


    useEffect(() => {
        // effect for resetting apiPage back to 1 when new post is selected. 
        // this effect also wires observer to loaderRef on first post select
        if (!currentPost) return
        setPostAnswered(currentPost.answered)
        setPostResolved(currentPost.resolved)
        setApiPage(1)

        if (observed) return
        observerRef.current.observe(loaderRef.current)
        setObserved(true)
        
    }, [currentPost])

    useEffect(() => {
        // update threads and postContent state on new/first 
        // post selection and successful subsequent usePostContent data hook 
        // call. also update whether it is possible to load more threads,
        // and remember this post in loadingCommentsFor state
        // so the next time this effect runs we'll know whether its running 
        // again due to new post selection from listings pane (currentPost change)
        // or lazy loading more threads associated with this post
        if (!content || loadingPostContent) return

        const { ancestorInfo, descendantInfo, nextPage } = content
        const newThreads = ancestorInfo.map(
            ancestorCommentInfo => ({
                ancestor: ancestorCommentInfo, 
                descendants: (
                    (!!descendantInfo && 
                        descendantInfo[ancestorCommentInfo.commentId]) ? 
                    descendantInfo[ancestorCommentInfo.commentId] : [])
            })
        )

        const newPostSelected = (loadingCommentsFor !== null 
            && loadingCommentsFor !== currentPost.postId)
        if (apiPage === 1 && (newPostSelected || loadingCommentsFor === null)) {
            setPostContent({ ...currentPost, ...content.postInfo })
        }
        canLoadMoreContentForPostRef.current = !!nextPage
        setThreads(newPostSelected ? newThreads : [...threads, ...newThreads])
        setLoadingCommentsFor(currentPost.postId)

    }, [loadingPostContent, currentPost])


    const handleNewThread = async ({ editContent, displayContent, anonymous }) => {
        // handles new top-level/ancestor comment submission
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
    const postContentSyncedWithCurrentPost = (
        postContent?.postId === currentPost?.postId
    ) // will be false if new currentPost changed and effect that updates
      // postContent state has not fired yet
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
                    resolved={ postResolved } content={ postContent } 
                    setContent={ setPostContent } /> 
                <h4 className="text-lg font-base">Comments</h4>
                <hr className="mb-1"/>
                { showNewCommentBtn ?
                <CommentButton 
                    hideCommentBtn={ () => setShowNewCommentBtn(false) } /> :
                <Editor hideEditor={ () => setShowNewCommentBtn(true) } 
                    handleSubmit={ handleNewThread } /> }
                { threads.map(thread => (
                <Thread key={ `${ thread.ancestor.commentId }-thread` } 
                    postId={ currentPost.postId } setPostResolved={ setPostResolved }
                    info={{ ...thread, postAuthorId: currentPost.authorId }}
                    postIsQuestion={ currentPost.isQuestion } 
                    setPostAnswered={ setPostAnswered }/>)) }
            </>}
            <div ref={ loaderRef } className="w-full h-[1px] bg-inherit" />
        </div>
    )
}

export default Post