import { pool } from "../../lib/db";

import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

 const { account } = req.query;

 const result = await pool.query(
   "SELECT balance FROM accounts WHERE account_number=$1",
   [account]
 );

 res.json(result.rows[0]);
}