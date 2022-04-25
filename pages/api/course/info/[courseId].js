import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session.user) {
        resp.status(401).json({ message: "not authenticated" })
        return
    }



    const { courseId } = req.query
    let courseQueryResult
    try {
        const courseQueryText = `
            SELECT
                course.course_id,
                term.year,
                term.name AS term_name,
                course.name,
                course.code,
                course.section
            FROM course JOIN term ON course.term = term.term_id
            WHERE course.course_id = $1;`
        const courseQueryParams = [courseId]
        courseQueryResult = await query(courseQueryText, courseQueryParams)
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (courseQueryResult.rows.length === 0) {
        resp.status(400).json({ message: "bad course id" })
        return
    }



    const { 
        course_id, year, term_name, name, code, section 
    } = courseQueryResult.rows[0]
    const courseInfo = {
        courseId: course_id,
        termName: `${ term_name } ${ year }`,
        courseName: name,
        code: code,
        section: section
    }



    resp.status(200).json(courseInfo)

}, sessionOptions)