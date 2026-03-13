import { pool } from "../db"

export async function getUserByPhone(phone:string){

 const result = await pool.query(
 `
 SELECT *
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(!result.rows.length){
  return null
 }

 return result.rows[0]

}