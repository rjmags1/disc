import PostInfo from "./PostInfo"
import React from "react"
import { filterTest } from "../../../lib/filter"

const Pinned = React.memo(function(props) {
    const { pinnedPostsInfo, catColors, filters, user, setCurrentPost } = props
    const filtered = pinnedPostsInfo.filter(
        pinned => filterTest(pinned, user, filters))
        
    if (filtered.length === 0) return null
    return (
        <div data-testid="pinned-posts-container">
            <header>
                <h6 className="font-thin bg-zinc-900 p-1 border 
                    border-l-0 border-gray-500">
                    PINNED
                </h6>
            </header>
            <ul>
            { filtered.map((postInfo) => (
                <PostInfo info={ postInfo } key={ postInfo.postId }
                categoryColor={ catColors[postInfo.category] } 
                setCurrentPost={ setCurrentPost } />
            ))}
            </ul>
        </div>
    )
})

export default Pinned