import { VercelRequest, VercelResponse } from "@vercel/node"

import { getCustomers } from "../../lib/admin/accounts"
import { getBanks } from "../../lib/admin/accounts"
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
 =========================
 CUSTOMERS
 =========================
 */

 if(resource === "customers"){

  const customers = await getCustomers()

  return res.json({
   customers
  })

 }

 /*
 =========================
 BANKS
 =========================
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