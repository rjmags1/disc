import React, { useState } from 'react'
import Timestamp from '../postListingsPane/listingIcons/Timestamp'

const Comment = React.memo(function({ info, isAncestor }) {
    const [depth] = useState(isAncestor ? 0 : info.threadId.split('.').length)

    return (
        <>
            { !isAncestor && <div className="mt-1" /> }
            <div data-testid="comment-box-container" 
                className="w-full flex items-start justify-start py-2"
                style={{ paddingLeft: `${ depth * 5 }%`}} >
                <img width="40" className="rounded-full" src={ 
                        info.anonymous || info.deleted ? 
                        "/profile-button-img.png" : info.avatarUrl }/>
                <div data-testid="comment-content-container" 
                    className="pl-2 -mt-0.5 w-full flex-col items-start 
                        justify-start text-sm font-thin">
                    <h6 data-testid="comment-header">
                        <span className="font-light">
                            { info.deleted ? "anonymous" : info.author }
                        </span>
                        <Timestamp createdAt={ new Date(info.createdAt) }/>
                    </h6> 
                    { info.deleted ? 
                    <span className="font-light">deleted</span> 
                    :
                    <div data-testid="comment-container" className="font-light" 
                        dangerouslySetInnerHTML={{ __html: info.displayContent }}/>
                    }
                </div>
            </div>
        </>
    )
})

export default Comment