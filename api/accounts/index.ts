import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { v4 as uuid } from "uuid";
import { generateNUBAN } from "../../lib/nuban";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const action = req.query.action;

 try{

  if(action === "create"){

   const {userId} = req.body;

   const accountNumber = generateNUBAN();

   const accountId = uuid();

   await pool.query(
    `
    INSERT INTO accounts(id,user_id,account_number,balance)
    VALUES($1,$2,$3,0)
    `,
    [accountId,userId,accountNumber]
   );

   res.json({accountNumber});

  }

  else if(action === "balance"){

   const account = req.query.account;

   const result = await pool.query(
    `
    SELECT balance
    FROM accounts
    WHERE account_number=$1
    `,
    [account]
   );

   res.json({balance:result.rows[0]?.balance || 0});

  }

  else{

   res.status(400).json({error:"invalid action"});

  }

 }catch(err){

  console.error(err);
  res.status(500).json({error:"server error"});

 }

}