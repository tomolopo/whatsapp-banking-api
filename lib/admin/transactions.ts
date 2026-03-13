import { pool } from "../db"

export async function getTransactions(){

 const result = await pool.query(`
  SELECT
   id,
   amount,
   status,
   created_at
  FROM transactions
  ORDER BY created_at DESC
  LIMIT 100
 `)

 return result.rows
}