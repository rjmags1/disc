import PostControlPanel from "./PostControlPanel"
import PostHeader from "./PostHeader"

import { useState, useContext, useMemo } from 'react'
import { useCourse } from '../../../lib/hooks'
import { useRouter } from 'next/router'
import { 
    EditorContext, PostListingsContext 
} from '../../../pages/[courseId]/discussion'

import { categoriesToLightRainbowHex } from '../../../lib/colors'

function PostContentSection({ 
    content, resolved, answered, setContent, toggleMobilePostDisplay }) {
    const router = useRouter()
    const { courseId } = router.query
    const Editor = useContext(EditorContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)


    const [editing, setEditing] = useState(false)
    const { course } = useCourse(courseId)

    const categoriesToColors = useMemo(() => {
        if (!course?.categories) return {}
        return categoriesToLightRainbowHex(course.categories)
    }, [course])


    const handlePostEdit = async ({ editContent, displayContent }) => {
        const body = { 
            postId: parseInt(content.postId), editContent, displayContent }

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
            handleSuccessfulEdit(
                editedPostInfo, setSpecialListings, setPostListings, setContent,
                postListings, specialListings, categoriesToColors, content)
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
            <PostControlPanel editPost={ () => setEditing(true) } /> }
            { editing ? 
            <div>
                <Editor editContent={ content.editContent } isPost editingPost 
                    handleSubmit={ handlePostEdit } 
                    hideEditor={ () => setEditing(false) } />
            </div> : 
            <section data-testid="post-display-content" 
                dangerouslySetInnerHTML={{ __html: content.displayContent }} 
                className="font-light my-8" /> }
        </div>
    )
}



const handleSuccessfulEdit = (
    editedPostInfo, setSpecialListings, setPostListings, setContent,
    postListings, specialListings, categoriesToColors, content) => {

    const { 
        editContent: newEditContent, 
        displayContent: newDisplayContent,
        postId: editedPostId
    } = editedPostInfo

    editedPostInfo = {
        ...content,  
        editContent: newEditContent,
        displayContent: newDisplayContent
    }

    const specialPost = (
        editedPostInfo.isAnnouncement || editedPostInfo.pinned)
    const specialTypes = editedPostInfo.isAnnouncement ? 
        specialListings.announcements : specialListings.pinned
    const editedIdx = getEditedIdx(
        specialPost ? specialTypes : postListings, editedPostId, specialPost)

    if (specialPost) {
        setSpecialListings(
            editedPostInfo.isPinned ? {
                ...specialListings,
                pinned: listingReplaced(
                    specialListings.pinned, editedIdx, editedPostInfo)
            } : {
                ...specialListings, 
                announcements: listingReplaced(
                    specialListings.announcements, editedIdx, editedPostInfo)
            } 
        )
    }
    else {
        const catColor = categoriesToColors[content.category]
        editedPostInfo = { postInfo: editedPostInfo, catColor }
        setPostListings(
            listingReplaced(postListings, editedIdx, editedPostInfo))
    }

    setContent(specialPost ? editedPostInfo : editedPostInfo.postInfo)
}

const listingReplaced = (listings, idx, newListing) => {
    return [
        ...listings.slice(0, idx), 
        newListing, 
        ...listings.slice(idx + 1)
    ]
}

const getEditedIdx = (listings, postId, special) => {
    console.log(listings, postId, special)
    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i]
        const listingPostId = special ? listing.postId : listing.postInfo.postId
        if (listingPostId === postId) return i
    }
    throw new Error()
}

export default PostContentSection