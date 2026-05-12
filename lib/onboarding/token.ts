import jwt from "jsonwebtoken"

const REGISTRATION_TTL = "10m"
const TRANSFER_TTL = "10m"

function secret(): string {
 const s = process.env.JWT_SECRET
 if(!s) throw new Error("JWT_SECRET is not configured")
 return s
}

export function generateToken(phone: string){
 return jwt.sign(
  { phone, purpose: "registration" },
  secret(),
  { expiresIn: REGISTRATION_TTL }
 )
}

export function verifyToken(token: string): string | null {
 try{
  const payload = jwt.verify(token, secret()) as jwt.JwtPayload
  if(payload.purpose !== "registration") return null
  return typeof payload.phone === "string" ? payload.phone : null
 }catch{
  return null
 }
}

export interface TransferPayload {
 phone: string
 fromAccount: string
 toAccount: string
 amount: number
}

export function generateTransferToken(p: TransferPayload){
 return jwt.sign(
  { ...p, purpose: "transfer" },
  secret(),
  { expiresIn: TRANSFER_TTL }
 )
}

export function verifyTransferToken(token: string): TransferPayload | null {
 try{
  const payload = jwt.verify(token, secret()) as jwt.JwtPayload
  if(payload.purpose !== "transfer") return null
  const { phone, fromAccount, toAccount, amount } = payload
  if(
   typeof phone !== "string" ||
   typeof fromAccount !== "string" ||
   typeof toAccount !== "string" ||
   typeof amount !== "number"
  ) return null
  return { phone, fromAccount, toAccount, amount }
 }catch{
  return null
 }
}
