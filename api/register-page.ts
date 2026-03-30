import { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { verifyToken } from "../lib/onboarding/token"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const { token } = req.query

 if(!token){
  return res.status(400).send("Invalid link")
 }

 // 🔐 VERIFY TOKEN
 const phone = verifyToken(token as string)

 if(!phone){
  return res.status(400).send("Invalid or expired token")
 }

 // 📄 LOAD HTML FILE
 const filePath = path.join(
  process.cwd(),
  "frontend",
  "register.html"
 )

 let html = fs.readFileSync(filePath, "utf8")

 // 🔥 INJECT TOKEN (NOT PHONE → more secure)
 html = html.replace("{{TOKEN}}", token as string)

 // 🔥 OPTIONAL: inject API base URL (for flexibility)
 html = html.replace(
  "{{API_BASE_URL}}",
  "https://whatsapp-banking-api.vercel.app"
 )

 res.setHeader("Content-Type", "text/html")
 res.status(200).send(html)

}