import { pool } from "../../lib/db";
import { v4 as uuid } from "uuid";

import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

 const { from, to, amount } = req.body;

 const tx = uuid();

 await pool.query("BEGIN");

 await pool.query(
   "UPDATE accounts SET balance = balance - $1 WHERE account_number=$2",
   [amount, from]
 );

 await pool.query(
   "UPDATE accounts SET balance = balance + $1 WHERE account_number=$2",
   [amount, to]
 );

 await pool.query(
   "INSERT INTO transactions(id,type,amount,status) VALUES($1,$2,$3,$4)",
   [tx, "transfer", amount, "success"]
 );

 await pool.query("COMMIT");

 res.json({ status: "success" });
}