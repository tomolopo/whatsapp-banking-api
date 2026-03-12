import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { verifyAdmin } from "../../lib/adminAuth";



export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const accounts = await pool.query(
 `
 SELECT
 accounts.account_number,
 users.name,
 users.phone,
 accounts.created_at
 FROM accounts
 JOIN users
 ON users.id = accounts.user_id
 `
 );

 res.json(accounts.rows);

}