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

 const phone = verifyToken(token as string)

 if(!phone){
  return res.status(400).send("Invalid or expired token")
 }

 // load HTML
 const filePath = path.join(
  process.cwd(),
  "frontend",
  "register.html"
 )

 let html = fs.readFileSync(filePath, "utf8")

 // inject phone securely into page
 html = html.replace("{{PHONE}}", phone)

 res.setHeader("Content-Type", "text/html")
 res.status(200).send(html)

}