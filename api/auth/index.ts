import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const action = req.query.action;

 try{

  if(action === "register"){

   const {name,phone,pin} = req.body;

   const hash = await bcrypt.hash(pin,10);

   const userId = uuid();

   await pool.query(
    `
    INSERT INTO users(id,name,phone,pin_hash)
    VALUES($1,$2,$3,$4)
    `,
    [userId,name,phone,hash]
   );

   res.json({status:"registered"});

  }

  else if(action === "login"){

   const {phone,pin} = req.body;

   const result = await pool.query(
    "SELECT * FROM users WHERE phone=$1",
    [phone]
   );

   if(!result.rows.length){
    return res.status(401).json({error:"user not found"});
   }

   const user = result.rows[0];

   const valid = await bcrypt.compare(pin,user.pin_hash);

   if(!valid){
    return res.status(401).json({error:"invalid pin"});
   }

   const token = jwt.sign(
    {userId:user.id},
    process.env.JWT_SECRET!,
    {expiresIn:"7d"}
   );

   res.json({token});

  }

  else{

   res.status(400).json({error:"invalid action"});

  }

 }catch(err){

  console.error(err);
  res.status(500).json({error:"server error"});

 }

}