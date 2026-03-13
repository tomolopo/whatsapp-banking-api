import { VercelRequest,VercelResponse } from "@vercel/node"

import { getAccounts } from "../../lib/admin/accounts"
import { getTransactions } from "../../lib/admin/transactions"
import { getFraudAlerts } from "../../lib/admin/fraud"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const resource = req.query.resource

 try{

 if(resource === "accounts"){

  return res.json(await getAccounts())

 }

 if(resource === "transactions"){

  return res.json(await getTransactions())

 }

 if(resource === "fraud"){

  return res.json(await getFraudAlerts())

 }

 res.status(400).json({
  error:"Invalid admin resource"
 })

 }catch(err){

 const msg =
  err instanceof Error ? err.message : "Unknown error"

 res.status(500).json({error:msg})

 }

}