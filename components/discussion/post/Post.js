import { useContext } from 'react'
import { PostContext } from '../../../pages/[courseId]/discussion'
import Loading from '../../lib/Loading'
import NoPostSelected from './NoPostSelected'

function Post() {
    const { currentPost } = useContext(PostContext)

    return (
        <div data-testid="post-container"
            className="hidden lg:flex w-full flex-auto bg-light-gray">
            { !currentPost && <NoPostSelected /> }
            { loadingPostContent && commentPage === 1 && <Loading />}
        </div>
    )
}

export default Post