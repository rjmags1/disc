import PostInfo from "./PostInfo"
import React from "react"
import { filterTest } from "../../lib/filter"

const Announcements = React.memo(function(props) {
    const { announcementsInfo, catColors, filters, user } = props
    const filtered = announcementsInfo.filter(
        ann => filterTest(ann, user, filters))
    return (
        <div data-testid="announcements-container">
            <h6 className="font-thin bg-zinc-900 p-1 border 
                border-l-0 border-gray-500">
                ANNOUNCEMENTS
            </h6>
            { filtered.map((postInfo) => (
                <PostInfo info={ postInfo } key={ postInfo.postId }
                categoryColor={ catColors[postInfo.category] } />
            ))}
        </div>
    )
})

export default Announcements