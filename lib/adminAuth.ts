import type { VercelRequest } from "@vercel/node"
import jwt from "jsonwebtoken"
import { AppError } from "./utils/errors"

export interface AdminClaims {
 sub: string
 role: string
}

export function verifyAdmin(req: VercelRequest): AdminClaims {
 const secret = process.env.JWT_SECRET
 if(!secret){
  throw new AppError("CONFIG_ERROR", "JWT_SECRET is not configured", 500)
 }

 const auth = req.headers.authorization
 if(!auth || !auth.startsWith("Bearer ")){
  throw new AppError("UNAUTHORIZED", "Missing or invalid Authorization header", 401)
 }

 const token = auth.slice(7)

 try{
  const claims = jwt.verify(token, secret) as jwt.JwtPayload
  if(claims.role !== "admin"){
   throw new AppError("FORBIDDEN", "Admin role required", 403)
  }
  return { sub: String(claims.sub), role: "admin" }
 }catch(err){
  if(err instanceof AppError) throw err
  throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401)
 }
}

export function mintAdminToken(sub: string, ttlSeconds = 3600): string {
 const secret = process.env.JWT_SECRET
 if(!secret) throw new AppError("CONFIG_ERROR", "JWT_SECRET is not configured", 500)
 return jwt.sign({ sub, role: "admin" }, secret, { expiresIn: ttlSeconds })
}
