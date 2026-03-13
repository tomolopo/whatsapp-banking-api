import { VercelRequest, VercelResponse } from "@vercel/node"
import { pool } from "../../lib/db"
import { v4 as uuid } from "uuid"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const {
  fromAccount,
  toAccount,
  amount
 } = req.body

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  const balance = await client.query(
  `
  SELECT balance
  FROM accounts
  WHERE account_number=$1
  `,
  [fromAccount]
  )

  if(!balance.rows.length){

   throw new Error("Account not found")

  }

  if(balance.rows[0].balance < amount){

   throw new Error("Insufficient balance")

  }

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

  await client.query(
  `
  INSERT INTO transactions(id,amount,status)
  VALUES($1,$2,$3)
  `,
  [uuid(),amount,"completed"]
  )

  await client.query("COMMIT")

  res.json({
   success:true
  })

 }catch(err){

  await client.query("ROLLBACK")

  const errorMessage =
  err instanceof Error ? err.message : "Unknown error"

  res.json({
   success:false,
   code:"INSUFFICIENT_FUNDS",
   message:errorMessage
  })

 }finally{

  client.release()

 }

}