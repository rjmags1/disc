const { query } = require('../lib/db')
const { TESTUSER_REGISTERED } = require('../lib/auth')

exports.getDbCoursesAsSet = async () => {
    const { userId: testUserId } = TESTUSER_REGISTERED
    const courseQueryText = `
        SELECT 
            term.name AS term_name, 
            term.year, 
            course.code, 
            course.section, 
            course.name AS course_name
        FROM course 
            JOIN person_course ON course.course_id = person_course.course
            JOIN term on term.term_id = course.term
        WHERE person_course.person = $1;`
    const courseQueryParams = [testUserId]
    let courseQuery
    try {
        courseQuery = await query(courseQueryText, courseQueryParams)
    }
    catch (error) {
        console.error(error)
        throw new Error("dashboard e2e test couldnt query db")
    }
    const formattedDbCoursesArray = courseQuery.rows.map(
        row => {
            const {
                term_name: season,
                year,
                code,
                section,
                course_name: courseName
            } = row
            return { 
                term: `${ season } ${ year }`, 
                code: `${ code }-${ section }`,  
                name: courseName
            }
        }
    )
    
    return new Set(formattedDbCoursesArray)
}

exports.getPageCoursesAsSet = async (page) => {
    let collectionFailure = true
    let pageCoursesSet = new Set()
    while (collectionFailure) {
        let termSectionIdx = 0
        let termSectionSelector = `
            [data-testid=term-section-container] >> nth=${ termSectionIdx }`
        let collectingPageCourses = true
        while (collectingPageCourses) {
            const termSectionLocator = page.locator(termSectionSelector)
            const count = await termSectionLocator.count()
            const collectingPageCourses = count > 0
            if (!collectingPageCourses) break

            const term = await termSectionLocator.locator(
                "text=/(winter|spring|summer|fall)/i").innerText()
            let collectingCoursesThisTerm = true
            let courseIdx = 0
            let courseCardSelector = `[data-testid=course-card-container] 
                                        >> nth=${ courseIdx }`
            while (collectingCoursesThisTerm) {
                const count = await termSectionLocator.
                                locator(courseCardSelector).count()
                collectingCoursesThisTerm = count > 0
                if (!collectingCoursesThisTerm) break

                const code = await termSectionLocator.locator(
                    courseCardSelector).locator("p >> nth=0").innerText()
                const name = await termSectionLocator.locator(
                    courseCardSelector).locator("p >> nth=1").innerText()

                pageCoursesSet.add({
                    term: term,
                    code: code,
                    name: name
                })
                courseCardSelector = `[data-testid=course-card-container] 
                                            >> nth=${ ++courseIdx }`
            }
            
            termSectionSelector = `
                [data-testid=term-section-container] >> nth=${ ++termSectionIdx }`
        }

        collectionFailure = pageCoursesSet.size === 0
        if (collectionFailure) pageCoursesSet = new Set()
    }

    return pageCoursesSet
}

exports.getEnrolledTermsFromDbAsSet = async () => {
    const { userId: testUserId } = TESTUSER_REGISTERED
    const testUserEnrolledTermsQueryText = `
        SELECT term.year, term.name FROM term
            JOIN course ON term.term_id = course.term
            JOIN person_course ON course.course_id = person_course.course
        WHERE person_course.person = $1;`
    const testUserEnrolledTermsParams = [testUserId]
    let testUserEnrolledTermsQuery
    try {
        testUserEnrolledTermsQuery = await query(
            testUserEnrolledTermsQueryText, testUserEnrolledTermsParams
        )
    }
    catch (error) {
        console.error(error)
        throw new Error("problem querying db during e2e dashboard test")
    }

    const dbTermsSet = new Set()
    testUserEnrolledTermsQuery.rows.forEach(
        row => {
            const { name, year } = row
            dbTermsSet.add(`${ name } ${ year }`)
        }
    )

    return dbTermsSet
}

exports.getPageTermHeaders = async (page) => {
    let termHeaders = []
    let collectionFailure = true
    while (collectionFailure) { // playwright/cross-browser bugginess guard
        let nextLatestTermIdx = 0
        let termHeaderSelector = `
            text=/(winter|spring|summer|fall)/i >> nth=${ nextLatestTermIdx }`
        let collectingTermHeaders = true
        while (collectingTermHeaders) {
            const nextLatestTermLocator = page.locator(termHeaderSelector)
            const locatorCount = await nextLatestTermLocator.count()
            collectingTermHeaders = locatorCount > 0
            if (!collectingTermHeaders) break

            const termHtml = await nextLatestTermLocator.innerText()
            termHeaders.push(termHtml)
            termHeaderSelector = `
                text=/(winter|spring|summer|fall)/i >> 
                    nth=${ ++nextLatestTermIdx }`
        }

        collectionFailure = termHeaders.length === 0
        if (collectionFailure) termHeaders = []
    }

    return termHeaders
}