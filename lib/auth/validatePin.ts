import { pool } from "../db"
import bcrypt from "bcryptjs"
import { AppError } from "../utils/errors"

export async function validatePin(phone: string, pin: string){

 if(!phone || !pin){
  throw new AppError("BAD_REQUEST", "Phone and PIN required", 400)
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
  throw new AppError("UNAUTHORIZED", "Invalid credentials", 401)
 }

 const user = userRes.rows[0]

 if(!user.pin_hash){
  throw new AppError("PIN_NOT_SET", "PIN not set", 400)
 }

 if(
  user.pin_locked_until &&
  new Date(user.pin_locked_until) > new Date()
 ){
  throw new AppError("ACCOUNT_LOCKED", "Account locked. Try again later", 423)
 }

 const isValid = await bcrypt.compare(pin, user.pin_hash)

 if(!isValid){
  const attempts = (user.pin_attempts || 0) + 1

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
   throw new AppError(
    "ACCOUNT_LOCKED",
    "Account locked due to multiple failed attempts",
    423
   )
  }

  await pool.query(
   `UPDATE users SET pin_attempts=$1 WHERE id=$2`,
   [attempts, user.id]
  )

  throw new AppError("INVALID_PIN", "Invalid PIN", 401)
 }

 await pool.query(
  `
  UPDATE users
  SET pin_attempts=0,
      pin_locked_until=NULL
  WHERE id=$1
  `,
  [user.id]
 )

 return { userId: user.id as string }
}
