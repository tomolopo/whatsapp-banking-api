import { pool } from "../../lib/db";

export default async function handler(req, res) {

 const { account } = req.query;

 const result = await pool.query(
   "SELECT balance FROM accounts WHERE account_number=$1",
   [account]
 );

 res.json(result.rows[0]);
}