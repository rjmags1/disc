import React from "react"

const ObservedPostInfo = React.forwardRef((props, ref) => (
    <div data-testid="observed-post-info-container" ref={ ref }
        className="w-full h-[72px] border-y border-gray-500 border-r">
        { props.info.postId }
        { props.children }
    </div>
))

export default ObservedPostInfo