import React from "react"
import PostInfo from "./PostInfo"

const ObservedPostInfo = React.forwardRef((props, ref) => (
    <div data-testid="observe-post-info-container" ref={ ref } >
        <PostInfo info={ props.info } categoryColor={ props.categoryColor } />
    </div>
))

export default ObservedPostInfo