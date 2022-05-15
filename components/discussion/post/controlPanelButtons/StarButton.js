import { useState, useContext, useRef, useEffect } from 'react'
import { PostContext } from '../../../../pages/[courseId]/discussion'
import ButtonLoading from '../../../lib/ButtonLoading'

function StarButton({ starred }) {
    const buttonRef = useRef(null)
    const { currentPost } = useContext(PostContext)
    const [status, setStatus] = useState(starred)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!buttonRef.current) return

        buttonRef.current.style.backgroundColor = loading ? 
            "#18181b" : ""

    }, [loading])

    const handleClick = async () => {
        if (loading) return

        const newStatus = !status
        setStatus(prevStatus => !prevStatus)
        setLoading(true)
        try {
            const resp = await fetch(
                `/api/course/postsInfo/${ currentPost.postId }/star/${ newStatus }`,
                { method: 'PUT' }
            )
            if (!resp.ok) setStatus(!newStatus)
        }
        catch (error) { setStatus(!newStatus) }
        finally { setLoading(false) }
    }

    return (
        <div data-testid="starred-button-container" className="h-[40px] w-[30%]">
            <button className="flex items-center justify-center w-full 
                h-full rounded bg-yellow-500 hover:bg-yellow-600 
                hover:cursor-pointer" ref={ buttonRef } onClick={ handleClick }>
                <span>{ status ? "Unstar" : "Star" }</span>
                { loading && <ButtonLoading /> }
            </button>
        </div>
    )
}

export default StarButton