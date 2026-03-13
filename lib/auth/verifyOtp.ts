import { pool } from "../db"

export async function verifyOtp(phone:string,otp:string){

 const result = await pool.query(`
  SELECT *
  FROM auth_otps
  WHERE phone=$1
  AND otp=$2
  AND expires_at > now()
 `,
 [phone,otp]
 )

 return result.rows.length > 0
}