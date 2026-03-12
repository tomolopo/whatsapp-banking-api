import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { postTransaction, getAccountBalance } from "../../lib/ledger";
import { v4 as uuid } from "uuid";
import { runFraudChecks } from "../../lib/fraud";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(req.method !== "POST"){
  return res.status(405).json({
   error:"method not allowed"
  });
 }

 try{

  const idempotencyKey = req.headers["idempotency-key"] as string;

  if(!idempotencyKey){
   return res.status(400).json({
    error:"missing idempotency key"
   });
  }

  /*
  STEP 1
  Check idempotency
  */

  const existing = await pool.query(
   "SELECT response FROM idempotency_keys WHERE key=$1",
   [idempotencyKey]
  );

  if(existing.rows.length){

   return res.json(existing.rows[0].response);

  }

  /*
  STEP 2
  Extract parameters
  */

  const {fromAccount,toAccount,amount} = req.body;

  if(!fromAccount || !toAccount || !amount){

   return res.status(400).json({
    error:"missing parameters"
   });

  }

  /*
  STEP 3
  Resolve account IDs
  */

  const from = await pool.query(
   "SELECT id FROM accounts WHERE account_number=$1",
   [fromAccount]
  );

  const to = await pool.query(
   "SELECT id FROM accounts WHERE account_number=$1",
   [toAccount]
  );

  if(from.rows.length === 0 || to.rows.length === 0){

   return res.status(404).json({
    error:"account not found"
   });

  }

  const fromId = from.rows[0].id;
  const toId = to.rows[0].id;

  /*
  STEP 4
  Check balance
  */

  const balance = await getAccountBalance(fromId);

  if(balance < amount){

   return res.status(400).json({
    error:"insufficient funds"
   });

  }

  /*
  STEP 5
  Execute ledger transfer
  */

  const txId = await postTransaction(
   fromId,
   toId,
   amount
  );

  /*
  STEP 6
  Publish event
  */

  await pool.query(
   `
   INSERT INTO events(id,type,payload,status)
   VALUES($1,$2,$3,$4)
   `,
   [
    uuid(),
    "transfer.completed",
    JSON.stringify({
     transactionId: txId,
     amount,
     fromAccount,
     toAccount
    }),
    "pending"
   ]
  );

  const response = {
   status:"success",
   transactionId:txId
  };

  /*
  STEP 7
  Save idempotency response
  */

  await pool.query(
   `
   INSERT INTO idempotency_keys(id,key,response)
   VALUES($1,$2,$3)
   `,
   [
    uuid(),
    idempotencyKey,
    response
   ]
  );

  /*
  STEP 8
  Return response
  */

  res.json(response);

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"transfer failed"
  });

 }

}