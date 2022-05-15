import Timestamp from "../postListingsPane/listingIcons/Timestamp"

function PostContentSection({ content }) {
    // fetch views and add 
    const views = 100
    return (
        <div data-testid="post-content-container" className="w-full font-thin">
            <header>
                <h3 data-testid="post-title" className="text-3xl font-medium">
                    { content.title }
                </h3>
                <section className="flex justify-between my-4 h-[55px] whitespace-nowrap" 
                    data-testid="post-stats-bar">
                    <div className="flex flex-none pr-4">
                        <img src={ content.anonymous ? "/profile-button-img.png" : content.avatarUrl } width="55" className="rounded-full"/>
                        <div className="flex flex-col justify-center h-full">
                            <h4 className="ml-2.5 font-normal">{ content.anonymous ? "Anonymous" : content.author }</h4>
                            <h5 className="text-xs py-1">
                                <Timestamp createdAt={ new Date(content.createdAt) }/>
                                <span className="-ml-1">in { content.category }</span>
                            </h5>
                        </div>
                    </div>
                    <div className="flex text-xs h-full overflow-hidden font-normal">
                        <div className="flex flex-col justify-center items-center mx-2">
                            <h4 className="text-lg w-full text-center">{ views }</h4><h6>views</h6>
                        </div>
                        <div className="flex flex-col justify-center items-center mx-2">
                            <h4 className="text-lg w-full text-center">{ content.likes }</h4><h6>likes</h6>
                        </div>
                        <div className="flex flex-col justify-center items-center mx-2">
                            <h4 className="text-lg w-full text-center">{ content.comments }</h4><h6>comments</h6>
                        </div>
                    </div>
                </section>
            </header>
            <section data-testid="post-display-content" 
                dangerouslySetInnerHTML={{ __html: content.displayContent }} 
                className="font-light" />
        </div>
    )
}

export default PostContentSection