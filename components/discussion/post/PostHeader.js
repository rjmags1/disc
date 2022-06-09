import { 
    LARGE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT 
} from "../../../lib/layout"
import Timestamp from "../postListingsPane/listingIcons/Timestamp"

function PostHeader({
    content, resolved, answered, catColor, toggleMobilePostDisplay }) {
    return (
        <header>
            <div className="flex justify-between mb-3 flex-col">
                { window.innerWidth < LARGE_MEDIA_BREAKPOINT && 
                <button className="rounded bg-purple border border-white px-2 
                    h-fit w-fit mb-2 hover:bg-violet-800" data-testid="post-back-btn"
                    onClick={ toggleMobilePostDisplay }>
                    { "< Back" }
                </button> }
                <h3 data-testid="post-title" className="text-3xl font-medium">
                    { content.title }
                </h3>
            </div>
            <section className="flex justify-between my-2 mb-3 h-fit 
                whitespace-nowrap" data-testid="post-stats-bar"
                style={ window.innerWidth < SMALL_MEDIA_BREAKPOINT ?
                    { flexDirection: "column"  } : {} }>
                <div className="flex flex-none pr-4 items-center">
                    <img width="55" className="rounded-full"
                        data-testid="post-author-avatar-img"
                        src={ content.anonymous ? 
                            "/profile-button-img.png" : content.avatarUrl }/>
                    <div className="flex flex-col justify-center h-full">
                        <h4 className="ml-2.5 font-normal" 
                            data-testid="post-author-header">
                            { content.anonymous ? 
                            "Anonymous" : content.author }
                        </h4>
                        <h5 className="text-xs py-1 font-extralight">
                            <Timestamp createdAt={ new Date(content.createdAt) }/>
                            <span className="-ml-1 mr-1.5">in</span>
                            <span style={{ color: catColor }} 
                                data-testid="post-category">
                                { content.category }
                            </span>
                        </h5>
                    </div>
                </div>
                <div className="flex text-xs h-full overflow-hidden 
                    font-normal items-center" style={ 
                        window.innerWidth < SMALL_MEDIA_BREAKPOINT ?
                        { marginTop: '2%'} : {}}>
                    { (resolved || answered) && 
                    <div className="h-full flex items-center my-0.5 mr-2">
                        <span className="text-base text-green-500 py-0.5
                            border border-green-500 rounded px-2" >
                            { answered ? "ANSWERED" : "RESOLVED" }
                        </span>
                    </div> }
                    <div className="flex flex-col justify-center 
                        items-center mx-2 h-full" data-testid="post-views" style={ 
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { flexDirection: "row", gap: '5px' } : {}}>
                        <h4 className="text-lg w-full text-center" style={
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { fontSize: 'medium' } : {}}>
                            { content.views }
                        </h4>
                        <h6>views</h6>
                    </div>
                    <div className="flex flex-col justify-center 
                        items-center mx-2 h-full" data-testid="post-likes" style={ 
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { flexDirection: "row", gap: '5px' } : {}}>
                        <h4 className="text-lg w-full text-center" style={
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { fontSize: 'medium' } : {}}>
                            { content.likes }
                        </h4>
                        <h6>likes</h6>
                    </div>
                    <div className="flex flex-col justify-center 
                        items-center mx-2" data-testid="post-comments" style={ 
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { flexDirection: "row", gap: '5px' } : {}}>
                        <h4 className="text-lg w-full text-center" style={
                            window.innerWidth < SMALL_MEDIA_BREAKPOINT ? 
                            { fontSize: 'medium' } : {}}>
                            { content.comments }
                        </h4>
                        <h6>comments</h6>
                    </div>
                </div>
            </section>
        </header>
    )
}

export default PostHeader