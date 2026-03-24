import { pool } from "../db"
import bcrypt from "bcryptjs"

export async function validatePin(
 phone: string,
 pin: string
){

 if(!phone || !pin){
  throw new Error("Phone and PIN required")
 }

 const userRes = await pool.query(
 `
 SELECT id, pin_hash, pin_attempts, pin_locked_until
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(!userRes.rows.length){
  throw new Error("User not found")
 }

 const user = userRes.rows[0]

 if(!user.pin_hash){
  throw new Error("PIN not set")
 }

 // 🔒 CHECK IF ACCOUNT IS LOCKED
 if(
  user.pin_locked_until &&
  new Date(user.pin_locked_until) > new Date()
 ){
  throw new Error("Account locked. Try again later")
 }

 const isValid = await bcrypt.compare(pin, user.pin_hash)

 // ❌ INVALID PIN
 if(!isValid){

  const attempts = (user.pin_attempts || 0) + 1

  // 🚨 LOCK AFTER 3 ATTEMPTS
  if(attempts >= 3){

   await pool.query(
   `
   UPDATE users
   SET pin_attempts=0,
       pin_locked_until=NOW() + INTERVAL '15 minutes'
   WHERE id=$1
   `,
   [user.id]
   )

   throw new Error(
    "Account locked due to multiple failed attempts"
   )

  }

  // 🔁 INCREMENT ATTEMPTS
  await pool.query(
   `
   UPDATE users
   SET pin_attempts=$1
   WHERE id=$2
   `,
   [attempts, user.id]
  )

  throw new Error("Invalid PIN")

 }

 // ✅ SUCCESS → RESET ATTEMPTS
 await pool.query(
 `
 UPDATE users
 SET pin_attempts=0,
     pin_locked_until=NULL
 WHERE id=$1
 `,
 [user.id]
 )

 return {
  valid: true,
  userId: user.id
 }

}