import { query } from '../../../../db/index'
import { sessionOptions } from '../../../../lib/session'
import { withIronSessionApiRoute } from 'iron-session/next'

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    if (!req.session?.user) {
        resp.status(200).json({ message: "not authenticated" })
        return
    }



    const { courseId } = req.query
    let categoriesQueryResult
    try {
        const categoriesQueryText = `
            SELECT category_id, name FROM post_category
            WHERE course = $1;`
        const categoriesQueryParams = [courseId]
        categoriesQueryResult = await query(
            categoriesQueryText, categoriesQueryParams
        )
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }
    if (categoriesQueryResult.rows.length === 0) {
        resp.status(400).json({ message: "bad course id" })
        return
    }


    const categories = []
    categoriesQueryResult.rows.forEach(
        (row) => {
            categories.push({
                categoryId: row.category_id, 
                category: row.name 
            })
        }
    )


    resp.status(200).json(categories)

}, sessionOptions)