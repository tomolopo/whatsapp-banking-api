import { VercelRequest, VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"
import { generateNUBAN } from "../../lib/nuban"
import { generateOTP } from "../../lib/otp"
import { checkDailyLimit } from "../../lib/limits"
import { runFraudChecks } from "../../lib/fraud"
import { logEvent } from "../../lib/events"
import { v4 as uuid } from "uuid"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const action = req.query.action

 try{

/*
------------------------------------------------
REGISTER USER
------------------------------------------------
*/

 if(action === "register"){

 const { phone,name } = req.body

 const userId = uuid()
 const accountNumber = generateNUBAN()

 await pool.query(
 `
 INSERT INTO users(id,name,phone)
 VALUES($1,$2,$3)
 `,
 [userId,name,phone]
 )

 await pool.query(
 `
 INSERT INTO accounts(id,user_id,account_number,balance)
 VALUES($1,$2,$3,0)
 `,
 [uuid(),userId,accountNumber]
 )

 return res.json({
 success:true,
 accountNumber
 })

}

/*
------------------------------------------------
CHECK BALANCE
------------------------------------------------
*/

 if(action === "balance"){

 const { phone } = req.body

 const result = await pool.query(
 `
 SELECT balance,account_number
 FROM accounts
 JOIN users ON users.id = accounts.user_id
 WHERE users.phone=$1
 `,
 [phone]
 )

 if(!result.rows.length){

 return res.json({found:false})

 }

 const account = result.rows[0]

 return res.json({
 found:true,
 balance:account.balance,
 accountNumber:account.account_number
 })

}

/*
------------------------------------------------
GET BANK LIST
------------------------------------------------
*/

 if(action === "banks"){

 const banks = [

 {code:"058",name:"Access Bank"},
 {code:"044",name:"Access Diamond"},
 {code:"214",name:"FCMB"},
 {code:"070",name:"Fidelity Bank"},
 {code:"011",name:"First Bank"},
 {code:"215",name:"Stanbic IBTC"},
 {code:"033",name:"UBA"},
 {code:"032",name:"Union Bank"},
 {code:"057",name:"Zenith Bank"}

 ]

 return res.json({banks})

}

/*
------------------------------------------------
ACCOUNT NAME LOOKUP
------------------------------------------------
*/

 if(action === "account-name"){

 const { accountNumber } = req.body

 const result = await pool.query(
 `
 SELECT users.name
 FROM accounts
 JOIN users ON users.id = accounts.user_id
 WHERE account_number=$1
 `,
 [accountNumber]
 )

 if(!result.rows.length){

 return res.json({found:false})

 }

 return res.json({
 found:true,
 name:result.rows[0].name
 })

}

/*
------------------------------------------------
REQUEST TRANSFER (OTP GENERATION)
------------------------------------------------
*/

 if(action === "request-transfer"){

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

 await logEvent("otp.generated",{phone})

 return res.json({
 success:true,
 otp
 })

}

/*
------------------------------------------------
CONFIRM TRANSFER
------------------------------------------------
*/

 if(action === "confirm-transfer"){

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

 await client.query(
 `
 DELETE FROM transfer_otps
 WHERE phone=$1 AND otp=$2
 `,
 [phone,otp]
 )

 await checkDailyLimit(fromAccount,amount)

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

 const fraud = await runFraudChecks(accountId,amount)

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

 await logEvent("transfer.completed",{
 txId,
 amount,
 fromAccount,
 toAccount
 })

 if(fraud.riskScore > 50){

 await logEvent("fraud.high_risk_transfer",{
 accountId,
 amount,
 riskScore:fraud.riskScore
 })

 }

 return res.json({
 success:true,
 txId,
 riskScore:fraud.riskScore
 })

 }catch(err){

 await client.query("ROLLBACK")

 const msg =
 err instanceof Error ? err.message : "Unknown error"

 return res.json({
 success:false,
 message:msg
 })

 }finally{

 client.release()

 }

}

/*
------------------------------------------------
RECEIPT GENERATION
------------------------------------------------
*/

 if(action === "receipt"){

 const { amount,toAccount } = req.body

 const message = `
Transfer Successful

Amount: ₦${amount}
Recipient: ${toAccount}

Thank you for banking with us.
`

 return res.json({message})

}

/*
------------------------------------------------
UNKNOWN ACTION
------------------------------------------------
*/

 return res.status(400).json({
 error:"Invalid action"
 })

 }catch(err){

 const msg =
 err instanceof Error ? err.message : "Unknown error"

 return res.status(500).json({
 error:msg
 })

 }

}