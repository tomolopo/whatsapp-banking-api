import { VercelRequest, VercelResponse } from "@vercel/node"

import { registerUser } from "../../lib/auth/registerUser"
import { validatePin } from "../../lib/auth/validatePin"

import { createAccount } from "../../lib/accounts/createAccount"
import { getBalance } from "../../lib/accounts/balance"

import { internalTransfer } from "../../lib/transfers/internal"

import { getTransactionHistory } from "../../lib/transactions/history"

import { getBanks } from "../../lib/admin/accounts"



export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

 const action = req.query.action as string

 if(!action){

  return res.status(400).json({
   error:"action parameter required"
  })

 }

 /*
 =============================
 REGISTER USER
 =============================
 */

 if(action === "register"){

  const {
   phone,
   firstName,
   lastName,
   address,
   pin
  } = req.body

  if(!phone || !pin){

   return res.status(400).json({
    error:"phone and pin required"
   })

  }

  if(pin.length !== 4){

   return res.status(400).json({
    error:"PIN must be 4 digits"
   })

  }

  const user = await registerUser(
   phone,
   firstName,
   lastName,
   address,
   pin
  )

  return res.json({
   success:true,
   user
  })

 }


 /*
 =============================
 CREATE ACCOUNT
 =============================
 */

 if(action === "create-account"){

  const { phone } = req.body

  if(!phone){

   return res.status(400).json({
    error:"phone required"
   })

  }

  const account = await createAccount(phone)

  return res.json({
   success:true,
   account
  })

 }


 /*
 =============================
 GET BALANCE
 =============================
 */

 if(action === "balance"){

  const { accountNumber } = req.body

  const balance = await getBalance(accountNumber)

  return res.json({
   success:true,
   balance
  })

 }


 /*
 =============================
 TRANSFER
 =============================
 */

 if(action === "transfer"){

  const {
   phone,
   fromAccount,
   toAccount,
   amount,
   pin
  } = req.body


  if(!phone || !pin){

   return res.status(400).json({
    error:"phone and pin required"
   })

  }


  const validPin = await validatePin(phone,pin)

  if(!validPin){

   return res.status(403).json({
    error:"Invalid PIN"
   })

  }


  const tx = await internalTransfer(
   fromAccount,
   toAccount,
   amount
  )


  return res.json({
   success:true,
   transaction:tx
  })

 }


 /*
 =============================
 TRANSACTION HISTORY
 =============================
 */

 if(action === "transactions"){

  const { accountNumber } = req.body

  const tx = await getTransactionHistory(accountNumber)

  return res.json({
   success:true,
   transactions:tx
  })

 }


 /*
 =============================
 BANK LIST
 =============================
 */

 if(action === "banks"){

  const banks = await getBanks()

  return res.json({
   success:true,
   banks
  })

 }



 return res.status(404).json({
  error:"Unknown action"
 })


 }catch(err){

  const message =
  err instanceof Error ? err.message : "Unknown error"

  return res.status(500).json({
   error:message
  })

 }

}