import React, { useEffect, useState } from 'react'
import Comment from './Comment'
import ButtonLoading from '../../lib/ButtonLoading'
import { useMoreReplies } from '../../../lib/hooks'

const THREAD_ID_TOKEN_LENGTH = 5

// NOTE: threadIds have the form "xxxxx.xxxxx.xxxxx..."
// where each group of 5 x's is a zero-padded decimal number indicating the 
// position of a particular comment in a given nesting level beneath the 
// ancestor comment. See below example:

// "Hello, I'm John" (ancestor comment, threadId is null)
// ---"Hello John, I'm Terry" (threadId 00001)
// ------"Hello Terry, I'm Jim" (threadId 00001.00001)
// ---"Hello John, I'm Samantha" (threadId 00002)


// Thread component instances are passed the ancestor comment and <= 2 replies,
// and are responsible for loading more replies, if there are any.
const Thread = React.memo(function(props) {
    const {
        info, postIsQuestion, postId, setPostResolved, setPostAnswered 
    } = props
    const { ancestor: initAncestorInfo, descendants: initDescendantInfo } = info

    const [ancestorInfo, setAncestorInfo] = useState(initAncestorInfo)
    const [descendantsInfo, setDescendantsInfo] = useState(initDescendantInfo)
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadedAll, setLoadedAll] = useState(false)
    const [threadIdOffset] = useState(initDescendantInfo.length === 2 ?
        initDescendantInfo[1].threadId : null
    ) // holds the threadId of the second descendant comment for
      // paginated api calls to fetch more thread comments on 
      // 'view more replies' click
    const [apiPage, setApiPage] = useState(
        threadIdOffset && initDescendantInfo[1].loadMoreButtonBelow ? 0 : null
    ) // keeps track of latest loaded paginated replies (aka thread comments) api call


    const {
        replies: newReplies, loading: loadingMoreReplies, nextPage 
    } = useMoreReplies(postId, ancestorInfo.commentId, apiPage, threadIdOffset)


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

        // trigger next page of thread comments load from backend
        setApiPage(prev => prev + 1)
        setLoadingMore(true)
    }

    const calcNewThreadId = (repliedToThreadId) => {
        if (descendantsInfo.length === 0) {
            return "00001" // threadId of first reply to an ancestor comment
        }
        if (!repliedToThreadId) {
            repliedToThreadId = "" // makeshift threadId of ancestor comment
        }

        let newThreadIdLength = ( // +1 for token delimiter
            repliedToThreadId.length + THREAD_ID_TOKEN_LENGTH + 1) 
        if (repliedToThreadId === "") {
            // get rid of token delimiter if new comment parent is 
            // the ancestor comment
            newThreadIdLength-- 
        }

        const newCommentSiblingThreadIds = descendantsInfo.map(
            // get threadIds of the siblings of the new comment and sort them
            // in ascending order. The last threadId of the resulting array
            // will be used to easily determine the new threadId, because
            // we just need to increment its last token to get the new threadId
            info => info.threadId).filter(
                threadId => threadId.length === newThreadIdLength).sort()

        if (!newCommentSiblingThreadIds.length && !!repliedToThreadId) {
            return repliedToThreadId + ".00001"
        }

        const youngestOlderSibling = (
            newCommentSiblingThreadIds[newCommentSiblingThreadIds.length - 1])
        return incThreadId(youngestOlderSibling)
    }
    

    const showViewMoreRepliesButton = (apiPage !== null) && !loadedAll && !loadingMore
    const commentInfo = {
        postIsQuestion, postId, postAuthorId: info.postAuthorId
    }
    return (
        <div data-testid="thread-container" className="mb-6">
            <Comment isAncestor={ true } info={{ ...ancestorInfo, ...commentInfo }}
                key={ ancestorInfo.commentId } setPostResolved={ setPostResolved } 
                setPostAnswered={ setPostAnswered } 
                calcReplyThreadId={ calcNewThreadId } 
                descendantsInfo={ descendantsInfo } 
                setDescendantsInfo={ setDescendantsInfo } 
                setAncestor={ setAncestorInfo } ancestor={ ancestorInfo } />
            { descendantsInfo.map(descInfo => (
            <Comment isAncestor={ false } info={{ ...descInfo, ...commentInfo }}
                key={ descInfo.commentId } setPostResolved={ setPostResolved } 
                setPostAnswered={ setPostAnswered } 
                calcReplyThreadId={ calcNewThreadId } 
                descendantsInfo={ descendantsInfo } 
                setDescendantsInfo={ setDescendantsInfo } />))}
            { showViewMoreRepliesButton &&
            <button className="ml-[5%] text-sm text-white flex items-center italic
                justify-start pl-1 pr-2 hover:cursor-pointer w-max mt-2 
                hover:opacity-50" data-testid="view-more-replies-btn"
                onClick={ handleViewMoreRepliesClick }>
                <img src="/sort-down.png" width="10px" className='opacity-inherit' />
                <span className="pl-1">View more replies</span>
            </button>}
            { loadingMore && 
            <div className='w-full flex justify-center'><ButtonLoading /></div>}
        </div>
    )
})

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

export default Thread