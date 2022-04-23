import { useRouter } from 'next/router'

function CourseCard({ id, name, code, section, color }) {
    const router = useRouter()

    const handleClick = (event) => {
        event.preventDefault()
        router.push(`/${id}/discussion`)
    }

    const displayedCode = `${ code }-${ section }`
    return (
        <div data-testid="course-card-container" onClick={ handleClick }
            className={`border-2 border-gray-500 rounded hover:bg-light-gray
                hover:cursor-pointer w-64 h-44 ${color} relative`} >
            <div className="w-full h-min bg-gray-500 text-white 
                border-t-2 border-gray-500 absolute bottom-0 p-2">
                <p>{ displayedCode }</p>
                <p>{ name }</p>
            </div>
        </div>
    )
}

export default CourseCard