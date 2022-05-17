import React, { useState } from 'react'
import Comment from './Comment'

const Thread = React.memo(function({ info }) {
    const { ancestor: ancestorInfo, descendants: initDescendantInfo } = info

    const [descendantsInfo, setDescendantsInfo] = useState(initDescendantInfo)
    const [threadIdOffset] = useState(initDescendantInfo.length === 2 ?
        initDescendantInfo[1].threadId : null)
    const [apiPage, setApiPage] = useState(
        threadIdOffset && initDescendantInfo[1].loadMoreButtonBelow ?
        1 : null)
    
    return (
        <div data-testid="thread-container" className="pb-2 mb-2">
            <Comment isAncestor={ true } info={ ancestorInfo } 
                key={ ancestorInfo.commentId } />
            { descendantsInfo.map(descInfo => (
                <Comment isAncestor={ false } info={ descInfo } 
                    key={ descInfo.commentId } />))}
            { apiPage !== null && 
            <p className="ml-[5%] text-sm text-white flex items-center
                justify-start bg-purple rounded pl-1 pr-2 hover:cursor-pointer
                border border-white w-max hover:bg-violet-700 mt-2">
                <img src="/sort-down.png" width="10px" />
                <span className="pl-1">View more replies</span>
            </p> }
        </div>
    )
})

export default Thread