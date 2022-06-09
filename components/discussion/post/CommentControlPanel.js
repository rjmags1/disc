import CommentLikeButton from './commentButtons/CommentLikeButton'
import CommentDeleteButton from './commentButtons/CommentDeleteButton'
import CommentEndorseButton from './commentButtons/CommentEndorseButton'
import CommentMarkResolvingButton from './commentButtons/CommentMarkResolvingButton'
import CommentMarkAnswerButton from './commentButtons/CommentMarkAnswerButton'
import ReplyButton from './commentButtons/ReplyButton'
import CommentEditButton from './commentButtons/CommentEditButton'

import { EditorContext } from '../../../pages/[courseId]/discussion'
import { useContext } from 'react'
import { useUser } from '../../../lib/hooks'

function CommentControlPanel({ controlPanelProps }) {
    const {
        setPostResolved, setPostAnswered, setUserDeleted, setEndorsed, endorsed,
        likes, setLikes, setCommentResolving, setCommentIsAnswer,
        replying, setReplying, editing, setEditing, handleEditSubmit,
        handleReplySubmit, info, isAncestor, commentIsAnswer, commentResolving
    } = controlPanelProps
    const Editor = useContext(EditorContext)

    const { user } = useUser()

    const { postId } = info
    const userId = user.user_id
    const userIsCommentAuthor = userId === info.authorId
    const userIsPostAuthor = userId === info.postAuthorId
    const canDelete = userIsCommentAuthor || user.is_admin
    const canEndorse = user.is_staff || user.is_instructor
    const canMarkAnswer = userIsPostAuthor && info.postIsQuestion
    const canMarkResolving =  userIsPostAuthor && !info.postIsQuestion

    return (
        <>
            <div className="mt-2 flex h-[12px] items-center text-xs
                font-normal opacity-50 flex-wrap gap-y-1" data-testid="comment-control-panel">
                <div data-testid="comment-like-counter" className="flex h-[12px] items-center">
                    <span className="mr-0.5">{ likes }</span>
                    <img src="/heart.png" width="11" className="mr-1 mt-[1px]"/>
                </div>
                <CommentLikeButton initialLiked={ info.liked } postId={ postId }
                    setDisplayedLikes={ setLikes } commentId={ info.commentId } />
                {!replying &&
                <ReplyButton parentId={ info.commentId }
                    ancestorId={ isAncestor ? null : info.ancestorComment } 
                    setClicked={ () => setReplying(true) } /> }
                { userIsCommentAuthor && !editing &&
                <CommentEditButton setClicked={ () => setEditing(true) } /> }
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
            { (replying || editing) && 
            <Editor hideEditor={ 
                replying ? () => setReplying(false) : () => setEditing(false) } 
                handleSubmit={ replying ? handleReplySubmit : handleEditSubmit }
                editContent={ info.editContent } /> }
        </>
    )
}

export default CommentControlPanel