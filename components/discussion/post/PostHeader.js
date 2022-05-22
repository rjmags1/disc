import Timestamp from "../postListingsPane/listingIcons/Timestamp"

function PostHeader({ content, resolved, answered, catColor }) {
    return (
        <header>
            <h3 data-testid="post-title" className="text-3xl font-medium mb-3">
                { content.title }
            </h3>
            <section className="flex justify-between my-2 mb-3 h-[55px] 
                whitespace-nowrap" data-testid="post-stats-bar">
                <div className="flex flex-none pr-4">
                    <img width="55" className="rounded-full"
                        src={ content.anonymous ? 
                            "/profile-button-img.png" : content.avatarUrl }/>
                    <div className="flex flex-col justify-center h-full">
                        <h4 className="ml-2.5 font-normal">
                            { content.anonymous ? 
                            "Anonymous" : content.author }
                        </h4>
                        <h5 className="text-xs py-1 font-extralight">
                            <Timestamp createdAt={ new Date(content.createdAt) }/>
                            <span className="-ml-1 mr-1.5">in</span>
                            <span style={{ color: catColor }} >
                                { content.category }
                            </span>
                        </h5>
                    </div>
                </div>
                <div className="flex text-xs h-full overflow-hidden font-normal">
                    { (resolved || answered) && 
                    <div className="h-full flex items-center my-0.5 mr-2">
                        <span className="text-base text-green-500 py-0.5
                            border border-green-500 rounded px-2" >
                            { answered ? "ANSWERED" : "RESOLVED" }
                        </span>
                    </div> }
                    <div className="flex flex-col justify-center 
                        items-center mx-2">
                        <h4 className="text-lg w-full text-center">
                            { content.views }
                        </h4>
                        <h6>views</h6>
                    </div>
                    <div className="flex flex-col justify-center 
                        items-center mx-2">
                        <h4 className="text-lg w-full text-center">
                            { content.likes }
                        </h4>
                        <h6>likes</h6>
                    </div>
                    <div className="flex flex-col justify-center 
                        items-center mx-2">
                        <h4 className="text-lg w-full text-center">
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