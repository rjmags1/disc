import { Pool } from "pg"

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

export const query = async function (text, params) {
    try {
        const result = await pool.query(text, params)
        console.log(`
            QUERY SUCCESS: 
            query: ${text},\n
            result first row: ${result.rows ? result.rows[0] : result.rows}
        `)
        return result
    }
    catch (error) {
        console.error(`
            QUERY ERROR: 
            query: ${text}\n
            error: ${error.stack}
        `)
        throw new Error("query failed", error)
    }
}

export const poolQuery = async function(queryText, params) {
    const client = await pool.connect()
    let queryResult
    try {
        queryResult = await client.query(queryText, params)
    }
    catch (error) {
        console.error(`
            QUERY ERROR: 
            query: ${text}\n
            error: ${error.stack}
        `)
        throw new Error("query failed", error)
    }
    finally {
        client.release() // always release client. client leaks = bad.
    }
    return queryResult
}