import PostControlPanel from "./PostControlPanel"
import PostHeader from "./PostHeader"

import { useState, useContext, useMemo } from 'react'
import { useCourse } from '../../../lib/hooks'
import { useRouter } from 'next/router'
import { 
    EditorContext, TimeContext 
} from '../../../pages/discussion/[courseId]'

import { useSWRConfig } from "swr"
import { sanitize } from "dompurify"
import { categoriesToLightRainbowHex } from '../../../lib/colors'

function PostContentSection(props) {
    const {
        content, resolved, answered, setContent, toggleMobilePostDisplay 
    } = props
    const router = useRouter()
    const { courseId } = router.query
    const Editor = useContext(EditorContext) // get editor component from context
    const initialLoadTime = useContext(TimeContext)
    const { mutate } = useSWRConfig()

    const [editing, setEditing] = useState(false)
    const { course } = useCourse(courseId)

    const categoriesToColors = useMemo(() => {
        // compute map of course categories to their display colors only
        // when course selected by user from dashboard changes
        if (!course?.categories) return {}
        return categoriesToLightRainbowHex(course.categories)
    }, [course])


    const handlePostEdit = async ({ editContent, displayContent }) => {
        // updates post content in backend on edit, then updates ui
        // if the backend update was successful
        const body = { 
            postId: parseInt(content.postId), 
            editContent, 
            displayContent: displayContent
        }

        let backendUpdateSuccessful, editedPostInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ content.postId }/content/editPost`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            backendUpdateSuccessful = resp.ok
            if (backendUpdateSuccessful) {
                const parsed = await resp.json()
                editedPostInfo = parsed.editedPostInfo
            }
        }
        catch (error) {
            console.error(error)
            backendUpdateSuccessful = false
        }

        if (backendUpdateSuccessful) {
            // updates postContext listings as well as post content (the actual post)
            // currently displayed to user
            handleSuccessfulEdit( 
                editedPostInfo, setContent, content, initialLoadTime, mutate)
        }
        setEditing(false)
        return backendUpdateSuccessful
    }

    return (
        <div data-testid="post-content-container" className="w-full font-thin">
            <PostHeader content={ content } 
                toggleMobilePostDisplay={ toggleMobilePostDisplay }
                catColor={ categoriesToColors[content.category] }
                resolved={ resolved } answered={ answered } />
            { !editing && 
            <PostControlPanel editPost={ () => setEditing(true) } 
                toggleMobilePostDisplay={ toggleMobilePostDisplay } /> }
            { editing ? 
            <div>
                <Editor editContent={ content.editContent } isPost editingPost 
                    handleSubmit={ handlePostEdit } 
                    hideEditor={ () => setEditing(false) } />
            </div> : 
            <section data-testid="post-display-content" 
                dangerouslySetInnerHTML={{ 
                    // sanitize user generated html, regardless of its origin
                    // (frontend -> backend or backend -> frontend)
                    __html: sanitize(content.displayContent) 
                }} 
                className="font-light mb-[30px]" /> }
        </div>
    )
}



const handleSuccessfulEdit = (editedPostInfo, setContent, content, initialLoadTime, mutate) => {
    // ensures postContext gets updated with edited info in case
    // user navigates to another post and then clicks on the edited
    // post listing again, with the aid of a few helpers

    const { 
        editContent: newEditContent, 
        displayContent: newDisplayContent,
    } = editedPostInfo
    editedPostInfo = {
        ...content,  
        editContent: newEditContent,
        displayContent: newDisplayContent
    }
    const specialPost = editedPostInfo.isAnnouncement || editedPostInfo.pinned
    // update the content (update the actual edited post content) displayed to user
    // and trigger a revalidation of the swr cache key pointing to the edited post
    setContent(specialPost ? editedPostInfo : editedPostInfo.postInfo)
    const { postId, authorId } = editedPostInfo
    mutate(`/api/course/postsInfo/${ postId }/content/postAndTopLevelComments/${ authorId }/1/${ initialLoadTime }`)
}

export default PostContentSection