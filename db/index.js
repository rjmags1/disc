import { Pool } from 'pg'

const pool = new Pool()

export const query = (text, params) => pool.query(text, params, (err, result) => {
    if (err) {
        console.error('error executing query', text, err.stack)
        return
    }
    console.log(result.rows.length > 0 ? result.rows[0] : result.rows)
})