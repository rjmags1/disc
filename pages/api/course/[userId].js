import { query } from '../../../db/index'
import { sessionOptions } from '../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ terms: [] })
        return
    }
    const parsed = parseInt(req.query.userId, 10)
    if (parsed !== req.session.user.user_id) {
        // userId in query should always come from 
        // session cookie via useUser hook in normal app usage. if not, 
        // ie the session cookie user_id doesnt match userId in body,
        // someone may be trying to maliciously view someone elses info
        resp.status(400).json({ message: "dont be malicious" })
        return
    }



    // get courses associated with userId from db
    const { userId } = req.query
    let coursesQueryResult
    try {
        const coursesQueryText = `
            SELECT 
                term.name AS term_name, 
                term.year, 
                course.course_id AS course_id,
                course.name AS course_name, 
                course.section, 
                course.code
            FROM person
                JOIN person_course 
                    ON person.user_id = person_course.person 
                JOIN course 
                    ON person_course.course = course.course_id 
                JOIN term 
                    ON course.term = term.term_id
            WHERE person.user_id = $1
            ORDER BY 
                year DESC,
                term.name ASC;`
        const coursesQueryParams = [userId]
        coursesQueryResult = await query(coursesQueryText, coursesQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }



    // put courses into terms array of shape 
    // [{ termName: { courses: [{ courseId, name, code, section }, ...] } }, ...]
    const terms = []
    const newTerm = (termName) => {
        return terms.length > 0 && !(termName in terms[terms.length - 1])
    }
    for (let i = 0; i < coursesQueryResult.rows.length; i++) {
        const row = coursesQueryResult.rows[i]
        const { term_name, year, course_id, course_name, section, code } = row

        const termName = `${ term_name } ${ year }`
        const course = { courseId: course_id, name: course_name, section, code }
        // rows sorted by desc term.year, tie break on term.name,
        // so all courses in a given term will be grouped together.
        // use these properties to reshape rows into terms in one pass
        if (i === 0 || newTerm(termName)) { // 
            terms.push({ [termName]: { courses: [course] } })
        }
        else terms[terms.length - 1][termName].courses.push(course)
    }



    // because we are dealing with seasons and terms is sorted by descending
    // year w/ tie break on term.name (aka season) alphabetical order,
    // we're not done yet. need to tie break on desc season order!
    // ie, want client to get the most recent term at the top of their response
    const seasonPriority = {
        "Fall": 1,
        "Summer": 2,
        "Spring": 3,
        "Winter": 4
    }
    const termCompare = (term1, term2) => {
        term1 = Object.keys(term1)[0], term2 = Object.keys(term2)[0]
        if (term1 === term2) return 0 // js sort expects 0 to preserve order

        let [season1, year1] = term1.split(' ')
        let [season2, year2] = term2.split(' ')
        year1 = parseInt(year1), year2 = parseInt(year2)

        if (year1 === year2) {
            return seasonPriority[season1] - seasonPriority[season2]
        }
        return year2 - year1
    }
    terms.sort(termCompare)



    // send terms in success response
    resp.status(200).json({ terms })

}, sessionOptions)