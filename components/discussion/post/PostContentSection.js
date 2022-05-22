import { useState, useContext, useMemo } from 'react'
import Timestamp from "../postListingsPane/listingIcons/Timestamp"
import PostControlPanel from "./PostControlPanel"
import { 
    EditorContext, PostListingsContext 
} from '../../../pages/[courseId]/discussion'
import { LIGHT_RAINBOW_HEX } from '../../../lib/colors'
import { useCourse } from '../../../lib/hooks'
import { useRouter } from 'next/router'

function PostContentSection({ content, resolved, answered, setContent }) {
    const router = useRouter()
    const { courseId } = router.query
    const Editor = useContext(EditorContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)

    const [editing, setEditing] = useState(false)
    // fetch views and add 
    const views = 100
    const { course } = useCourse(courseId)

    const categoriesToLightRainbowHex = useMemo(() => {
        if (!course?.categories) return null

        const mapped = {}
        const { categories } = course
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i]
            mapped[category] = LIGHT_RAINBOW_HEX[i % LIGHT_RAINBOW_HEX.length]
        }
        return mapped
    }, [course])
    
    const handlePostEdit = async ({ editContent, displayContent }) => {
        const body = { 
            postId: parseInt(content.postId), editContent, displayContent }

        let submitSuccessful, editedPostInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ content.postId }/content/editPost`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            submitSuccessful = resp.ok
            if (submitSuccessful) {
                const parsed = await resp.json()
                editedPostInfo = parsed.editedPostInfo
            }
        }
        catch (error) {
            console.error(error)
            submitSuccessful = false
        }

        if (submitSuccessful) {
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
                editedPostInfo.isAnnouncement || editedPostInfo.isPinned)
            const editedPostListingIdx = getEditedIdx(
                specialPost ? specialListings : postListings, 
                editedPostId, 
                specialPost
            )

            if (specialPost) {
                setSpecialListings(
                    editedPostInfo.isPinned ? {
                        ...specialListings,
                        pinned: [
                            ...specialListings.pinned.slice(0, editedPostListingIdx),
                            editedPostInfo,
                            ...specialListings.pinned.slice(editedPostListingIdx + 1)
                        ]
                    } : {
                        ...specialListings, 
                        announcements: [
                            ...specialListings.announcements.slice(0, editedPostListingIdx),
                            editedPostInfo,
                            ...specialListings.announcements.slice(editedPostListingIdx + 1)
                        ]
                    } 
                )
            }
            else {
                const catColor = categoriesToLightRainbowHex[content.category]
                editedPostInfo = { postInfo: editedPostInfo, catColor }
                setPostListings([
                    ...postListings.slice(0, editedPostListingIdx),
                    editedPostInfo,
                    ...postListings.slice(editedPostListingIdx + 1)
                ])
            }

            setContent(specialPost ? editedPostInfo.postId : editedPostInfo.postInfo)
        }

        setEditing(false)
        return submitSuccessful
    }

    return (
        <div data-testid="post-content-container" className="w-full font-thin">
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
                            <h5 className="text-xs py-1">
                                <Timestamp 
                                createdAt={ new Date(content.createdAt) }/>
                                <span className="-ml-1">
                                    in { content.category }
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
                                { views }
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

const getEditedIdx = (listings, postId, special) => {
    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i]
        const listingPostId = special ? listing.postId : listing.postInfo.postId
        if (listingPostId === postId) return i
    }
    throw new Error()
}

export default PostContentSection