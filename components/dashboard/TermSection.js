import CourseCard from "./CourseCard"

function TermSection({ term, courses }) {
    const COLORS = [
        "bg-violet-400",
        "bg-violet-500",
        "bg-violet-600",
        "bg-violet-700",
        "bg-violet-800",
        "bg-violet-900"
    ]

    let colorIdx = 0

    const courseCards = courses.map(
        (course) => {
            colorIdx = colorIdx === COLORS.length - 1 ? 0 : colorIdx + 1
            const { name, code, section } = course

            return (
                <CourseCard name={ name } code={ code } 
                    key={ `${code}-${section}` }
                    section={ section } color={ COLORS[colorIdx] }/>
            )
        }
    )

    return (
        <div data-testid="term-section-container" className="px-6 pt-6 mb-24">
            <h3 className="font-mono text-lg mb-2">{ term }</h3>
            <div className="flex justify-start">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
                    { courseCards }
                </div>
            </div>
        </div>
    )
}

export default TermSection