import React, { useState } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'
import { useUser } from '../../../lib/hooks'
import CommentLikeButton from './commentButtons/CommentLikeButton'
import CommentDeleteButton from './commentButtons/CommentDeleteButton'
import CommentEndorseButton from './commentButtons/CommentEndorseButton'
import CommentMarkResolvingButton from './commentButtons/CommentMarkResolvingButton'

const Comment = React.memo(function({ info, isAncestor, setPostResolved }) {
    const [depth] = useState(isAncestor ? 0 : info.threadId.split('.').length)
    const [userDeleted, setUserDeleted] = useState(info.deleted) 
    const [endorsed, setEndorsed] = useState(info.endorsed)
    const [likes, setLikes] = useState(parseInt(info.likes))
    const [commentResolving, setCommentResolving] = useState(info.isResolving)
    const [commentIsAnswer, setCommentIsAnswer] = useState(info.isAnswer)

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
                    <div className='flex items-center'>
                        { endorsed && 
                        <span className="h-[18px] mt-2 mr-2" >
                            <img src="/endorsed.png" width="18"/>
                        </span> }
                        { (commentResolving || commentIsAnswer) &&
                        <img className="mt-1.5" width="20" src="/checkmark.png" />}
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
                    <div className="mt-2 flex h-[12px] items-center text-xs
                        font-normal opacity-50">
                        <span className="mr-0.5">{ likes }</span>
                        <img src="/heart.png" width="11" className="mr-1"/>
                        <CommentLikeButton initialLiked={ info.liked } postId={ postId }
                            setDisplayedLikes={ setLikes } commentId={ info.commentId } />
                        <button className="px-1">REPLY</button>
                        { userIsCommentAuthor && <button className="px-1">EDIT</button> }
                        { canDelete && 
                        <CommentDeleteButton postId={ postId } commentId={ info.commentId }
                            markDeleted={ () => setUserDeleted(true) } /> }
                        { canEndorse && 
                        <CommentEndorseButton postId={ postId } commentId={ info.commentId }
                            endorsed={ endorsed } setEndorsed={ setEndorsed } /> }
                        { canMarkAnswer && <button className="px-1">MARK AS ANSWER</button> }
                        { canMarkResolving && 
                        <CommentMarkResolvingButton postId={ postId }
                            commentInfo={ info } isResolving={ commentResolving }
                            setCommentResolving={ setCommentResolving }
                            setPostResolved={ setPostResolved } /> }
                    </div>}
                </div>
            </div>
        </>
    )
})

export default Comment