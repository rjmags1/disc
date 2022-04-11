import { Pool } from "pg"

// initialize pool with environment variables
const pool = new Pool()

// for executing single query with any available client in pool
// releasing of client is handled for us
export const query = async function (queryText, queryParams) {
    try {
        const queryResult = await pool.query(queryText, queryParams)
        console.log(`
            QUERY SUCCESS: 
            query: ${queryText},\n
            result first row: ${
                queryResult.rows ? 
                queryResult.rows[0] : queryResult.rows}
        `)
        return queryResult
    }
    catch (error) {
        console.error(`
            QUERY ERROR: 
            query: ${queryText}\n
            error: ${error.stack}
        `)
        throw new Error("problem executing query", { cause: error })
    }
}

// obtain a client for a transaction (atomic multi-query db interaction)
// all transaction queries must be enacted by the same client
export const getClientFromPool = async function() {
    try {
        const client = await pool.connect()
        return client
    }
    catch (error) {
        console.error(error)
        throw new Error("problem checking out client from pool", { 
            cause: error 
        })
    }
}

// release a client after a transaction.
// should always be called in a finally block after a transaction
export const releaseClient = async function(client) {
    try {
        client.release()
    }
    catch (error) {
        console.error(error)
        throw new Error("problem releasing passed client", {
            cause: error
        })
    }
}

export const clientQuery = async function(client, queryText, params) {
    try {
        const queryResult = await client.query(queryText, params)
        console.log(`
            QUERY SUCCESS: 
            query: ${queryText},\n
            result first row: ${
                queryResult.rows ? 
                queryResult.rows[0] : queryResult.rows}
        `)
        return queryResult
    }
    catch (error) {
        console.error(error)
        throw new Error("problem executing query on passed client", {
            cause: error
        })
    }
}