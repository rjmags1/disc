import React, { useState, useRef } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'
import CommentControlPanel from './CommentControlPanel'
import CommentHeader from './CommentHeader'
import { sanitize } from 'dompurify'


const Comment = React.memo(function(props) {
    const { 
        info, isAncestor, setPostResolved, setPostAnswered, 
        calcReplyThreadId, setDescendantsInfo, descendantsInfo,
        setAncestor, ancestor 
    } = props

    const [deleted, setDeleted] = useState(info.deleted) 
    const [endorsed, setEndorsed] = useState(info.endorsed)
    const [likes, setLikes] = useState(parseInt(info.likes))
    const [commentResolving, setCommentResolving] = useState(info.isResolving)
    const [commentIsAnswer, setCommentIsAnswer] = useState(info.isAnswer)
    const [replying, setReplying] = useState(
        false
    ) // true when a comment is being replied to; if true triggers Editor render
    const [editing, setEditing] = useState(
        false
    ) // true when a comment is being edited; if true triggers Editor render

    const depth = useRef(
        isAncestor ? 0 : info.threadId.split('.').length
    ) // nesting level of comment; used to indent replies


    const handleEditSubmit = async ({ editContent, displayContent }) => {
        // attempt to update backend with edited comment info, if successful 
        // update the comment ui to reflect the edit. return the outcome of the
        // backend update to the caller so it can do any necessary
        // ui updates it is responsible for, such as removing the editor
        const body = { 
            commentId: info.commentId, 
            editContent, 
            displayContent: displayContent 
        }

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
        // attempt to add the new reply to the backend and if successful
        // add another comment to the ui. return the outcome of the backend update
        // to the caller so it can perform any necessary ui updates it is responsible
        // for, such as removing the editor
        const body = { 
            post: info.postId, editContent, anonymous,
            displayContent: displayContent,
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
        setPostResolved, setPostAnswered, setDeleted, setEndorsed, endorsed,
        likes, setLikes, setCommentResolving, setCommentIsAnswer,
        replying, setReplying, editing, setEditing, handleEditSubmit,
        handleReplySubmit, info, isAncestor, commentIsAnswer, commentResolving
    }
    const headerProps = {
        info, deleted, commentResolving, commentIsAnswer, endorsed
    }
    return (
        <>
            { !isAncestor && <div className="mt-4" /> }
            <div data-testid="comment-box-container" 
                className="w-full flex items-start justify-start py-2"
                style={{ paddingLeft: `${ Math.min(depth.current * 2, 10) }%`}} >
                <CommentHeader headerProps={ headerProps } />
                <div data-testid="comment-content-container" 
                    className="pl-2 -mt-0.5 w-full flex-col items-start 
                        justify-start text-sm font-thin">
                    <h6>
                        <span className="font-light" data-testid="comment-author">
                            { deleted || info.anonymous ? "anonymous" : info.author }
                        </span>
                        { !deleted && 
                        <Timestamp createdAt={ new Date(info.createdAt) }/> }
                    </h6> 
                    { !deleted ? 
                    <div dangerouslySetInnerHTML={{ __html: sanitize(info.displayContent) }}
                        data-testid="comment-container" 
                        className="font-light mt-1" />
                    : 
                    <div className="font-light" data-testid="comment-container">
                        deleted
                    </div> 
                    }
                    { !deleted && 
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
    // called on successful comment edit

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
    // called on successful reply to this comment. 
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