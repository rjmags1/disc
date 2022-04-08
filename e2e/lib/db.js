const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

exports.query = async function(queryText, params) {
    return pool.query(queryText, params)
}

exports.poolQuery = async function(queryText, params) {
    const client = await pool.connect()
    let queryResult
    try {
        queryResult = await client.query(queryText, params)
    }
    finally {
        client.release()
    }
    return queryResult
}