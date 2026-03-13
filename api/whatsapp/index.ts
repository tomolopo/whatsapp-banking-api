import { VercelRequest, VercelResponse } from "@vercel/node"

import { getCustomers, getAccounts, getBanks } from "../../lib/admin/accounts"
import { getFraudAlerts } from "../../lib/admin/fraud"
import { getTransactions } from "../../lib/admin/transactions"

import { pool } from "../../lib/db"



export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

 const resource = req.query.resource as string

 if(!resource){

  return res.status(400).json({
   error:"resource parameter required"
  })

 }

 /*
 ===================================
 CUSTOMERS LIST
 ===================================
 */

 if(resource === "customers"){

  const search = (req.query.search as string) || ""
  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 10)

  const customers = await getCustomers(
   search,
   page,
   limit
  )

  return res.json({
   customers
  })

 }


 /*
 ===================================
 SINGLE CUSTOMER PROFILE
 ===================================
 */

 if(resource === "customer"){

  const id = req.query.id as string

  if(!id){

   return res.status(400).json({
    error:"customer id required"
   })

  }

  const result = await pool.query(
  `
  SELECT
   users.id,
   users.first_name,
   users.last_name,
   users.phone,
   users.address,
   users.created_at,

   accounts.account_number,
   accounts.balance

  FROM users

  LEFT JOIN accounts
   ON accounts.user_id = users.id

  WHERE users.id=$1
  `,
  [id]
  )

  if(!result.rows.length){

   return res.status(404).json({
    error:"Customer not found"
   })

  }

  return res.json({
   customer: result.rows[0]
  })

 }


 /*
 ===================================
 ACCOUNTS
 ===================================
 */

 if(resource === "accounts"){

  const accounts = await getAccounts()

  return res.json({
   accounts
  })

 }


 /*
 ===================================
 TRANSACTIONS
 ===================================
 */

 if(resource === "transactions"){

  const transactions = await getTransactions()

  return res.json({
   transactions
  })

 }


 /*
 ===================================
 FRAUD ALERTS
 ===================================
 */

 if(resource === "fraud"){

  const fraud = await getFraudAlerts()

  return res.json({
   fraud
  })

 }


 /*
 ===================================
 BANK LIST
 ===================================
 */

 if(resource === "banks"){

  const banks = await getBanks()

  return res.json({
   banks
  })

 }


 return res.status(404).json({
  error:"Unknown resource"
 })


 }catch(err){

 const message =
 err instanceof Error ? err.message : "Unknown error"

 return res.status(500).json({
  error: message
 })

 }

}