import PostInfo from "./PostInfo"
import React from "react"

const Pinned = React.memo(function({ pinnedPostsInfo, catColors }) {
    return (
        <div data-testid="pinned-posts-container">
            <h6 className="font-thin bg-zinc-900 p-1 border 
                border-l-0 border-gray-500">
                PINNED
            </h6>
            { pinnedPostsInfo.map((postInfo) => (
                <PostInfo info={ postInfo } key={ postInfo.postId }
                categoryColor={ catColors[postInfo.category] } />
            ))}
        </div>
    )
})

export default Pinned