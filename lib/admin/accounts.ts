import { pool } from "../db"

export async function getAccounts(){

 const result = await pool.query(`
  SELECT
   accounts.id,
   accounts.account_number,
   accounts.balance,
   users.name,
   users.phone
  FROM accounts
  JOIN users ON users.id = accounts.user_id
  ORDER BY accounts.created_at DESC
 `)

 return result.rows
}