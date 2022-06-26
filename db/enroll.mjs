import { resolve, dirname } from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: resolve(dirname('.'), '../.env.local') })
import * as pg from 'pg'
const client = new pg.default.Client()
await client.connect()

const YEARS = [2000, 2001, 2002, 2003]
const TERM_NAMES = ['Winter', 'Spring', 'Summer', 'Fall']

/* REQUIREMENTS
4 years, 4 quarters/year -> 16 quarters
for each quarter, evenly divide instructors between that q's courses
for each quarter, assign each staff to half of that q's courses
for every quarter, each student should have 2-6 enrollments
no class should have more than 20 students
no class can have less than 10 students unless the class has zero enrollments
    (with a few exceptions for ease of impl)
for fall 2003 (the 'current' quarter) make sure there are 20 students,
    including harry, that are in 'Operating Systems I'. 
    will use this data for impl discussion page and testing


--note: data generated in this script (and all the other scripts in the db 
        folder for that matter) is meant to give a rough approximation
        of what real data would look like, and is generated for the purpose
        of discussion page impl. the real data would be subject to many more 
        constraints, such as course prereq constraints.
*/

const enroll = async function() {
    // gather person.user_id of instructors, staff, and students
    let queryText = `
        SELECT user_id FROM person WHERE
            is_instructor AND NOT is_staff AND NOT is_admin;`
    const instructorQueryResult = await query(queryText)
    const instructorIds = instructorQueryResult.rows.map(row => row.user_id)

    queryText = 
        `SELECT user_id FROM person WHERE
            is_staff AND NOT is_instructor AND NOT is_admin;`
    const staffQueryResult = await query(queryText)
    const staffIds = staffQueryResult.rows.map(row => row.user_id)

    queryText =
        `SELECT user_id FROM person WHERE
            NOT is_staff AND NOT is_instructor AND NOT is_admin;`
    const studentQueryResult = await query(queryText)
    const studentIds = studentQueryResult.rows.map(row => row.user_id)

    // start enrolling students/assigning instructors, staff for each term
    for (const year of YEARS) {
        for (const term of TERM_NAMES) {

            // get the course.course_id of each course offered in a term
            queryText = 
                `SELECT course_id FROM course WHERE term =
                    (SELECT term_id FROM term WHERE year = $1 AND name = $2);`
            let queryParams = [year, term]
            const coursesQueryResult = await query(queryText, queryParams)
            const courseIds = coursesQueryResult.rows.map(row => row.course_id)
            const numCourses = courseIds.length
            
            // init sets for: keeping track of courses being enrolled 
            // into as the algo progresses, and keeping track of courses
            // that have been enrolled into up to their cap
            const enrollingInto = new Set() // set of course.course_id
            const enrollingIntoObjs = new Set() // set of course objects
            const enrolledInto = new Set() // set of course.course_id
            while (enrollingInto.size < 6) {
                const randomCourseIdx = Math.floor(Math.random() * numCourses)
                const randomCourseId = courseIds[randomCourseIdx]
                if (enrollingInto.has(randomCourseId)) continue

                // use object to keep track of enrollment cap
                // and num enrolled so far
                const cap = 10 + Math.floor(Math.random() * 10) + 1
                enrollingInto.add(randomCourseId)
                enrollingIntoObjs.add({ 
                    courseId: randomCourseId, 
                    cap, 
                    currEnrolled: 0 
                })
            }

            // enroll students by iter through each student, 
            // enrolling them in randrange(2, 6) courses, where the 
            // courses students are enrolled into are in enrolling course set.
            // whenever a course has == randrange(10, 21) students, 
            // it is removed from enrolling and replaced by 
            // another from unenrolled
            for (const studentId of studentIds) {
                const numCoursesThisQuarter = Math.floor(Math.random() * 6) + 1
                const cappedCourseObjs = []
                let enrolls = 0
                for (const courseObj of enrollingIntoObjs) {
                    const { courseId, cap } = courseObj
                    const enrolledSuccess = await enrollStudent(studentId, courseId)
                    if (!enrolledSuccess) continue

                    if (++courseObj.currEnrolled === cap) {
                        cappedCourseObjs.push(courseObj)
                    }
                    if (++enrolls === numCoursesThisQuarter) break
                }

                replaceOverCap(enrollingInto, enrollingIntoObjs, 
                    enrolledInto, cappedCourseObjs, courseIds)
            }

            // assign instructors and staff to the resulting enrolled courses.
            // will be below cap courses left in enrollingInto, 
            // which is fine
            const coursesTaughtThisTerm = [...enrollingInto, ...enrolledInto]
            let staffIdx = 0, instructorIdx = 0
            for (let i = 0; i < coursesTaughtThisTerm.length; i++) {
                const courseId = coursesTaughtThisTerm[i]

                // divide courses for term evenly among instructors
                const instructorId = instructorIds[instructorIdx]
                await assignInstructor(instructorId, courseId)
                instructorIdx = instructorIdx === instructorIds.length - 1 ? 
                    0 : instructorIdx + 1

                // assign staff to half of the courses for the term
                if (i % 2 === 0) {
                    const staffId = staffIds[staffIdx]
                    await assignStaff(staffId, courseId)
                    staffIdx = staffIdx === staffIds.length - 1 ?
                        0 : staffIdx + 1
                }
            }
        }
    }

    // assign ~20 more students to operating systems I section 1
    // fall 2003 (specialCourse). harry must be one of those students
    queryText = `SELECT user_id FROM person WHERE 
        f_name = 'Harry' AND l_name = 'Potter';`
    const harryIdQuery = await query(queryText)
    const harryId = harryIdQuery.rows[0].user_id
    queryText = 
        `SELECT course_id FROM course WHERE 
            code = 'CS344' AND section = 1 AND term = 
                (SELECT term_id FROM term 
                    WHERE year = 2003 AND name = 'Fall');`
    const specialCourseIdQuery = await query(queryText)
    const specialCourseId = specialCourseIdQuery.rows[0].course_id
    const usedIds = new Set()
    for (let _ = 0; _ < 20; _++) {
        // add harry or random non duplicate student to specialCourse
        let randomStudentId
        if (_ !== 0) {
            let randomStudentIdx = Math.floor(Math.random() * studentIds.length)
            randomStudentId = studentIds[randomStudentIdx]
            while (usedIds.has(randomStudentId)) {
                let randomStudentIdx = Math.floor(
                    Math.random() * studentIds.length)
                randomStudentId = studentIds[randomStudentIdx]
            }
        }
        const studentId = _ === 0 ? harryId : randomStudentId
        usedIds.add(studentId)

        queryText = `INSERT INTO person_course (person, course) VALUES ($1, $2);`
        const queryParams = [studentId, specialCourseId]
        try {
            await query(queryText, queryParams)
        }
        catch (err) {
            // already enrolled that student
            continue
        }
    }

    // make sure there is instructor for specialCourseId
    queryText = `SELECT enrollment_id FROM person_course WHERE
        course = $1 AND is_instructor;`
    const queryParams = [specialCourseId]
    let checkForRows = await query(queryText, queryParams)
    if (checkForRows.rows.length === 0) {
        queryText = `
            INSERT INTO person_course (person, course, is_instructor) VALUES
                ((SELECT user_id FROM person WHERE 
                    is_instructor AND NOT is_admin LIMIT 1),
                $1,
                TRUE);`
        await query(queryText, [3])
    }
    else await query(`
        UPDATE person_course SET person = $1 WHERE course = $2 
        AND is_instructor;`, [3, specialCourseId])

    // make sure there is staff for specialCourseId
    queryText = `SELECT enrollment_id FROM person_course WHERE 
        course = $1 AND is_staff;`
    checkForRows = await query(queryText, queryParams)
    if (checkForRows.rows.length === 0) {
        queryText = `
            INSERT INTO person_course (person, course, is_staff) VALUES
                ((SELECT user_id FROM person WHERE 
                    is_staff AND NOT is_admin LIMIT 1),
                $1,
                TRUE);`
        await query(queryText, [7])
    }

    // make sure admin has access to all enrolled classes
    const allEnrolledCoursesQuery = await query(`
        SELECT course FROM person_course GROUP BY course;`)
    for (const { course: enrolledCourseId } of allEnrolledCoursesQuery.rows) {
        await query(
            `INSERT INTO person_course (person, course) VALUES ($1, $2)`,
            [1, enrolledCourseId])
    }
}


