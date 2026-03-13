import { VercelRequest,VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"
import { checkDailyLimit } from "../../lib/limits"
import { runFraudChecks } from "../../lib/fraud"
import { logEvent } from "../../lib/events"
import { v4 as uuid } from "uuid"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const { phone,otp } = req.body

 const client = await pool.connect()

 try{

 const otpRow = await client.query(
 `
 SELECT payload
 FROM transfer_otps
 WHERE phone=$1
 AND otp=$2
 AND expires_at > now()
 `,
 [phone,otp]
 )

 if(!otpRow.rows.length){

  throw new Error("Invalid OTP")

 }

 const {fromAccount,toAccount,amount}
 = otpRow.rows[0].payload

 /*
 Check transfer limits
 */

 await checkDailyLimit(fromAccount,amount)

 /*
 Get internal account id
 */

 const accountResult = await client.query(
 `
 SELECT id
 FROM accounts
 WHERE account_number=$1
 `,
 [fromAccount]
 )

 if(!accountResult.rows.length){

  throw new Error("Sender account not found")

 }

 const accountId = accountResult.rows[0].id

 /*
 Run fraud engine
 */

 const fraud = await runFraudChecks(accountId,amount)

 /*
 Start transaction
 */

 await client.query("BEGIN")

 await client.query(
 `
 UPDATE accounts
 SET balance = balance - $1
 WHERE account_number=$2
 `,
 [amount,fromAccount]
 )

 await client.query(
 `
 UPDATE accounts
 SET balance = balance + $1
 WHERE account_number=$2
 `,
 [amount,toAccount]
 )

 const txId = uuid()

 await client.query(
 `
 INSERT INTO transactions(id,amount,status)
 VALUES($1,$2,$3)
 `,
 [txId,amount,"completed"]
 )

 await client.query("COMMIT")

 /*
 Log system event
 */

 await logEvent("transfer.completed",{
  txId,
  amount,
  fromAccount,
  toAccount
 })

 /*
 Flag high-risk transfers
 */

 if(fraud.riskScore > 50){

  await logEvent("fraud.high_risk_transfer",{
   accountId,
   amount,
   riskScore:fraud.riskScore
  })

 }

 res.json({
  success:true,
  txId,
  riskScore:fraud.riskScore
 })

 }catch(err){

 await client.query("ROLLBACK")

 const msg =
 err instanceof Error ? err.message : "Unknown error"

 res.json({
  success:false,
  message:msg
 })

 }finally{

 client.release()

 }

}