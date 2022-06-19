import PostInfo from "./PostInfo"
import React, { useContext } from "react"
import { filterTest } from "../../../lib/filter"
import { PostListingsContext } from "../../../pages/discussion/[courseId]"

const Announcements = React.memo(function(props) {
    const { catColors, filters, user, setCurrentPost, toggleMobilePostDisplay } = props
    const { specialListings: { announcements } } = useContext(PostListingsContext)
    const idSet = new Set()
    const filtered = announcements.filter(l => {
        const alreadyAdded = idSet.has(l.postId)
        idSet.add(l.postId)
        return !alreadyAdded
    }).filter(
        ann => filterTest(ann, user, filters))
        
    if (filtered.length === 0) return null
    return (
        <div data-testid="announcements-container">
            <header>
                <h6 className="font-thin bg-zinc-900 p-1 border 
                    border-l-0 border-gray-500">
                    ANNOUNCEMENTS
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

export default Announcements