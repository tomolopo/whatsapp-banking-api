import { pool } from "../db"

export async function getAccounts(){

 const result = await pool.query(`
  SELECT
   accounts.id,
   accounts.account_number,
   accounts.balance,
   users.first_name,
   users.last_name,
   users.phone
  FROM accounts
  JOIN users ON users.id = accounts.user_id
  ORDER BY accounts.created_at DESC
 `)

 return result.rows
}

export async function getBanks(){

 const result = await pool.query(
 `
 SELECT code,name
 FROM banks
 ORDER BY name
 `
 )

 return result.rows

}