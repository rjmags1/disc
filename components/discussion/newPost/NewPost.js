import { useContext, useState } from 'react'
import { EditorContext } from '../../../pages/[courseId]/discussion'
import { useCourse, useUser } from '../../../lib/hooks'
import { useRouter } from 'next/router'

function NewPost({ exitNewPost }) {
    const Editor = useContext(EditorContext)
    const router = useRouter()
    const { courseId } = router.query

    const [title, setTitle] = useState("")
    const [category, setCategory] = useState("General")
    const [isQuestion, setIsQuestion] = useState(false)
    const [isAnnouncement, setIsAnnouncement] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)

    const { user } = useUser()
    //const canMarkAnnouncementOrPinned = (
        //user.is_instructor || user.is_staff || user.is_admin)
    const canMarkAnnouncementOrPinned = true

    const { course, loading: loadingCourse } = useCourse(courseId)
    const categories = !!course ? course.categories : []


    console.log(isQuestion)
    return (
        <div data-testid="new-post-container" 
            className="w-full h-full bg-light-gray p-[8%] overflow-x-hidden">
            <header className='flex justify-between'>
                <h2 className="text-2xl font-light">New Post</h2>
                <img className="hover:cursor-pointer h-[30px]" 
                    onClick={ exitNewPost } src="/x-out.png" width="30"/>
            </header>
            <form className="mt-4 h-full">
                <label className="flex flex-col">
                    <input type="text" className="bg-inherit border-b border-b-white 
                        min-w-[60%] focus:outline-none max-w-max font-light"
                        value={ title } onChange={ e => setTitle(e.target.value) } />
                    <span className='font-thin text-md'>Title</span>
                </label>
                <section className='flex flex-col'>
                    <label className='mt-2 flex font-thin text-md h-fit'>
                        <span className='mr-2 h-fit'>Category:</span>
                        <select value={ category } onChange={ e => setCategory(e.target.value) } 
                            className="bg-light-gray border-b border-white w-fit h-fit font-light" >
                            { categories.map(cat => <option value={ cat } key={ cat } 
                                className="bg-light-gray border-white font-light">{ cat }</option>) }
                        </select>
                    </label>
                    <div className='flex justify-around mt-4 bg-purple border 
                        border-white rounded-lg px-2 py-1 overflow-hidden'>
                        <label className='flex font-thin text-md h-fit items-center mx-1'>
                            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit' 
                                onChange={ () => setIsPrivate(prev => !prev) }/>
                            <span className='no-wrap' >Private</span>
                        </label>
                        <label className='flex font-thin text-md h-fit items-center mx-1'>
                            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit' 
                                onChange={ () => setIsQuestion(prev => !prev) }/>
                            <span className='whitespace-nowrap'>Is question?</span>
                        </label>
                        <label className='flex font-thin text-md h-fit items-center mx-1'>
                            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit' 
                                onChange={ () => setIsAnonymous(prev => !prev) }/>
                            <span className='whitespace-nowrap'>Post anonymously?</span>
                        </label>
                        { canMarkAnnouncementOrPinned && 
                        <label className='flex font-thin text-md h-fit items-center mx-1'>
                            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit' 
                                onChange={ () => setIsPinned(prev => !prev) }/>
                            <span className='whitespace-nowrap'>Pin?</span>
                        </label> }
                        { canMarkAnnouncementOrPinned && 
                        <label className='flex font-thin text-md h-fit items-center mx-1'>
                            <input type="checkbox" className='accent-[#9400FF] mr-1 h-fit' 
                                onChange={ () => setIsAnnouncement(prev => !prev) }/>
                            <span className='whitespace-nowrap'>Make announcement?</span>
                        </label> }
                    </div>
                </section>
                <div className='h-[60%]'><Editor isPost/></div>
            </form>
        </div>
    )
}

export default NewPost