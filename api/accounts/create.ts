import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { v4 as uuid } from "uuid";
import { generateUniqueNUBAN } from "../../lib/nuban";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const { userId } = req.body;

  const accountNumber = await generateUniqueNUBAN();

  const accountId = uuid();

  await pool.query(
   `
   INSERT INTO accounts(id,user_id,account_number)
   VALUES($1,$2,$3)
   `,
   [
    accountId,
    userId,
    accountNumber
   ]
  );

  res.json({
   accountNumber
  });

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"account creation failed"
  });

 }

}