import { pool } from "../db"

export async function checkUser(phone: string){

 const result = await pool.query(
 `
 SELECT id,first_name,last_name,phone
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(result.rows.length === 0){

  return {
   exists:false
  }

 }

 const user = result.rows[0]

 return {
  exists:true,
  user
 }

}