import { VercelRequest, VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

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

   return res.json({
    found:false
   })

  }

  const account = result.rows[0]

  res.json({
   found:true,
   balance:account.balance,
   accountNumber:account.account_number
  })

 }catch(err){

  console.log(err)

  res.status(500).json({
   error:true
  })

 }

}