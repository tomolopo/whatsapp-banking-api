import { pool } from "../db"

export async function getFraudAlerts(){

 const result = await pool.query(`
  SELECT
   id,
   account_id,
   reason,
   severity,
   created_at
  FROM fraud_flags
  ORDER BY created_at DESC
 `)

 return result.rows
}