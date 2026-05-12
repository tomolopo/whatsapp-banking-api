import type { VercelRequest, VercelResponse } from "@vercel/node"

import { getCustomers, getAccounts, getBanks } from "../../lib/admin/accounts"
import { getFraudAlerts } from "../../lib/admin/fraud"
import { getTransactions } from "../../lib/admin/transactions"
import { verifyAdmin } from "../../lib/adminAuth"
import { applyCors } from "../../lib/utils/cors"
import { sendError } from "../../lib/utils/response"
import { AppError } from "../../lib/utils/errors"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(applyCors(req, res, ["GET", "OPTIONS"])) return

 try{
  verifyAdmin(req)

  const resource = req.query.resource as string
  const search = (req.query.search as string) || ""
  const limit = Number(req.query.limit || 10)
  const offset = Number(req.query.offset || 0)

  if(!resource){
   throw new AppError("BAD_REQUEST", "resource parameter required", 400)
  }

  if(resource === "customers"){
   return res.json({ customers: await getCustomers(search, limit, offset) })
  }
  if(resource === "accounts"){
   return res.json({ accounts: await getAccounts() })
  }
  if(resource === "banks"){
   return res.json({ banks: await getBanks() })
  }
  if(resource === "fraud"){
   return res.json({ fraud: await getFraudAlerts() })
  }
  if(resource === "transactions"){
   return res.json({ transactions: await getTransactions() })
  }

  throw new AppError("BAD_REQUEST", "invalid resource", 400)

 }catch(err){
  console.error("Admin handler error:", err)
  return sendError(res, "admin", err)
 }
}
