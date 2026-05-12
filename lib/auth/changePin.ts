import { pool } from "../db"
import bcrypt from "bcryptjs"
import { AppError } from "../utils/errors"

export async function changePin(
 phone: string,
 oldPin: string,
 newPin: string
){

 if(!phone || !oldPin || !newPin){
  throw new AppError("BAD_REQUEST", "All fields are required", 400)
 }

 if(!/^\d{4,}$/.test(newPin)){
  throw new AppError("BAD_REQUEST", "PIN must be at least 4 digits", 400)
 }

 const user = await pool.query(
  `SELECT id, pin_hash FROM users WHERE phone=$1`,
  [phone]
 )

 if(!user.rows.length){
  throw new AppError("UNAUTHORIZED", "Invalid credentials", 401)
 }

 const valid = await bcrypt.compare(oldPin, user.rows[0].pin_hash)

 if(!valid){
  throw new AppError("INVALID_PIN", "Old PIN is incorrect", 401)
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
