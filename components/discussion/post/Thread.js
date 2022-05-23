import React, { useEffect, useState } from 'react'
import Comment from './Comment'
import ButtonLoading from '../../lib/ButtonLoading'
import { useMoreReplies } from '../../../lib/hooks'

const THREAD_ID_TOKEN_LENGTH = 5


// threads are passed the ancestor comment and <= 2 replies, and
// are responsible for loading more replies if there are any
const Thread = React.memo(function(props) {
    const {
        info, postIsQuestion, postId, setPostResolved, setPostAnswered 
    } = props
    const { ancestor: initAncestorInfo, descendants: initDescendantInfo } = info

    const [ancestor, setAncestor] = useState(initAncestorInfo)
    const [descendantsInfo, setDescendantsInfo] = useState(initDescendantInfo)
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadedAll, setLoadedAll] = useState(false)
    const [threadIdOffset] = useState(initDescendantInfo.length === 2 ?
        initDescendantInfo[1].threadId : null)
    const [apiPage, setApiPage] = useState(
        threadIdOffset && initDescendantInfo[1].loadMoreButtonBelow ?
        0 : null)


    const {
        replies: newReplies, loading: loadingMoreReplies, nextPage 
    } = useMoreReplies( postId, ancestor.commentId, apiPage, threadIdOffset)

    useEffect(() => {
        // whenever we load more replies add them to descendantsInfo
        // so they get rendered
        if (loadingMoreReplies || !newReplies || apiPage < 1) return

        setDescendantsInfo([...descendantsInfo, ...newReplies])
        setLoadedAll(nextPage === null) 
        setLoadingMore(false)

    }, [loadingMoreReplies])

    const handleViewMoreRepliesClick = () => {
        if (loadingMore) return

        setApiPage(prev => prev + 1)
        setLoadingMore(true)
    }

    const calcNewThreadId = (repliedToThreadId) => {
        if (!repliedToThreadId) return "00001"

        const newThreadIdLength = ( // addnl 1 for token delim
            repliedToThreadId.length + THREAD_ID_TOKEN_LENGTH + 1) 
        const newCommentSiblingThreadIds = descendantsInfo.map(
            info => info.threadId).filter(
                threadId => threadId.length === newThreadIdLength).sort()

        if (!newCommentSiblingThreadIds.length) {
            return repliedToThreadId + ".00001"
        }

        const youngestOlderSibling = (
            newCommentSiblingThreadIds[newCommentSiblingThreadIds.length - 1])
        return incThreadId(youngestOlderSibling)
    }
    
    const showViewMore = (apiPage !== null) && !loadedAll && !loadingMore

    const commentInfo = {
        postIsQuestion, postId, postAuthorId: info.postAuthorId
    }
    
    return (
        <div data-testid="thread-container" className="mb-6">
            <Comment isAncestor={ true } info={{ ...ancestor, ...commentInfo }}
                key={ ancestor.commentId } setPostResolved={ setPostResolved } 
                setPostAnswered={ setPostAnswered } 
                calcReplyThreadId={ calcNewThreadId } 
                descendantsInfo={ descendantsInfo } 
                setDescendantsInfo={ setDescendantsInfo } 
                setAncestor={ setAncestor } ancestor={ ancestor } />
            { descendantsInfo.map(descInfo => (
                <Comment isAncestor={ false } info={{ ...descInfo, ...commentInfo }}
                    key={ descInfo.commentId } setPostResolved={ setPostResolved } 
                    setPostAnswered={ setPostAnswered } 
                    calcReplyThreadId={ calcNewThreadId } 
                    descendantsInfo={ descendantsInfo } 
                    setDescendantsInfo={ setDescendantsInfo } />))}
            { showViewMore &&
            <button className="ml-[5%] text-sm text-white flex items-center italic
                justify-start pl-1 pr-2 hover:cursor-pointer w-max mt-2 
                hover:opacity-50"
                onClick={ handleViewMoreRepliesClick }>
                <img src="/sort-down.png" width="10px" className='opacity-inherit' />
                <span className="pl-1">View more replies</span>
            </button>}
            { loadingMore && 
            <div className='w-full flex justify-center'><ButtonLoading /></div>}
        </div>
    )
})

export default Thread

const incThreadId = (threadId) => {
    const tokens = threadId.split('.')
    const lastToken = tokens[tokens.length - 1]
    const incLastToken = zeroPad(
        (parseInt(lastToken, 10) + 1).toString())
    tokens.pop()
    tokens.push(incLastToken)
    return tokens.join('.')
}

const zeroPad = (stringInt) => {
    const zeroes = new Array(
        5 - stringInt.length).fill('0').join('')
    return zeroes + stringInt
}