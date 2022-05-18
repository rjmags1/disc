import React, { useState } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'
import { useUser } from '../../../lib/hooks'
import CommentLikeButton from './commentButtons/CommentLikeButton'
import CommentDeleteButton from './commentButtons/CommentDeleteButton'

const Comment = React.memo(function({ info, isAncestor, postId }) {
    const [depth] = useState(isAncestor ? 0 : info.threadId.split('.').length)
    const [userDeleted, setUserDeleted] = useState(info.deleted) 
    const [likes, setLikes] = useState(parseInt(info.likes))
    const { user } = useUser()
    const userId = user.user_id
    const userIsAuthor = userId === info.authorId
    const canDelete = userIsAuthor || user.is_admin
    const canEndorse = user.is_staff || user.is_instructor
    const canMarkAnswer = userIsAuthor && info.postIsQuestion
    const canMarkResolving = userIsAuthor && !info.postIsQuestion


    return (
        <>
            { !isAncestor && <div className="mt-4" /> }
            <div data-testid="comment-box-container" 
                className="w-full flex items-start justify-start py-2"
                style={{ paddingLeft: `${ depth * 5 }%`}} >
                <img width="40" className="rounded-full" src={ 
                        info.anonymous || userDeleted ? 
                        "/profile-button-img.png" : info.avatarUrl }/>
                <div data-testid="comment-content-container" 
                    className="pl-2 -mt-0.5 w-full flex-col items-start 
                        justify-start text-sm font-thin">
                    <h6 data-testid="comment-header">
                        <span className="font-light">
                            { userDeleted ? "anonymous" : info.author }
                        </span>
                        <Timestamp createdAt={ new Date(info.createdAt) }/>
                    </h6> 
                    { userDeleted ? 
                    <span className="font-light">deleted</span> 
                    :
                    <div data-testid="comment-container" className="font-light" 
                        dangerouslySetInnerHTML={{ __html: info.displayContent }}/>
                    }
                    { !userDeleted && 
                    <div className="mt-2 flex h-[12px] items-center text-xs
                        font-normal opacity-50">
                        <span className="mr-0.5">{ likes }</span>
                        <img src="/heart.png" width="11" className="mt-0.5 mr-1"/>
                        <CommentLikeButton initialLiked={ info.liked } postId={ postId }
                            setDisplayedLikes={ setLikes } commentId={ info.commentId } />
                        <button className="px-1">REPLY</button>
                        { userIsAuthor && <button className="px-1">EDIT</button> }
                        { canDelete && 
                        <CommentDeleteButton postId={ postId } commentId={ info.commentId }
                            markDeleted={ () => setUserDeleted(true) } /> }
                        { canEndorse && <button className="px-1">ENDORSE</button> }
                        { canMarkAnswer && <button className="px-1">MARK AS ANSWER</button> }
                        { canMarkResolving && <button className="px-1">MARK AS RESOLVING</button> }
                    </div>}
                </div>
            </div>
        </>
    )
})

export default Comment