// hoisted
const assignInstructor = async function(instructorId, courseId) {
    const queryText = 
        `INSERT INTO person_course (person, course, is_instructor)
            VALUES ($1, $2, TRUE);`
    const queryParams = [instructorId, courseId]
    await query(queryText, queryParams)
}

const assignStaff = async function(staffId, courseId) {
    const queryText = 
        `INSERT INTO person_course (person, course, is_staff)
            VALUES ($1, $2, TRUE);`
    const queryParams = [staffId, courseId]
    await query(queryText, queryParams)
}

const enrollStudent = async function(studentId, courseId) {
    const queryText = 
        `INSERT INTO person_course (person, course) VALUES ($1, $2);`
    const queryParams = [studentId, courseId]
    try { 
        await query(queryText, queryParams)
        return true
    }
    catch (e) { return false }
}

const replaceOverCap = function(
    enrollingInto, enrollingIntoObjs, enrolledInto, cappedCourseObjs, courseIds) {
    if (cappedCourseObjs.length === 0) return

    for (const cappedCourseObj of cappedCourseObjs) {
        enrollingIntoObjs.delete(cappedCourseObj)
        enrollingInto.delete(cappedCourseObj.courseId)
        enrolledInto.add(cappedCourseObj.courseId)

        const numCourses = courseIds.length
        let replaced = false
        while (!replaced) {
            const randomCourseIdx = Math.floor(Math.random() * numCourses)
            const randomCourseId = courseIds[randomCourseIdx]
            if (enrollingInto.has(randomCourseId) || 
                enrolledInto.has(randomCourseId)) continue
            
            enrollingInto.add(randomCourseId)
            const cap = 10 + Math.floor(Math.random() * 10) + 1
            enrollingIntoObjs.add({ 
                courseId: randomCourseId, 
                cap, 
                currEnrolled: 0 
            })
            replaced = true
        }
    }
}

const query = async function (queryText, queryParams) {
    try {
        const queryResult = await client.query(queryText, queryParams)
        return queryResult
    }
    catch (error) {
        throw new Error("problem executing query", { cause: error })
    }
}

try {
    await enroll()
}
catch (e) {
    console.error(e)
    console.error("something went wrong. run the destroy_db script and try again.")
}
finally { await client.end() }