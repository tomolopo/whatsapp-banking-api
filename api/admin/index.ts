import { VercelRequest, VercelResponse } from "@vercel/node"

import { getCustomers, getAccounts, getBanks } from "../../lib/admin/accounts"
import { getFraudAlerts } from "../../lib/admin/fraud"
import { getTransactions } from "../../lib/admin/transactions"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
) {

 // ✅ CORS FIX
 res.setHeader("Access-Control-Allow-Origin", "*")
 res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
 res.setHeader("Access-Control-Allow-Headers", "Content-Type")

 if(req.method === "OPTIONS"){
  return res.status(200).end()
 }

 try {

  const resource = req.query.resource as string
  const search = (req.query.search as string) || ""
  const limit = Number(req.query.limit || 10)
  const offset = Number(req.query.offset || 0)

  if(!resource){
   return res.status(400).json({
    error: "resource parameter required"
   })
  }

  // CUSTOMERS
  if(resource === "customers"){

   const customers = await getCustomers(search,limit,offset)

   return res.json({
    customers
   })

  }

  // ACCOUNTS
  if(resource === "accounts"){

   const accounts = await getAccounts()

   return res.json({
    accounts
   })

  }

  // BANKS
  if(resource === "banks"){

   const banks = await getBanks()

   return res.json({
    banks
   })

  }

  // FRAUD
  if(resource === "fraud"){

   const fraud = await getFraudAlerts()

   return res.json({
    fraud
   })

  }

  // TRANSACTIONS
  if(resource === "transactions"){

   const transactions = await getTransactions()

   return res.json({
    transactions
   })

  }

  return res.status(400).json({
   error:"invalid resource"
  })

 } catch(err){

  console.error(err)

  return res.status(500).json({
   error:"internal server error"
  })

 }

}