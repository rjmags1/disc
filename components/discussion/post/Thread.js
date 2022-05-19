import React, { useEffect, useState } from 'react'
import Comment from './Comment'
import ButtonLoading from '../../lib/ButtonLoading'
import { useMoreReplies } from '../../../lib/hooks'

const Thread = React.memo(function({ info, postIsQuestion, postId, setPostResolved, setPostAnswered }) {
    const { ancestor: ancestorInfo, descendants: initDescendantInfo } = info
    //console.log(ancestorInfo, initDescendantInfo)

    const [descendantsInfo, setDescendantsInfo] = useState(initDescendantInfo)
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadedAll, setLoadedAll] = useState(false)
    const [threadIdOffset] = useState(initDescendantInfo.length === 2 ?
        initDescendantInfo[1].threadId : null)
    const [apiPage, setApiPage] = useState(
        threadIdOffset && initDescendantInfo[1].loadMoreButtonBelow ?
        0 : null)

    const { replies: newReplies, loading: loadingMoreReplies, nextPage } = useMoreReplies(
        postId, ancestorInfo.commentId, apiPage, threadIdOffset)

    useEffect(() => {
        if (loadingMoreReplies || !newReplies || apiPage < 1) return

        setDescendantsInfo([...descendantsInfo, ...newReplies])
        setLoadedAll(nextPage === null) 
        setLoadingMore(false)

    }, [loadingMoreReplies])

    const handleClick = () => {
        if (loadingMore) return

        setApiPage(prev => prev + 1)
        setLoadingMore(true)
    }
    
    const showViewMore = (apiPage !== null) && !loadedAll && !loadingMore
    
    return (
        <div data-testid="thread-container" className="mb-6">
            <Comment isAncestor={ true } info={ { ...ancestorInfo, postIsQuestion, postId, postAuthorId: info.postAuthorId } } 
                key={ ancestorInfo.commentId } setPostResolved={ setPostResolved } setPostAnswered={ setPostAnswered } />
            { descendantsInfo.map(descInfo => (
                <Comment isAncestor={ false } info={ { ...descInfo, postIsQuestion, postId, postAuthorId: info.postAuthorId } } 
                    key={ descInfo.commentId } setPostResolved={ setPostResolved } setPostAnswered={ setPostAnswered } />))}
            { showViewMore &&
            <button className="ml-[5%] text-sm text-white flex items-center italic
                justify-start pl-1 pr-2 hover:cursor-pointer w-max mt-2 hover:opacity-50"
                onClick={ handleClick }>
                <img src="/sort-down.png" width="10px" className='opacity-inherit' />
                <span className="pl-1">View more replies</span>
            </button>}
            { loadingMore && 
            <div className='w-full flex justify-center'><ButtonLoading /></div>}
        </div>
    )
})

export default Thread