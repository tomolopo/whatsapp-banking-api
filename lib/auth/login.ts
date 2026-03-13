import { pool } from "../db"
import { generateOTP } from "../otp"

export async function login(phone:string){

 const otp = generateOTP()

 await pool.query(`
  INSERT INTO auth_otps(phone,otp,expires_at)
  VALUES($1,$2,now()+interval '5 minutes')
 `,
 [phone,otp]
 )

 return { otp }
}