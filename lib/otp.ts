import { pool } from "./db"
import { v4 as uuid } from "uuid"

export async function generateOTP(phone: string){

 const code = Math.floor(100000 + Math.random() * 900000).toString()

 await pool.query(
 `
 INSERT INTO otps(id,phone,code,expires_at)
 VALUES($1,$2,$3,NOW() + INTERVAL '5 minutes')
 `,
 [uuid(), phone, code]
 )

 // 👉 integrate with Infobip here
 console.log("OTP:", code)

 return { success: true }

}

export async function verifyOTP(phone: string, code: string){

 const res = await pool.query(
 `
 SELECT *
 FROM otps
 WHERE phone=$1 AND code=$2 AND verified=false
 `,
 [phone, code]
 )

 if(!res.rows.length){
  throw new Error("Invalid OTP")
 }

 const otp = res.rows[0]

 if(new Date(otp.expires_at) < new Date()){
  throw new Error("OTP expired")
 }

 await pool.query(
 `UPDATE otps SET verified=true WHERE id=$1`,
 [otp.id]
 )

 return true

}