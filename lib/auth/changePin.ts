import { pool } from "../db"
import bcrypt from "bcryptjs"

export async function changePin(
 phone: string,
 oldPin: string,
 newPin: string
){

 if(!phone || !oldPin || !newPin){
  throw new Error("All fields are required")
 }

 if(newPin.length < 4){
  throw new Error("PIN must be at least 4 digits")
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

 const currentHash = user.rows[0].pin_hash

 const valid = await bcrypt.compare(oldPin, currentHash)

 if(!valid){
  throw new Error("Old PIN is incorrect")
 }

 const newHash = await bcrypt.hash(newPin, 10)

 await pool.query(
 `
 UPDATE users
 SET pin_hash=$1,
     pin_attempts=0,
     pin_locked_until=NULL
 WHERE phone=$2
 `,
 [newHash, phone]
 )

 return {
  success: true,
  message: "PIN updated successfully"
 }

}