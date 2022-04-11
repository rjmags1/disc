import { query } from "../../../db/index"
import { sessionOptions } from "../../../lib/session"
import { withIronSessionApiRoute } from "iron-session/next"

/*
in the real app the behavior in this route would be implemented
in a reverse proxy, which knows about all orgs
that use disc and routes all other /api/** subroutes to servers
that talk to org-specific database servers.
*/

export default withIronSessionApiRoute(async function(req, resp) {
    // req guard
    if (req.method !== 'GET') {
        resp.status(405).json({ message: "invalid method" })
        return
    }


    // db query all orgs
    let orgQueryResult
    try {
        const orgQueryText = "SELECT name FROM orgs"
        orgQueryResult = await query(orgQueryText) // array of row objects
    }
    catch (error) {
        console.error(error)
        resp.status(500).json({ message: "internal server error" })
        return
    }


    // map row objects to array and send in success response
    const orgs = orgQueryResult.rows.map(row => row.name)
    resp.status(200).json(orgs)

}, sessionOptions)