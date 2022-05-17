import { useContext } from 'react'
import { useUser } from '../../../lib/hooks'
import { PostContext } from '../../../pages/[courseId]/discussion'
import DeleteButton from './controlPanelButtons/DeleteButton'
import EndorseButton from './controlPanelButtons/EndorseButton'
import LikeButton from './controlPanelButtons/LikeButton'
import StarButton from './controlPanelButtons/StarButton'
import WatchButton from './controlPanelButtons/WatchButton'

function PostControlPanel() {
    const { currentPost } = useContext(PostContext)

    const { user } = useUser()
    const userId = user.user_id
    const canEndorse = user.is_admin || user.is_staff || user.is_instructor
    const canDelete = user.is_admin || userId === currentPost.authorId

    return (
        <section data-testid="post-control-panel-container" 
            className="w-max flex mb-3 gap-[3%]">
            <LikeButton liked={ currentPost.liked } />
            <WatchButton watched={ currentPost.watched }/>
            <StarButton starred={ currentPost.starred } />
            { canEndorse && <EndorseButton endorsed={ currentPost.endorsed } /> }
            { canDelete && !currentPost.deleted && <DeleteButton /> }
        </section>
    )
}

export default PostControlPanel