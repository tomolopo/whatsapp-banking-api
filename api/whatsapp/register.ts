import { VercelRequest, VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"
import { v4 as uuid } from "uuid"
import { generateNUBAN } from "../../lib/nuban"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const { phone, name } = req.body

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

  res.json({
   success:true,
   accountNumber
  })

 }catch(err){

  console.log(err)

  res.status(500).json({
   success:false
  })

 }

}