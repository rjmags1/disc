import PostInfo from "./PostInfo"
import React from "react"

const Announcements = React.memo(function({ announcementsInfo, catColors }) {
    return (
        <div data-testid="announcements-container">
            <h6 className="font-thin bg-zinc-900 p-1 border 
                border-l-0 border-gray-500">
                ANNOUNCEMENTS
            </h6>
            { announcementsInfo.map((postInfo) => (
                <PostInfo info={ postInfo } key={ postInfo.postId }
                categoryColor={ catColors[postInfo.category] } />
            ))}
        </div>
    )
})

export default Announcements