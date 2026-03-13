import { pool } from "../db"
import bcrypt from "bcrypt"

export async function validatePin(
 phone: string,
 pin: string
){

 const result = await pool.query(
 `
 SELECT pin_hash
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(!result.rows.length){
  return false
 }

 const hash = result.rows[0].pin_hash

 const valid = await bcrypt.compare(pin,hash)

 return valid
}