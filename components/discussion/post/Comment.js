import React, { useState } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'
import CommentControlPanel from './CommentControlPanel'
import CommentBadges from './CommentBadges'


const Comment = React.memo(function(props) {
    const { 
        info, isAncestor, setPostResolved, setPostAnswered, 
        calcReplyThreadId, setDescendantsInfo, descendantsInfo,
        setAncestor, ancestor 
    } = props

    const [depth] = useState(isAncestor ? 0 : info.threadId.split('.').length)
    const [userDeleted, setUserDeleted] = useState(info.deleted) 
    const [endorsed, setEndorsed] = useState(info.endorsed)
    const [likes, setLikes] = useState(parseInt(info.likes))
    const [commentResolving, setCommentResolving] = useState(info.isResolving)
    const [commentIsAnswer, setCommentIsAnswer] = useState(info.isAnswer)
    const [replying, setReplying] = useState(false)
    const [editing, setEditing] = useState(false)


    const handleEditSubmit = async ({ editContent, displayContent }) => {
        const body = { commentId: info.commentId, editContent, displayContent }

        let backendUpdateSuccessful, editedCommentInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ info.postId }/content/editComment`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json'} 
                }
            )
            backendUpdateSuccessful = resp.ok
            if (backendUpdateSuccessful) {
                const parsed = await resp.json()
                editedCommentInfo = parsed.editedCommentInfo
            }
        }
        catch (error) {
            console.error(error)
            backendUpdateSuccessful = false
        }

        if (backendUpdateSuccessful) {
            const {
                commentId,
                editContent: newEditContent, 
                displayContent: newDisplayContent 
            } = editedCommentInfo
            updateCommentUi(commentId, newEditContent, newDisplayContent, 
                descendantsInfo, setDescendantsInfo, ancestor, 
                setAncestor, isAncestor)
        }
        return backendUpdateSuccessful
    }

    const handleReplySubmit = async ({ editContent, displayContent, anonymous }) => {
        const body = { 
            post: info.postId, editContent, displayContent, anonymous,
            ancestorComment: isAncestor ? info.commentId : info.ancestorComment,
            threadId: calcReplyThreadId(info.threadId),
            createdAt: new Date(Date.now()).toUTCString(),
        } 

        let backendUpdateSuccessful, newCommentInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ info.postId }/content/newComment`, { 
                    method: 'POST', 
                    body: JSON.stringify(body), 
                    headers: { 'Content-Type': 'application/json'} 
                })
            backendUpdateSuccessful = resp.ok
            if (backendUpdateSuccessful) {
                const parsed = await resp.json()
                newCommentInfo = parsed.newCommentInfo
            }
        }
        catch (error) { 
            console.error(error)
            backendUpdateSuccessful = false 
        }

        if (backendUpdateSuccessful) {
            newCommentInfo = { 
                ...newCommentInfo, 
                loadMoreButtonBelow: !!info.loadMoreButtonBelow,
                postAuthorId: info.postAuthorId,
                postIsQuestion: info.postIsQuestion,
                // localize utc created at received from backend
                createdAt: new Date(newCommentInfo.createdAt)
            }
            addReplyToUi(
                newCommentInfo, info, isAncestor, 
                setDescendantsInfo, descendantsInfo)
        }

        return backendUpdateSuccessful
    }


    const controlPanelProps = {
        setPostResolved, setPostAnswered, setUserDeleted, setEndorsed, endorsed,
        likes, setLikes, setCommentResolving, setCommentIsAnswer,
        replying, setReplying, editing, setEditing, handleEditSubmit,
        handleReplySubmit, info, isAncestor, commentIsAnswer, commentResolving
    }

    const headerProps = {
        info, userDeleted, commentResolving, commentIsAnswer, endorsed
    }

    return (
        <>
            { !isAncestor && <div className="mt-4" /> }
            <div data-testid="comment-box-container" 
                className="w-full flex items-start justify-start py-2"
                style={{ paddingLeft: `${ Math.min(depth * 1.5, 12) }%`}} >
                <CommentBadges headerProps={ headerProps } />
                <div data-testid="comment-content-container" 
                    className="pl-2 -mt-0.5 w-full flex-col items-start 
                        justify-start text-sm font-thin">
                    <h6>
                        <span className="font-light" data-testid="comment-author">
                            { userDeleted || info.anonymous ? "anonymous" : info.author }
                        </span>
                        { !userDeleted && 
                        <Timestamp createdAt={ new Date(info.createdAt) }/> }
                    </h6> 
                    { !userDeleted ? 
                    <div dangerouslySetInnerHTML={{ __html: info.displayContent }}
                        data-testid="comment-container" 
                        className="font-light mt-1" />
                    : 
                    <div className="font-light" data-testid="comment-container">
                        deleted
                    </div> 
                    }
                    { !userDeleted && 
                    <CommentControlPanel 
                        controlPanelProps={ controlPanelProps } /> }
                </div>
            </div>
        </>
    )
})

const updateCommentUi = (
    commentId, newEditContent, newDisplayContent, 
    descendantsInfo, setDescendantsInfo, ancestor, 
    setAncestor, isAncestor) => {

    if (isAncestor) {
        setAncestor({
            ...ancestor, 
            editContent: newEditContent, 
            displayContent: newDisplayContent
        })
        return
    }
    
    let oldCommentIdx
    for (let i = 0; i < descendantsInfo.length; i++) {
        if (descendantsInfo[i].commentId === commentId) {
            oldCommentIdx = i
            break
        }
    }
    setDescendantsInfo([
        ...descendantsInfo.slice(0, oldCommentIdx),
        { ...descendantsInfo[oldCommentIdx],
            editContent: newEditContent, 
            displayContent: newDisplayContent },
        ...descendantsInfo.slice(oldCommentIdx + 1)
    ])
}

const addReplyToUi = (
    newCommentInfo, repliedToInfo, isAncestor, 
    setDescendantsInfo, descendantsInfo) => {
    // place new comment right under repliedTo

    if (isAncestor) { 
        setDescendantsInfo([newCommentInfo, ...descendantsInfo])
        return
    }
    const newRepliedToInfo = { ...repliedToInfo, loadMoreButtonBelow: false }
    let repliedToIdx
    for (let i = 0; i < descendantsInfo.length; i++) {
        const { commentId } = descendantsInfo[i]
        if (commentId === repliedToInfo.commentId) {
            repliedToIdx = i
            break
        }
    }
    setDescendantsInfo([
        ...descendantsInfo.slice(0, repliedToIdx), 
        newRepliedToInfo,
        newCommentInfo,
        ...descendantsInfo.slice(repliedToIdx + 1)
    ])
}

export default Comment