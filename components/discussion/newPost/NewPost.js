import { useContext, useState, useMemo } from 'react'
import { EditorContext, PostListingsContext } from '../../../pages/[courseId]/discussion'
import { useCourse, useUser } from '../../../lib/hooks'
import { useRouter } from 'next/router'
import { categoriesToLightRainbowHex } from '../../../lib/colors'
import PostBooleanAttribute from './PostBooleanAttribute'

function NewPost({ exitNewPost }) {
    const router = useRouter()
    const { courseId } = router.query
    const Editor = useContext(EditorContext)
    const {
        postListings, setPostListings, specialListings, setSpecialListings
    } = useContext(PostListingsContext)

    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("General")
    const [isQuestion, setIsQuestion] = useState(false)
    const [isAnnouncement, setIsAnnouncement] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)

    const { user } = useUser()
    const { course, loading: loadingCourse } = useCourse(courseId)

    const canMarkAnnouncementOrPinned = (
        user.is_instructor || user.is_staff || user.is_admin)
    const categories = loadingCourse ? [] : course.categories

    const categoriesToColors = useMemo(() => {
        if (!course?.categories) return {}
        return categoriesToLightRainbowHex(course.categories)
    }, [course])

    const handleNewPostSubmit = async (editorInfo) => {
        const { editContent, displayContent } = editorInfo
        const body = {
            title, category, isQuestion, isAnnouncement, displayContent,
            isPrivate, isPinned, isAnonymous, editContent, 
            courseId: parseInt(courseId),
            createdAt: new Date(Date.now()).toUTCString(),
        }
        let backendUpdateSuccessful, newPostInfo
        try {
            const resp = await fetch(
                `/api/course/postsInfo/null/content/newPost`, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' }
                }
            )
            backendUpdateSuccessful = resp.ok
            if (backendUpdateSuccessful) {
                const parsed = await resp.json()
                newPostInfo = parsed.newPostInfo
            }
        }
        catch (error) {
            console.error(error)
            backendUpdateSuccessful = false
        }
        if (backendUpdateSuccessful) {
            handleBackendUpdateSuccess(newPostInfo, setSpecialListings, 
                setPostListings, specialListings, postListings, 
                categoriesToColors, exitNewPost)
        }

        return backendUpdateSuccessful
    }

    return (
        <div data-testid="new-post-container" 
            className="w-full h-full bg-light-gray p-[8%] overflow-x-hidden">
            <header className='flex justify-between'>
                <h2 className="text-2xl font-light">New Post</h2>
                <img className="hover:cursor-pointer h-[30px]" 
                    onClick={ exitNewPost } src="/x-out.png" width="30"/>
            </header>
            <div className="mt-4 h-full">
                <label className="flex flex-col">
                    <input type="text" className="bg-inherit border-b border-b-white 
                        min-w-[60%] focus:outline-none max-w-max font-light"
                        data-testid="new-post-title-input"
                        value={ title } onChange={ e => setTitle(e.target.value) } />
                    <span className='font-thin text-md'>Title</span>
                </label>
                <section className='flex flex-col'>
                    <label className='mt-2 flex font-thin text-md h-fit'>
                        <span className='mr-2 h-fit'>Category:</span>
                        <select value={ category } data-testid="new-post-category-select"
                            onChange={ e => setCategory(e.target.value) } 
                            className="bg-light-gray border-b border-white 
                                w-fit h-fit font-light" >
                            { categories.map(cat => (
                                <option value={ cat } key={ cat } 
                                    className="bg-light-gray border-white 
                                    font-light">
                                    { cat }
                                </option>)) }
                        </select>
                    </label>
                    <div className='flex justify-around mt-4 bg-purple border 
                        border-white rounded-lg px-2 py-1 overflow-hidden flex-wrap'>
                        <PostBooleanAttribute label="Private" 
                            stateSetter={ () => setIsPrivate(prev => !prev) } />
                        <PostBooleanAttribute label="Question"
                            stateSetter={ () => setIsQuestion(prev => !prev) } />
                        <PostBooleanAttribute label="Anonymous"
                            stateSetter={ () => setIsAnonymous(prev=> !prev) } />
                        { canMarkAnnouncementOrPinned && <>
                        <PostBooleanAttribute label="Pin"
                            stateSetter={ () => setIsPinned(prev => !prev) } />
                        <PostBooleanAttribute label="Announcement"
                            stateSetter={ () => setIsAnnouncement(prev => !prev) } />
                        </>}
                    </div>
                </section>
                <div className='h-[60%]'>
                    <Editor isPost handleSubmit={ handleNewPostSubmit } />
                </div>
            </div>
        </div>
    )
}

const handleBackendUpdateSuccess = (
    newPostInfo, setSpecialListings, setPostListings, 
    specialListings, postListings, categoriesToColors, exitNewPost) => {

    newPostInfo = { 
        ...newPostInfo, 
        createdAt: new Date(newPostInfo.createdAt) 
    }

    if (newPostInfo.isAnnouncement || newPostInfo.isPinned) {
        setSpecialListings(
            newPostInfo.isPinned ? {
                ...specialListings,
                pinned: [newPostInfo, ...specialListings.pinned]
            } : {
                ...specialListings, 
                announcements: [newPostInfo, ...specialListings.announcements]
            } 
        )
    }
    else {
        const catColor = categoriesToColors[newPostInfo.category]
        newPostInfo = { postInfo: newPostInfo, catColor }
        setPostListings([newPostInfo, ...postListings])
    }
    exitNewPost()
}

export default NewPost