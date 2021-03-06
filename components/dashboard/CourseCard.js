import { useRouter } from 'next/router'
import { useRef, useEffect, useState } from 'react'

function CourseCard({ id, name, code, section, color }) {
    const router = useRouter()
    const containerRef = useRef(null)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return

        containerRef.current.style.backgroundColor = hover ? "" : color
    }, [containerRef, hover])

    const handleClick = (event) => {
        event.preventDefault()
        router.push(`/discussion/${id}`)
    }

    const displayedCode = `${ code }-${ section }`
    return (
        <div data-testid="course-card-container" onClick={ handleClick }
            ref={ containerRef }
            className={`border-2 border-gray-500 rounded hover:bg-light-gray
                hover:cursor-pointer w-64 h-44 relative`} 
                onMouseEnter={ () => setHover(true) } 
                onMouseLeave={ () => setHover(false) }>
            <div className="w-full h-min bg-gray-500 text-white 
                border-t-2 border-gray-500 absolute bottom-0 p-2">
                <p>{ displayedCode }</p>
                <p>{ name }</p>
            </div>
        </div>
    )
}

export default CourseCard