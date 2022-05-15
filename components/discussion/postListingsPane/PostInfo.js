import React, { useContext } from "react"
import QuestionMark from "./listingIcons/QuestionMark"
import Announcement from "./listingIcons/Announcement"
import Watching from "./listingIcons/Watching"
import Star from "./listingIcons/Star"
import Endorsed from "./listingIcons/Endorsed"
import Pinned from "./listingIcons/Pinned"
import Checkmark from "./listingIcons/Checkmark"
import Hearts from "./listingIcons/Hearts"
import Comments from "./listingIcons/Comments"
import RegularPost from "./listingIcons/RegularPost"
import PrivateBanner from "./listingIcons/PrivateBanner"
import StaffBanner from "./listingIcons/StaffBanner"
import CategoryLabel from "./listingIcons/CategoryLabel"
import Timestamp from "./listingIcons/Timestamp"
import UnreadDot from "./listingIcons/UnreadDot"
import { PostContext } from "../../../pages/[courseId]/discussion"


const PostInfo = React.memo(function ({ info, categoryColor }) {
    const { setCurrentPost } = useContext(PostContext)

    const unreadDot = !info.lastViewedAt || 
        Date.parse(info.mostRecentCommentTime) > Date.parse(info.lastViewedAt)

    return (
        <li data-testid="post-info-container" 
            onClick={ () => setCurrentPost(info) }
            className="w-full h-[90px] border-y border-gray-500 
                border-r flex flex-col p-2 justify-between hover:cursor-pointer">
            <div className="flex justify-between">
                <div className="flex justify-center items-center">
                    { unreadDot ? <UnreadDot /> : null}
                    { info.isQuestion ? <QuestionMark /> : <RegularPost /> }
                    { info.pinned && <Pinned /> }
                    { info.isAnnouncement && <Announcement /> }
                </div>
                <div className="flex h-[20px]">
                    { info.watched && <Watching /> }
                    { info.starred && <Star /> }
                    { info.endorsed && <Endorsed /> }
                    { (info.answered || info.resolved) &&  <Checkmark /> }
                    <div className="-mr-2"/>
                </div>
            </div>
            <span className="py-1 w-full truncate text-sm font-extralight">
                { info.title }
            </span>
            <div className="flex justify-between">
                <span className="w-full truncate text-xs font-extralight
                    py-1 flex justify-start items-center">
                    { info.private && <PrivateBanner /> }
                    <CategoryLabel category={ info.category } 
                        color={ categoryColor } />
                    <span className="w-min truncate">{ info.anonymous ? "Anonymous" : info.author }</span>
                    { !info.anonymous && info.authorIsStaffOrInstructor && <StaffBanner /> }
                    <Timestamp createdAt={ new Date(info.createdAt) } />
                </span>
                <div className="flex items-center justify-end 
                    flex-none w-fit pl-1 overflow-hidden mr-1">
                    { info.likes > 0 && <Hearts numHearts={ info.likes } /> }
                    { info.comments > 0 && 
                    <Comments numComments={ info.comments } /> }
                </div>
            </div>
        </li>
    )
})

export default PostInfo