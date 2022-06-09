import { useContext } from 'react'
import { useUser } from '../../../lib/hooks'
import { PostContext } from '../../../pages/[courseId]/discussion'
import DeleteButton from './controlPanelButtons/DeleteButton'
import EndorseButton from './controlPanelButtons/EndorseButton'
import LikeButton from './controlPanelButtons/LikeButton'
import StarButton from './controlPanelButtons/StarButton'
import WatchButton from './controlPanelButtons/WatchButton'
import EditButton from './controlPanelButtons/EditButton'

function PostControlPanel({ editPost, toggleMobilePostDisplay }) {
    const { currentPost } = useContext(PostContext)

    const { user } = useUser()
    const userId = user.user_id
    const userIsAuthor = userId === currentPost.authorId
    const canEndorse = user.is_admin || user.is_staff || user.is_instructor
    const canDelete = userIsAuthor || user.is_admin 

    return (
        <section data-testid="post-control-panel-container" 
            className="w-full flex flex-wrap sm:flex-nowrap 
                gap-[1%] h-[60px]">
            <LikeButton liked={ currentPost.liked } />
            <WatchButton watched={ currentPost.watched }/>
            { userIsAuthor && <EditButton editPost={ editPost } /> }
            <StarButton starred={ currentPost.starred } />
            { canEndorse && <EndorseButton endorsed={ currentPost.endorsed } /> }
            { canDelete && !currentPost.deleted && 
            <DeleteButton toggleMobilePostDisplay={ toggleMobilePostDisplay } /> }
        </section>
    )
}

export default PostControlPanel