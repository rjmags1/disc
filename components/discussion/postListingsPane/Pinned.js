import PostInfo from "./PostInfo"
import React, { useContext } from "react"
import { filterTest } from "../../../lib/filter"
import { PostListingsContext } from "../../../pages/[courseId]/discussion"

const Pinned = React.memo(function(props) {
    const { catColors, filters, user, setCurrentPost, toggleMobilePostDisplay } = props
    const { specialListings: { pinned } } = useContext(PostListingsContext)
    const idSet = new Set()
    const filtered = pinned.filter(l => {
        const alreadyAdded = idSet.has(l.postId)
        idSet.add(l.postId)
        return !alreadyAdded
    }).filter(
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
                setCurrentPost={ setCurrentPost } 
                toggleMobilePostDisplay={ toggleMobilePostDisplay } />
            ))}
            </ul>
        </div>
    )
})

export default Pinned