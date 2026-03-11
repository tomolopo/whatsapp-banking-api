import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
) {

 try {

  const result = await pool.query("SELECT NOW()");

  res.json(result.rows);

 } catch (err) {

  console.error(err);

  res.status(500).json({ error: "server error" });

 }

}