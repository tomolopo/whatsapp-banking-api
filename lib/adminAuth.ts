import jwt from "jsonwebtoken";

export function verifyAdmin(req:any){

 const auth = req.headers.authorization;

 if(!auth){
  throw new Error("missing auth header");
 }

 const token = auth.split(" ")[1];

 return jwt.verify(
  token,
  process.env.JWT_SECRET!
 );

}