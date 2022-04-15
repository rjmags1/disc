function CourseCard({ name, code, section, color }) {
    const displayedCode = `${ code }-${ section }`

    return (
        <div data-testid="course-card-container"
            className={`border-2 border-gray-500 rounded 
                w-64 h-44 ${color} relative`} >
            <div className="w-full h-min p-2 bg-gray-500 text-white border-t-2 
                border-gray-500 absolute bottom-0">
                <p>{ displayedCode }</p>
                <p>{ name }</p>
            </div>
        </div>
    )
}

export default CourseCard