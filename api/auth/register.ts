import { pool } from "../../lib/db";
import { redis } from "../../lib/redis";
import { v4 as uuid } from "uuid";

import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

 if (req.method !== "POST") {
   return res.status(405).end();
 }

 const { phone, name } = req.body;

 const userId = uuid();

 await pool.query(
   "INSERT INTO users(id,phone,name) VALUES($1,$2,$3)",
   [userId, phone, name]
 );

 const otp = Math.floor(100000 + Math.random() * 900000);

 await redis.set(`otp:${phone}`, otp, { ex: 300 });

 res.json({
   message: "OTP sent",
   otp
 });
}