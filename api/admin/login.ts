import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(req.method !== "POST"){
  return res.status(405).json({error:"method not allowed"});
 }

 try{

  const {email,password} = req.body;

  const admin = await pool.query(
   "SELECT * FROM admins WHERE email=$1",
   [email]
  );

  if(admin.rows.length === 0){
   return res.status(401).json({error:"invalid credentials"});
  }

  const user = admin.rows[0];

  const valid = await bcrypt.compare(
   password,
   user.password_hash
  );

  if(!valid){
   return res.status(401).json({error:"invalid credentials"});
  }

  const token = jwt.sign(
   {
    adminId:user.id,
    role:user.role
   },
   process.env.JWT_SECRET!,
   {expiresIn:"8h"}
  );

  res.json({token});

 }catch(err){

  console.error(err);

  res.status(500).json({error:"login failed"});

 }

}