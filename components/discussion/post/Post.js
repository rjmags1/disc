import { useContext, useState } from 'react'
import { PostContext, TimeContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'
import { usePostContent } from '../../../lib/hooks'

function Post() {
    const [apiPage, setApiPage] = useState(1)
    const { currentPost } = useContext(PostContext)
    const initialLoadTime = useContext(TimeContext)

    const postContent = usePostContent(
        currentPost?.postId, currentPost?.authorId, apiPage, initialLoadTime)

    return (
        <div data-testid="post-container"
            className="hidden lg:flex w-full flex-auto bg-light-gray">
            { !currentPost && <NoPostSelected /> }
        </div>
    )
}

export default Post