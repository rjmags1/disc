import CourseCard from "./CourseCard"
import { VIOLET_HEX } from "../../lib/colors"

function TermSection({ term, courses }) {
    let colorIdx = 0

    const courseCards = courses.map(
        (course) => {
            colorIdx = colorIdx === VIOLET_HEX.length - 1 ? 0 : colorIdx + 1
            const { courseId, name, code, section } = course

            return (
                <CourseCard id={ courseId } name={ name } code={ code }
                    key={ `${code}-${section}` }
                    section={ section } color={ VIOLET_HEX[colorIdx] }/>
            )
        }
    )

    return (
        <div data-testid="term-section-container" className="px-6 pt-6 mb-24">
            <h3 className="font-mono text-lg mb-2">{ term }</h3>
            <div className="flex justify-start">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 
                        gap-x-12 gap-y-12">
                    { courseCards }
                </div>
            </div>
        </div>
    )
}

export default TermSection