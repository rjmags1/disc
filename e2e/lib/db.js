const { Pool } = require('pg')

const pool = new Pool()

exports.query = async function(queryText, params) {
    return pool.query(queryText, params)
}

exports.getClientFromPool = async function() {
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

exports.releaseClient = async function(client) {
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

exports.clientQuery = async function(client, queryText, params) {
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