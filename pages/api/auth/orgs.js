import { query } from "../../../db/index"
import { sessionOptions } from "../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"

export default withIronSessionApiRoute(async function(req, resp) {
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }
    try {
        const queryText = "SELECT * FROM Orgs"
        const result = await query(queryText) // array of row objects
        const orgs = []
        result.rows.forEach((row) => { orgs.push(row.name) })
        resp.status(200).json(orgs)
    }
    catch (error) {
        resp.status(500).json({ message: error.message })
    }
}, sessionOptions)