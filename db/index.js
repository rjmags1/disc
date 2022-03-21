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
        console.log(`db query: ${text},\n
            result first row: ${result.rows ? result.rows[0] : result.rows}`)
        return result
    }
    catch (error) {
        console.error(`error exec query ${text}`, error.stack)
        throw new Error("query failed", { cause: error })
    }
}