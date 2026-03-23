import { pool } from "../db"
import bcrypt from "bcryptjs" // safer for Vercel

export async function validatePin(
 phone: string,
 pin: string
){

 if(!phone || !pin){
  throw new Error("Phone and PIN required")
 }

 const user = await pool.query(
 `
 SELECT id, pin_hash
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(!user.rows.length){
  throw new Error("User not found")
 }

 const hash = user.rows[0].pin_hash

 if(!hash){
  throw new Error("PIN not set")
 }

 const valid = await bcrypt.compare(pin, hash)

 if(!valid){
  throw new Error("Invalid PIN")
 }

 return {
  valid: true,
  userId: user.rows[0].id
 }

}