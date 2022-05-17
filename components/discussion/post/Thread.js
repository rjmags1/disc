import React, { useState } from 'react'
import Comment from './Comment'

const Thread = React.memo(function({ info }) {
    const { ancestor: ancestorInfo, descendants: initDescendantInfo } = info
    console.log(initDescendantInfo.length)

    const [descendantsInfo, setDescendantsInfo] = useState(initDescendantInfo)
    const [threadIdOffset] = useState(initDescendantInfo.length === 2 ?
        initDescendantInfo[1].threadId : null)
    const [apiPage, setApiPage] = useState(
        threadIdOffset && initDescendantInfo[1].loadMoreButtonBelow ?
        1 : null)
    
    return (
        <div data-testid="thread-container" className="mb-6">
            <Comment isAncestor={ true } info={ ancestorInfo } 
                key={ ancestorInfo.commentId } />
            { descendantsInfo.map(descInfo => (
                <Comment isAncestor={ false } info={ descInfo } 
                    key={ descInfo.commentId } />))}
            { apiPage !== null && 
            <button className="ml-[5%] text-sm text-white flex items-center italic
                justify-start pl-1 pr-2 hover:cursor-pointer w-max mt-2 hover:opacity-50">
                <img src="/sort-down.png" width="10px" className='opacity-inherit' />
                <span className="pl-1">View more replies</span>
            </button>}
        </div>
    )
})

export default Thread