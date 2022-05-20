import React, { useState, useContext } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'
import { useUser } from '../../../lib/hooks'
import CommentLikeButton from './commentButtons/CommentLikeButton'
import CommentDeleteButton from './commentButtons/CommentDeleteButton'
import CommentEndorseButton from './commentButtons/CommentEndorseButton'
import CommentMarkResolvingButton from './commentButtons/CommentMarkResolvingButton'
import CommentMarkAnswerButton from './commentButtons/CommentMarkAnswerButton'
import ReplyButton from './commentButtons/ReplyButton'
import { EditorContext } from '../../../pages/[courseId]/discussion'

const Comment = React.memo(function(props) {
    const {
        info, 
        isAncestor, 
        setPostResolved, 
        setPostAnswered, 
        calcReplyThreadId, 
        setDescendantsInfo, 
        descendantsInfo
    } = props

    const [depth] = useState(isAncestor ? 0 : info.threadId.split('.').length)
    const [userDeleted, setUserDeleted] = useState(info.deleted) 
    const [endorsed, setEndorsed] = useState(info.endorsed)
    const [likes, setLikes] = useState(parseInt(info.likes))
    const [commentResolving, setCommentResolving] = useState(info.isResolving)
    const [commentIsAnswer, setCommentIsAnswer] = useState(info.isAnswer)
    const [replying, setReplying] = useState(false)
    const Editor = useContext(EditorContext)

    const handleReplySubmit = async ({ editContent, displayContent, anonymous }) => {
        const body = { 
            post: info.postId,
            ancestorComment: isAncestor ? 
                info.commentId : info.ancestorComment,
            threadId: calcReplyThreadId(info.threadId),
            editContent,
            displayContent,
            createdAt: new Date(Date.now()).toUTCString(),
            anonymous
        } 

        let submitSuccessful, newCommentInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ info.postId }/content/newComment`, { 
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

        if (submitSuccessful) {
            newCommentInfo = { 
                ...newCommentInfo, 
                loadMoreButtonBelow: !!info.loadMoreButtonBelow,
                postAuthorId: info.postAuthorId,
                postIsQuestion: info.postIsQuestion,
                // localize utc created at received from backend
                createdAt: new Date(newCommentInfo.createdAt)
            }
            addReplyToUi(newCommentInfo, info)
        }

        return submitSuccessful
    }

    const addReplyToUi = (newCommentInfo, repliedToInfo) => {
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

    const { postId } = info
    const { user } = useUser()
    const userId = user.user_id
    const userIsCommentAuthor = userId === info.authorId
    const userIsPostAuthor = userId === info.postAuthorId
    const canDelete = userIsCommentAuthor || user.is_admin
    const canEndorse = user.is_staff || user.is_instructor
    const canMarkAnswer = userIsPostAuthor && info.postIsQuestion
    const canMarkResolving =  userIsPostAuthor && !info.postIsQuestion

    return (
        <>
            { !isAncestor && <div className="mt-4" /> }
            <div data-testid="comment-box-container" 
                className="w-full flex items-start justify-start py-2"
                style={{ paddingLeft: `${ depth * 5 }%`}} >
                <div className="flex flex-col justify-start items-center" >
                    <img width="40" className="rounded-full" src={ 
                            info.anonymous || userDeleted ? 
                            "/profile-button-img.png" : info.avatarUrl }/>
                    <div className='flex-col items-center justify-center my-2'>
                        { (commentResolving || commentIsAnswer) && 
                         <img className="ml-[1px]" width="19" src="/checkmark.png" /> }
                        { endorsed &&
                        <>
                            {(commentResolving || commentIsAnswer) && <div className='h-[0.5rem]'/> }
                            <span className="h-[20px] w-[21px]" >
                                <img src="/endorsed.png" width="20"/>
                            </span>
                        </>
                        }
                    </div>
                </div>
                <div data-testid="comment-content-container" 
                    className="pl-2 -mt-0.5 w-full flex-col items-start 
                        justify-start text-sm font-thin">
                    <h6 data-testid="comment-header">
                        <span className="font-light">
                            { userDeleted ? "anonymous" : info.author }
                        </span>
                        { !userDeleted && <Timestamp createdAt={ new Date(info.createdAt) }/> }
                    </h6> 
                    { userDeleted ? 
                    <span className="font-light">deleted</span> 
                    :
                    <div data-testid="comment-container" className="font-light mt-1" 
                        dangerouslySetInnerHTML={{ __html: info.displayContent }}/>
                    }
                    { !userDeleted && 
                    <>
                        <div className="mt-2 flex h-[12px] items-center text-xs
                            font-normal opacity-50">
                            <span className="mr-0.5">{ likes }</span>
                            <img src="/heart.png" width="11" className="mr-1"/>
                            <CommentLikeButton initialLiked={ info.liked } postId={ postId }
                                setDisplayedLikes={ setLikes } commentId={ info.commentId } />
                            {!replying &&
                            <ReplyButton parentId={ info.commentId }
                                ancestorId={ isAncestor ? null : info.ancestorComment } 
                                setClicked={ () => setReplying(true) } /> }
                            { userIsCommentAuthor && <button className="px-1">EDIT</button> }
                            { canDelete && 
                            <CommentDeleteButton postId={ postId } commentId={ info.commentId }
                                markDeleted={ () => setUserDeleted(true) } /> }
                            { canEndorse && 
                            <CommentEndorseButton postId={ postId } commentId={ info.commentId }
                                endorsed={ endorsed } setEndorsed={ setEndorsed } /> }
                            { canMarkAnswer && 
                            <CommentMarkAnswerButton postId={ postId }
                                commentInfo={ info } isAnswer={ commentIsAnswer }
                                setCommentIsAnswer={ setCommentIsAnswer }
                                setPostAnswered={ setPostAnswered } /> }
                            { canMarkResolving && 
                            <CommentMarkResolvingButton postId={ postId }
                                commentInfo={ info } isResolving={ commentResolving }
                                setCommentResolving={ setCommentResolving }
                                setPostResolved={ setPostResolved } /> }
                        </div>
                        { replying && 
                        <Editor hideEditor={ () => setReplying(false) } 
                            handleSubmit={ handleReplySubmit } /> }
                    </>}
                </div>
            </div>
        </>
    )
})

export default Comment