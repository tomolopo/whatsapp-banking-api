import { VercelRequest, VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

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

  return res.json({
   found:false
  })

 }

 res.json({
  found:true,
  name:result.rows[0].name
 })

}