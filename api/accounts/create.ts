import { pool } from "../../lib/db";
import { v4 as uuid } from "uuid";
import { VercelRequest, VercelResponse } from "@vercel/node";

function generateAccount() {
 return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}


export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

 const { userId } = req.body;

 const accountNumber = generateAccount();

 const id = uuid();

 await pool.query(
   "INSERT INTO accounts(id,user_id,account_number) VALUES($1,$2,$3)",
   [id, userId, accountNumber]
 );

 res.json({
   accountNumber
 });

}