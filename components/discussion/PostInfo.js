import React from "react"

const PostInfo = React.memo(function ({ info }) {
    return (
        <div data-testid="post-info-container"
            className="w-full h-[72px] border-y border-gray-500 border-r">
            { info.postId }
        </div>
    )
})

export default PostInfo