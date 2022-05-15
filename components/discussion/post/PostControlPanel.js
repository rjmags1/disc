import { useContext } from 'react'
import { PostContext } from '../../../pages/[courseId]/discussion'
import LikeButton from './controlPanelButtons/LikeButton'
import StarButton from './controlPanelButtons/StarButton'
import WatchButton from './controlPanelButtons/WatchButton'

function PostControlPanel() {
    const { currentPost } = useContext(PostContext)

    return (
        <section data-testid="post-control-panel-container" 
            className="w-full flex flex-col">
            <div data-testid="like-watch-star-container" 
                className="flex w-full justify-between">
                <LikeButton liked={ currentPost.liked } />
                <WatchButton watched={ currentPost.watched }/>
                <StarButton starred={ currentPost.starred } />
            </div>
            <div data-testid="privileged-interactions-container"></div>
            <div data-testid="comment-container"></div>
        </section>
    )
}

export default PostControlPanel