import { VercelRequest,VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"
import { generateOTP } from "../../lib/otp"
import { v4 as uuid } from "uuid"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const { phone,fromAccount,toAccount,amount } = req.body

 const otp = generateOTP()

 await pool.query(
 `
 INSERT INTO transfer_otps(id,phone,otp,expires_at,payload)
 VALUES($1,$2,$3,now()+interval '5 minutes',$4)
 `,
 [
  uuid(),
  phone,
  otp,
  JSON.stringify({fromAccount,toAccount,amount})
 ]
 )

 res.json({
  success:true,
  otp
 })

}