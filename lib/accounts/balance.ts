import { pool } from "../db"

export async function getBalance(phone:string){

 const result = await pool.query(`
  SELECT balance,account_number
  FROM accounts
  JOIN users ON users.id = accounts.user_id
  WHERE users.phone=$1
 `,
 [phone]
 )

 if(!result.rows.length){
  return null
 }

 return result.rows[0]
}