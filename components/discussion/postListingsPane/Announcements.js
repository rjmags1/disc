import PostInfo from "./PostInfo"
import React from "react"
import { filterTest } from "../../../lib/filter"

const Announcements = React.memo(function(props) {
    const { announcementsInfo, catColors, filters, user, setCurrentPost } = props
    const filtered = announcementsInfo.filter(
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
                setCurrentPost={ setCurrentPost } />
            ))}
            </ul>
        </div>
    )
})

export default Announcements