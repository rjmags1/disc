import TermSection from './TermSection'
import Loading from '../lib/Loading'

import { useUser, useCourses } from '../../lib/hooks'

function Dashboard() {
    const {
        user,
        loading: loadingUser
    } = useUser({ redirectTo: '/login' })

    const {
        courses,
        loading: loadingCourses
    } = useCourses(user?.user_id)

    if (loadingUser || loadingCourses) return <Loading />

    const { terms } = courses
    const termSections = []
    for (const term of terms) {
        const termName = Object.keys(term)[0]
        const termCourses = term[termName].courses
        termSections.push(
            <TermSection key={termName} term={ termName } courses={ termCourses } />
        )
    }

    return (
        <div data-testid="dashboard-container"
            className="text-white w-full h-full md:mt-24">
            <div className="flex flex-col justify-center items-center">
                { termSections }
            </div>
        </div>
    )
}

export default Dashboard