import { pool } from "./db"
import { v4 as uuid } from "uuid"
import { randomInt } from "crypto"
import { AppError } from "./utils/errors"

async function sendOtpSms(phone: string, code: string): Promise<void> {
 const base = process.env.INFOBIP_BASE_URL
 const apiKey = process.env.INFOBIP_API_KEY
 const sender = process.env.INFOBIP_SMS_SENDER || process.env.INFOBIP_SENDER

 if(!base || !apiKey || !sender){
  console.warn("Infobip SMS not configured; OTP not sent over SMS")
  return
 }

 const res = await fetch(`${base}/sms/2/text/advanced`, {
  method: "POST",
  headers: {
   Authorization: `App ${apiKey}`,
   "Content-Type": "application/json",
   Accept: "application/json"
  },
  body: JSON.stringify({
   messages: [{
    from: sender,
    destinations: [{ to: phone }],
    text: `Your verification code is ${code}. It expires in 5 minutes.`
   }]
  })
 })

 if(!res.ok){
  const body = await res.text().catch(()=>"")
  console.error("Infobip SMS send failed:", res.status, body)
 }
}

export async function generateOTP(phone: string){
 if(!phone){
  throw new AppError("BAD_REQUEST", "Phone is required", 400)
 }

 const code = randomInt(100000, 1_000_000).toString()

 await pool.query(
  `
  INSERT INTO otps(id, phone, code, expires_at)
  VALUES($1, $2, $3, NOW() + INTERVAL '5 minutes')
  `,
  [uuid(), phone, code]
 )

 await sendOtpSms(phone, code)

 return { success: true }
}

export async function verifyOTP(phone: string, code: string){
 if(!phone || !code){
  throw new AppError("BAD_REQUEST", "Phone and code required", 400)
 }

 const res = await pool.query(
  `
  SELECT id, expires_at
  FROM otps
  WHERE phone=$1 AND code=$2 AND verified=false
  ORDER BY expires_at DESC
  LIMIT 1
  `,
  [phone, code]
 )

 if(!res.rows.length){
  throw new AppError("INVALID_OTP", "Invalid OTP", 401)
 }

 const otp = res.rows[0]

 if(new Date(otp.expires_at) < new Date()){
  throw new AppError("OTP_EXPIRED", "OTP expired", 401)
 }

 await pool.query(`UPDATE otps SET verified=true WHERE id=$1`, [otp.id])

 return true
}
